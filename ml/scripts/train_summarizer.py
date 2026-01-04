"""
Train Session Summarizer (T5/BART).

Features:
    - Fine-tunes T5-small for chat session summarization
    - Generates structured summaries (concerns, strategies, risk)
    - MLflow tracking
    - Saves model and tokenizer

Usage:
    python train_summarizer.py
"""

import os
import yaml
import mlflow
import pandas as pd
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split
from transformers import (
    T5Tokenizer,
    T5ForConditionalGeneration,
    Trainer,
    TrainingArguments,
    DataCollatorForSeq2Seq
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
    # Fallback
    default_config = {
        'summarizer': {
            'model_name': 't5-small',
            'learning_rate': 2e-5,
            'epochs': 3,
            'batch_size': 4
        }
    }
    
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            if 'summarizer' in config:
                return config
    
    return default_config

def main():
    print("="*60)
    print("SESSION SUMMARIZER TRAINING (T5)")
    print("="*60)
    
    config = load_config()
    params = config['summarizer']
    
    # 1. Load Data (Synthetic for now)
    # In production, this would be pairs of (chat_transcript, summary)
    print("Loading training data...")
    data = [
        {
            "chat": "User: I feel anxious about exams. Bot: Have you tried breathing exercises? User: No, how do I do that? Bot: Breathe in for 4, hold for 7, out for 8.",
            "summary": "Concerns: Exam anxiety. Strategies: Breathing exercises (4-7-8 technique). Risk: Low."
        },
        {
            "chat": "User: I can't sleep. Bot: Sleep hygiene is important. No screens before bed. User: I'll try that.",
            "summary": "Concerns: Insomnia/Sleep issues. Strategies: Sleep hygiene, screen limits. Risk: Low."
        }
        # Add more synthetic examples here
    ]
    df = pd.DataFrame(data)
    
    # 2. Tokenization
    model_name = params.get('model_name', 't5-small')
    tokenizer = T5Tokenizer.from_pretrained(model_name)
    
    def preprocess_function(examples):
        inputs = ["summarize: " + doc for doc in examples["chat"]]
        model_inputs = tokenizer(inputs, max_length=512, truncation=True)
        
        with tokenizer.as_target_tokenizer():
            labels = tokenizer(examples["summary"], max_length=128, truncation=True)
            
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs
        
    # Convert to HuggingFace Dataset
    from datasets import Dataset
    hf_dataset = Dataset.from_pandas(df)
    tokenized_datasets = hf_dataset.map(preprocess_function, batched=True)
    
    # 3. Model
    model = T5ForConditionalGeneration.from_pretrained(model_name)
    
    # 4. Training Arguments
    training_args = TrainingArguments(
        output_dir="./results_summarizer",
        evaluation_strategy="no", # No eval set for this tiny demo
        learning_rate=params.get('learning_rate', 2e-5),
        per_device_train_batch_size=params.get('batch_size', 4),
        num_train_epochs=params.get('epochs', 3),
        weight_decay=0.01,
        save_total_limit=2,
        report_to="mlflow" if USE_MLFLOW else "none"
    )
    
    data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model)
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets,
        tokenizer=tokenizer,
        data_collator=data_collator
    )
    
    # 5. Train
    mlflow.set_experiment("session-summarizer")
    
    with mlflow.start_run(run_name=f"t5_summarizer_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
        print("\nStarting training...")
        trainer.train()
        
        # 6. Save Model
        script_dir = Path(__file__).parent
        models_dir = script_dir.parent / 'models' / 'summarizer'
        models_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\nSaving model to {models_dir}...")
        model.save_pretrained(models_dir)
        tokenizer.save_pretrained(models_dir)
        
        mlflow.log_artifacts(str(models_dir), artifact_path="model")
        print("\n✅ Training complete!")

if __name__ == '__main__':
    main()
