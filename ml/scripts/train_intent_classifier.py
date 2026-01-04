"""
Train DistilBERT intent classifier for chat messages.

Features:
    - Fine-tunes DistilBERT for intent classification
    - 6 intent categories (crisis, escalate, support, faq, resource, booking)
    - MLflow tracking
    - Saves model and tokenizer

Usage:
    python train_intent_classifier.py
"""

import os
import torch
import yaml
import mlflow
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from transformers import (
    DistilBertTokenizer,
    DistilBertForSequenceClassification,
    Trainer,
    TrainingArguments
)
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
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

class ChatDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='weighted')
    acc = accuracy_score(labels, preds)
    return {
        'accuracy': acc,
        'f1': f1,
        'precision': precision,
        'recall': recall
    }

def main():
    print("="*60)
    print("INTENT CLASSIFIER TRAINING (DistilBERT)")
    print("="*60)
    
    # Load data
    script_dir = Path(__file__).parent
    data_path = script_dir.parent / 'data' / 'raw' / 'synthetic_chats.csv'
    
    if not data_path.exists():
        print(f"❌ Data not found at {data_path}")
        return

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} chat samples")
    
    # Map labels to integers
    intents = df['intent'].unique().tolist()
    label_map = {intent: i for i, intent in enumerate(intents)}
    print(f"Intents: {label_map}")
    
    df['label'] = df['intent'].map(label_map)
    
    # Split data
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        df['message'].tolist(),
        df['label'].tolist(),
        test_size=0.2,
        stratify=df['label'],
        random_state=42
    )
    
    # Tokenization
    print("Tokenizing data...")
    tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
    
    train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=128)
    val_encodings = tokenizer(val_texts, truncation=True, padding=True, max_length=128)
    
    train_dataset = ChatDataset(train_encodings, train_labels)
    val_dataset = ChatDataset(val_encodings, val_labels)
    
    # Model initialization
    model = DistilBertForSequenceClassification.from_pretrained(
        'distilbert-base-uncased',
        num_labels=len(label_map)
    )
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir='./results_intent',
        num_train_epochs=3,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=64,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir='./logs_intent',
        logging_steps=10,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        report_to="mlflow" if USE_MLFLOW else "none"
    )
    
    # Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics
    )
    
    # MLflow tracking
    mlflow.set_experiment("intent-classifier")
    
    with mlflow.start_run(run_name=f"distilbert_intent_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
        print("\nStarting training...")
        trainer.train()
        
        print("\nEvaluating...")
        eval_results = trainer.evaluate()
        print(f"Eval Results: {eval_results}")
        
        # Save model
        models_dir = script_dir.parent / 'models' / 'intent_classifier'
        models_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\nSaving model to {models_dir}...")
        model.save_pretrained(models_dir)
        tokenizer.save_pretrained(models_dir)
        
        # Save label map
        import json
        with open(models_dir / 'label_map.json', 'w') as f:
            json.dump(label_map, f)
            
        # Log artifacts
        mlflow.log_artifacts(str(models_dir), artifact_path="model")
        
        print("\n✅ Training complete!")

if __name__ == '__main__':
    main()
