# Sprint 11-12 Quick Start Guide

## Overview
This guide covers the MLOps and Monitoring infrastructure implemented in Sprint 11-12.

## Components

### 1. Model Registry (`ml/scripts/register_model.py`)
Register and promote models to MLflow Model Registry.

```bash
# Register a model from a training run
python scripts/register_model.py --run-id <RUN_ID> --model-name "risk-detector" --stage "Staging"

# Promote to production
python scripts/register_model.py --run-id <RUN_ID> --model-name "risk-detector" --stage "Production"
```

### 2. CI/CD Pipeline (`.github/workflows/ml-pipeline.yml`)
Automated testing and linting on every push to `ml/` directory.

**Workflow Steps**:
- Linting with flake8
- Unit tests with pytest
- Optional: Training trigger

### 3. Drift Detection (`ml/scripts/monitor_drift.py`)
Monitor data drift using Evidently AI.

```bash
# Generate drift report
python scripts/monitor_drift.py --reference data/train.csv --current data/live.csv --output reports/

# View HTML report
start reports/drift_report.html
```

### 4. Production Monitoring
FastAPI service exposes Prometheus metrics at `/metrics`.

**Available Metrics**:
- `predictions_total`: Total predictions by model type
- `prediction_latency_seconds`: Prediction latency histogram
- `high_risk_predictions`: Count of high-risk predictions

```bash
# Start ML service
cd ml
python -m uvicorn serving.app:app --host 0.0.0.0 --port 8000

# Check metrics
curl http://localhost:8000/metrics
```

### 5. Unit Tests (`ml/tests/test_models.py`)
```bash
# Run all tests
pytest ml/tests/

# Run with coverage
pytest ml/tests/ --cov=ml
```

## Verification

1. **Model Registry**: Check MLflow UI at `http://localhost:5002`
2. **CI/CD**: Push code and verify GitHub Actions pass
3. **Drift Detection**: Run script and review HTML report
4. **Monitoring**: Query `/metrics` endpoint for Prometheus data
5. **Tests**: Ensure all unit tests pass

## Next Steps
- Set up Grafana dashboards for metrics visualization
- Configure alerts for drift detection
- Implement automated model retraining
- Set up A/B testing framework
