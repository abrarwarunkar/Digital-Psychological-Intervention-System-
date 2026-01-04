"""
Model Registry Management Script.

Features:
    - Registers a model from an MLflow run to the Model Registry
    - Transitions model versions between stages (None -> Staging -> Production)
    - Validates model metadata before promotion

Usage:
    python scripts/register_model.py --run-id <RUN_ID> --model-name "risk-detector" --stage "Staging"
"""

import argparse
import os
import sys
import mlflow
from mlflow.tracking import MlflowClient
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Setup MLflow
MLFLOW_URI = os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5002')
mlflow.set_tracking_uri(MLFLOW_URI)

def validate_model(run_id, model_name):
    """
    Validate model metrics before registration.
    In a real scenario, this would check against thresholds.
    """
    print(f"Validating model from run {run_id}...")
    client = MlflowClient()
    run = client.get_run(run_id)
    
    metrics = run.data.metrics
    print(f"Run metrics: {metrics}")
    
    # Example validation logic
    if 'accuracy' in metrics and metrics['accuracy'] < 0.5:
        print("❌ Validation failed: Accuracy too low")
        return False
        
    print("✅ Validation passed")
    return True

def register_and_promote(run_id, model_name, stage):
    client = MlflowClient()
    
    try:
        # 1. Register Model
        print(f"Registering model '{model_name}' from run {run_id}...")
        model_uri = f"runs:/{run_id}/model"
        model_version = mlflow.register_model(model_uri, model_name)
        print(f"Registered version {model_version.version}")
        
        # 2. Transition Stage
        if stage:
            print(f"Transitioning to {stage}...")
            client.transition_model_version_stage(
                name=model_name,
                version=model_version.version,
                stage=stage,
                archive_existing_versions=True
            )
            print(f"✅ Model {model_name} version {model_version.version} is now in {stage}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="MLflow Model Registry Manager")
    parser.add_argument("--run-id", required=True, help="MLflow Run ID")
    parser.add_argument("--model-name", required=True, help="Name of the registered model")
    parser.add_argument("--stage", choices=["Staging", "Production", "Archived"], help="Target stage")
    
    args = parser.parse_args()
    
    if validate_model(args.run_id, args.model_name):
        register_and_promote(args.run_id, args.model_name, args.stage)
    else:
        print("Skipping registration due to validation failure.")
        sys.exit(1)

if __name__ == "__main__":
    main()
