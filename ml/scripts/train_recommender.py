"""
Train Hybrid Recommender System.

Features:
    - LightFM hybrid model (Collaborative + Content-based)
    - Uses user features (screening scores, demographics)
    - Uses item features (resource tags, categories)
    - Handles cold start for new users
    - MLflow tracking

Usage:
    python train_recommender.py
"""

import os
import yaml
import mlflow
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from lightfm import LightFM
from lightfm.data import Dataset
from lightfm.evaluation import precision_at_k, auc_score
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

def load_config():
    script_dir = Path(__file__).parent
    config_path = script_dir.parent / 'params.yaml'
    # Fallback if params.yaml doesn't exist or doesn't have recommender section
    default_config = {
        'recommender': {
            'learning_rate': 0.05,
            'loss': 'warp',
            'no_components': 30,
            'epochs': 10
        }
    }
    
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            if 'recommender' in config:
                return config
    
    return default_config

def generate_synthetic_interactions(n_users=100, n_items=50):
    """Generate synthetic user-item interactions for training"""
    print("Generating synthetic interactions...")
    
    interactions = []
    
    # User features (0: low risk, 1: high risk)
    user_risk = np.random.choice([0, 1], size=n_users, p=[0.7, 0.3])
    
    # Item categories (0: general, 1: crisis/anxiety)
    item_categories = np.random.choice([0, 1], size=n_items, p=[0.6, 0.4])
    
    for u in range(n_users):
        # Determine number of interactions for this user
        n_inter = np.random.randint(1, 10)
        
        for _ in range(n_inter):
            i = np.random.randint(0, n_items)
            
            # Logic: High risk users prefer crisis items
            if user_risk[u] == 1 and item_categories[i] == 1:
                rating = np.random.choice([4, 5])
            elif user_risk[u] == 0 and item_categories[i] == 0:
                rating = np.random.choice([3, 4, 5])
            else:
                rating = np.random.choice([1, 2, 3])
                
            interactions.append({
                'user_id': u,
                'item_id': i,
                'rating': rating,
                'timestamp': datetime.now()
            })
            
    return pd.DataFrame(interactions), user_risk, item_categories

def main():
    print("="*60)
    print("RECOMMENDER SYSTEM TRAINING (LightFM)")
    print("="*60)
    
    config = load_config()
    params = config['recommender']
    
    # 1. Load/Generate Data
    # In a real scenario, load from DB. Here we generate synthetic data.
    df_interactions, user_features_raw, item_features_raw = generate_synthetic_interactions()
    
    print(f"Loaded {len(df_interactions)} interactions")
    
    # 2. Prepare Dataset
    dataset = Dataset()
    
    # Fit dataset (create mappings)
    dataset.fit(
        users=df_interactions['user_id'].unique(),
        items=df_interactions['item_id'].unique(),
        user_features=[f"risk_{r}" for r in np.unique(user_features_raw)],
        item_features=[f"cat_{c}" for c in np.unique(item_features_raw)]
    )
    
    # Build interactions matrix
    (interactions, weights) = dataset.build_interactions(
        (x['user_id'], x['item_id'], x['rating']) 
        for index, x in df_interactions.iterrows()
    )
    
    # Build feature matrices
    # (Simplified for demo: mapping user ID to their risk feature)
    user_features_list = []
    for u_id, risk in enumerate(user_features_raw):
        if u_id in dataset.mapping()[0]: # Check if user exists in interactions
             user_features_list.append((u_id, [f"risk_{risk}"]))

    item_features_list = []
    for i_id, cat in enumerate(item_features_raw):
        if i_id in dataset.mapping()[2]: # Check if item exists in interactions
            item_features_list.append((i_id, [f"cat_{cat}"]))

    user_features = dataset.build_user_features(user_features_list)
    item_features = dataset.build_item_features(item_features_list)
    
    # 3. Train Model
    model = LightFM(
        learning_rate=params.get('learning_rate', 0.05),
        loss=params.get('loss', 'warp'),
        no_components=params.get('no_components', 30)
    )
    
    # MLflow tracking
    mlflow.set_experiment("recommender-system")
    
    with mlflow.start_run(run_name=f"lightfm_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
        mlflow.log_params(params)
        
        print("\nStarting training...")
        model.fit(
            interactions,
            user_features=user_features,
            item_features=item_features,
            epochs=params.get('epochs', 10),
            num_threads=2,
            verbose=True
        )
        
        # 4. Evaluate
        print("\nEvaluating...")
        train_precision = precision_at_k(model, interactions, k=5, user_features=user_features, item_features=item_features).mean()
        train_auc = auc_score(model, interactions, user_features=user_features, item_features=item_features).mean()
        
        print(f"Train Precision@5: {train_precision:.4f}")
        print(f"Train AUC: {train_auc:.4f}")
        
        mlflow.log_metric("precision_at_k", train_precision)
        mlflow.log_metric("auc", train_auc)
        
        # 5. Save Model
        script_dir = Path(__file__).parent
        models_dir = script_dir.parent / 'models' / 'recommender'
        models_dir.mkdir(parents=True, exist_ok=True)
        
        import pickle
        print(f"\nSaving model to {models_dir}...")
        
        with open(models_dir / 'model.pkl', 'wb') as f:
            pickle.dump(model, f)
            
        # Save dataset mappings for inference
        with open(models_dir / 'dataset.pkl', 'wb') as f:
            pickle.dump(dataset, f)
            
        mlflow.log_artifacts(str(models_dir), artifact_path="model")
        
        print("\n✅ Training complete!")

if __name__ == '__main__':
    main()
