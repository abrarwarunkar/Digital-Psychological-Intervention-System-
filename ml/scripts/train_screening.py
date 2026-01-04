"""
Train LightGBM screening classifiers for PHQ-9 and GAD-7.

Features:
    - Separate models for each screening type
    - Multi-class classification (severity levels)
    - SHAP explainability
    - MLflow experiment tracking
    - Model artifact saving

Usage:
    python train_screening.py --config ../params.yaml
"""

import os
import sys
import yaml
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import lightgbm as lgb
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    confusion_matrix, classification_report
)
import shap
import mlflow
import mlflow.sklearn
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Setup MLflow
MLFLOW_URI = os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5002')
USE_MLFLOW = True

class DummyMLflow:
    def set_tracking_uri(self, uri): pass
    def set_experiment(self, name): pass
    def start_run(self, run_name=None): 
        from contextlib import nullcontext
        return nullcontext()
    def log_params(self, params): pass
    def log_param(self, key, value): pass
    def log_metric(self, key, value): pass
    def log_artifact(self, local_path): pass
    def log_artifacts(self, local_dir, artifact_path=None): pass
    def sklearn(self): return self
    def log_model(self, model, artifact_path, registered_model_name=None): pass
    def active_run(self): 
        class Info:
            run_id = "dummy_run_id"
        class Run:
            info = Info()
        return Run()

try:
    import mlflow
    mlflow.set_tracking_uri(MLFLOW_URI)
    # Test connection
    mlflow.search_experiments()
except Exception as e:
    print(f"⚠️ MLflow not available: {e}")
    print("Running in standalone mode (no experiment tracking)")
    USE_MLFLOW = False
    mlflow = DummyMLflow()
    mlflow.sklearn = DummyMLflow()


def load_config(config_path=None):
    """Load training configuration"""
    if config_path is None:
        script_dir = Path(__file__).parent
        config_path = script_dir.parent / 'params.yaml'
    
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config


def load_data(data_type='PHQ9'):
    """
    Load preprocessed training data.
    
    Args:
        data_type: 'PHQ9' or 'GAD7'
    
    Returns:
        X_train, y_train, X_test, y_test
    """
    script_dir = Path(__file__).parent
    processed_dir = script_dir.parent / 'data' / 'processed'
    
    file_suffix = 'phq9' if data_type == 'PHQ9' else 'gad7'
    
    train_df = pd.read_csv(processed_dir / f'train_{file_suffix}.csv')
    test_df = pd.read_csv(processed_dir / f'test_{file_suffix}.csv')
    
    # Separate features and target
    y_train = train_df['severity_label']
    X_train = train_df.drop(['severity_label'], axis=1, errors='ignore')
    
    y_test = test_df['severity_label']
    X_test = test_df.drop(['severity_label'], axis=1, errors='ignore')
    
    print(f"Loaded {data_type} data:")
    print(f"  Train: {len(X_train)} samples")
    print(f"  Test: {len(X_test)} samples")
    print(f"  Features: {X_train.shape[1]}")
    print(f"  Classes: {np.unique(y_train)}")
    
    return X_train, y_train, X_test, y_test


def train_model(X_train, y_train, X_test, y_test, config, model_type='PHQ9'):
    """
    Train LightGBM classifier with MLflow tracking.
    
    Args:
        X_train, y_train: Training data
        X_test, y_test: Test data
        config: Training configuration
        model_type: 'PHQ9' or 'GAD7'
    
    Returns:
        Trained model
    """
    experiment_name = config['mlflow']['experiment_name']
    mlflow.set_experiment(experiment_name)
    
    with mlflow.start_run(run_name=f"{model_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
        # Log parameters
        params = config['train']
        mlflow.log_params(params)
        mlflow.log_param('model_type', model_type)
        mlflow.log_param('n_train_samples', len(X_train))
        mlflow.log_param('n_features', X_train.shape[1])
        
        # Determine number of classes
        n_classes = len(np.unique(y_train))
        
        # Train model
        print(f"\nTraining {model_type} classifier...")
        model = lgb.LGBMClassifier(
            objective='multiclass',
            num_class=n_classes,
            learning_rate=params['learning_rate'],
            n_estimators=params['n_estimators'],
            max_depth=params['max_depth'],
            random_state=params['random_state'],
            verbose=-1
        )
        
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        # Metrics
        accuracy = accuracy_score(y_test, y_pred)
        f1_macro = f1_score(y_test, y_pred, average='macro')
        precision_macro = precision_score(y_test, y_pred, average='macro', zero_division=0)
        recall_macro = recall_score(y_test, y_pred, average='macro', zero_division=0)
        
        # Log metrics
        mlflow.log_metric('accuracy', accuracy)
        mlflow.log_metric('f1_macro', f1_macro)
        mlflow.log_metric('precision_macro', precision_macro)
        mlflow.log_metric('recall_macro', recall_macro)
        
        print(f"\nTest Metrics:")
        print(f"  Accuracy: {accuracy:.4f}")
        print(f"  F1 (macro): {f1_macro:.4f}")
        print(f"  Precision (macro): {precision_macro:.4f}")
        print(f"  Recall (macro): {recall_macro:.4f}")
        
        # Per-class metrics
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        for class_label, metrics in report.items():
            if isinstance(metrics, dict):
                mlflow.log_metric(f'f1_class_{class_label}', metrics['f1-score'])
                mlflow.log_metric(f'recall_class_{class_label}', metrics['recall'])
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        print(f"\nConfusion Matrix:\n{cm}")
        
        # SHAP explainability
        print("\nComputing SHAP values...")
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test[:100])  # Sample for speed
        
        # Log feature importance
        feature_importance = pd.DataFrame({
            'feature': X_train.columns,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\nTop 5 Important Features:")
        print(feature_importance.head())
        
        # Save model
        script_dir = Path(__file__).parent
        models_dir = script_dir.parent / 'models'
        models_dir.mkdir(parents=True, exist_ok=True)
        
        model_filename = f'screening_{model_type.lower()}.pkl'
        model_path = models_dir / model_filename
        joblib.dump(model, model_path)
        
        print(f"\nModel saved to: {model_path.absolute()}")
        
        # Log model to MLflow
        mlflow.sklearn.log_model(
            model,
            artifact_path="model",
            registered_model_name=f"screening-{model_type.lower()}"
        )
        
        # Log artifacts
        mlflow.log_artifact(str(model_path))
        
        # Save SHAP explainer
        explainer_path = models_dir / f'shap_explainer_{model_type.lower()}.pkl'
        joblib.dump(explainer, explainer_path)
        mlflow.log_artifact(str(explainer_path))
        
        print(f"\n✅ Training complete for {model_type}")
        print(f"MLflow Run ID: {mlflow.active_run().info.run_id}")
        
        return model


def main():
    """Main training pipeline"""
    # Load config
    config = load_config()
    
    print("="*60)
    print("SCREENING CLASSIFIER TRAINING")
    print("="*60)
    
    # Train PHQ-9 model
    try:
        X_train_phq9, y_train_phq9, X_test_phq9, y_test_phq9 = load_data('PHQ9')
        model_phq9 = train_model(
            X_train_phq9, y_train_phq9,
            X_test_phq9, y_test_phq9,
            config, 'PHQ9'
        )
    except FileNotFoundError:
        print("\n⚠️  PHQ-9 data not found. Skipping PHQ-9 training.")
    
    print("\n" + "="*60 + "\n")
    
    # Train GAD-7 model
    try:
        X_train_gad7, y_train_gad7, X_test_gad7, y_test_gad7 = load_data('GAD7')
        model_gad7 = train_model(
            X_train_gad7, y_train_gad7,
            X_test_gad7, y_test_gad7,
            config, 'GAD7'
        )
    except FileNotFoundError:
        print("\n⚠️  GAD-7 data not found. Skipping GAD-7 training.")
    
    print("\n" + "="*60)
    print("✅ Training pipeline complete!")
    print(f"MLflow UI: {MLFLOW_URI}")
    print("="*60)


if __name__ == '__main__':
    main()
