"""
Evaluate trained screening models on test set.

Computes comprehensive metrics and generates visualizations.

Usage:
    python evaluate.py --model-dir ../models --output-dir ../metrics
"""

import os
import sys
import json
import joblib
import argparse
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    confusion_matrix, classification_report, brier_score_loss
)
import time


def load_model(model_path):
    """Load trained model"""
    return joblib.load(model_path)


def load_test_data(data_type='PHQ9'):
    """Load test data"""
    script_dir = Path(__file__).parent
    processed_dir = script_dir.parent / 'data' / 'processed'
    file_suffix = 'phq9' if data_type == 'PHQ9' else 'gad7'
    
    test_df = pd.read_csv(processed_dir / f'test_{file_suffix}.csv')
    
    y_test = test_df['severity_label']
    X_test = test_df.drop(['severity_label'], axis=1, errors='ignore')
    
    return X_test, y_test


def plot_confusion_matrix(cm, labels, save_path):
    """Plot and save confusion matrix"""
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"Confusion matrix saved to: {save_path}")


def evaluate_model(model, X_test, y_test, model_type='PHQ9'):
    """
    Evaluate model performance.
    
    Returns:
        Dictionary of metrics
    """
    print(f"\nEvaluating {model_type} model...")
    
    # Measure inference latency
    start = time.time()
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)
    latency = (time.time() - start) / len(X_test)
    
    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    f1_macro = f1_score(y_test, y_pred, average='macro', zero_division=0)
    f1_weighted = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    precision_macro = precision_score(y_test, y_pred, average='macro', zero_division=0)
    recall_macro = recall_score(y_test, y_pred, average='macro', zero_division=0)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    
    # Per-class metrics
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    
    # Calibration (Brier score for multi-class)
    # One-hot encode true labels
    n_classes = len(np.unique(y_test))
    y_test_onehot = np.zeros((len(y_test), n_classes))
    for i, val in enumerate(y_test):
        y_test_onehot[i, int(val)] = 1
    
    brier = np.mean(np.sum((y_test_onehot - y_pred_proba) ** 2, axis=1))
    
    metrics = {
        'model_type': model_type,
        'accuracy': float(accuracy),
        'f1_macro': float(f1_macro),
        'f1_weighted': float(f1_weighted),
        'precision_macro': float(precision_macro),
        'recall_macro': float(recall_macro),
        'brier_score': float(brier),
        'inference_latency_ms': float(latency * 1000),
        'n_test_samples': len(X_test),
        'confusion_matrix': cm.tolist(),
        'per_class_metrics': {}
    }
    
    # Extract per-class metrics
    for class_label, class_metrics in report.items():
        if isinstance(class_metrics, dict) and class_label not in ['accuracy', 'macro avg', 'weighted avg']:
            metrics['per_class_metrics'][class_label] = {
                'precision': class_metrics['precision'],
                'recall': class_metrics['recall'],
                'f1-score': class_metrics['f1-score'],
                'support': class_metrics['support']
            }
    
    # Print summary
    print(f"\n{model_type} Test Metrics:")
    print(f"  Accuracy: {accuracy:.4f}")
    print(f"  F1 (macro): {f1_macro:.4f}")
    print(f"  Precision (macro): {precision_macro:.4f}")
    print(f"  Recall (macro): {recall_macro:.4f}")
    print(f"  Brier Score: {brier:.4f}")
    print(f"  Latency (avg): {latency*1000:.2f} ms")
    
    # Check thresholds
    print(f"\nThreshold Checks:")
    thresholds_met = True
    
    if f1_macro < 0.85:
        print(f"  ⚠️  F1-macro ({f1_macro:.4f}) < 0.85 threshold")
        thresholds_met = False
    else:
        print(f"  ✅ F1-macro ({f1_macro:.4f}) >= 0.85")
    
    if brier > 0.10:
        print(f"  ⚠️  Brier score ({brier:.4f}) > 0.10 threshold")
        thresholds_met = False
    else:
        print(f"  ✅ Brier score ({brier:.4f}) <= 0.10")
    
    # Check recall for severe class (highest class number)
    severe_class = str(max([int(k) for k in metrics['per_class_metrics'].keys()]))
    if severe_class in metrics['per_class_metrics']:
        severe_recall = metrics['per_class_metrics'][severe_class]['recall']
        if severe_recall < 0.90:
            print(f"  ⚠️  Severe class recall ({severe_recall:.4f}) < 0.90 threshold")
            thresholds_met = False
        else:
            print(f"  ✅ Severe class recall ({severe_recall:.4f}) >= 0.90")
    
    metrics['thresholds_met'] = thresholds_met
    
    return metrics


def main():
    parser = argparse.ArgumentParser(description='Evaluate screening models')
    parser.add_argument('--model-dir', default='../models', help='Model directory')
    parser.add_argument('--output-dir', default='../metrics', help='Output directory for metrics')
    
    args = parser.parse_args()
    
    model_dir = Path(args.model_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    all_metrics = {}
    
    # Evaluate PHQ-9 model
    phq9_model_path = model_dir / 'screening_phq9.pkl'
    if phq9_model_path.exists():
        try:
            model_phq9 = load_model(phq9_model_path)
            X_test_phq9, y_test_phq9 = load_test_data('PHQ9')
            metrics_phq9 = evaluate_model(model_phq9, X_test_phq9, y_test_phq9, 'PHQ9')
            all_metrics['PHQ9'] = metrics_phq9
            
            # Plot confusion matrix
            cm_phq9 = np.array(metrics_phq9['confusion_matrix'])
            labels_phq9 = ['none', 'mild', 'moderate', 'mod-severe', 'severe'][:cm_phq9.shape[0]]
            plot_confusion_matrix(
                cm_phq9,
                labels_phq9,
                output_dir / 'confusion_matrix_phq9.png'
            )
        except Exception as e:
            print(f"Error evaluating PHQ-9 model: {e}")
    else:
        print(f"PHQ-9 model not found at {phq9_model_path}")
    
    # Evaluate GAD-7 model
    gad7_model_path = model_dir / 'screening_gad7.pkl'
    if gad7_model_path.exists():
        try:
            model_gad7 = load_model(gad7_model_path)
            X_test_gad7, y_test_gad7 = load_test_data('GAD7')
            metrics_gad7 = evaluate_model(model_gad7, X_test_gad7, y_test_gad7, 'GAD7')
            all_metrics['GAD7'] = metrics_gad7
            
            # Plot confusion matrix
            cm_gad7 = np.array(metrics_gad7['confusion_matrix'])
            labels_gad7 = ['none', 'mild', 'moderate', 'severe'][:cm_gad7.shape[0]]
            plot_confusion_matrix(
                cm_gad7,
                labels_gad7,
                output_dir / 'confusion_matrix_gad7.png'
            )
        except Exception as e:
            print(f"Error evaluating GAD-7 model: {e}")
    else:
        print(f"GAD-7 model not found at {gad7_model_path}")
    
    # Save metrics
    metrics_file = output_dir / 'eval_metrics.json'
    with open(metrics_file, 'w') as f:
        json.dump(all_metrics, f, indent=2)
    
    print(f"\n✅ Evaluation complete!")
    print(f"Metrics saved to: {metrics_file.absolute()}")
    
    # Final summary
    print(f"\n{'='*60}")
    print("EVALUATION SUMMARY")
    print(f"{'='*60}")
    for model_type, metrics in all_metrics.items():
        status = "✅ PASSED" if metrics['thresholds_met'] else "⚠️  NEEDS IMPROVEMENT"
        print(f"{model_type}: {status} (F1={metrics['f1_macro']:.4f})")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
