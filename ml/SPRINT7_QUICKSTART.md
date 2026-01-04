# Sprint 7 Quick Start Guide

## Generate Synthetic Data

```bash
cd ml
python scripts/generate_synthetic_data.py --n-samples 5000 --output data/raw/synthetic_screenings.csv
```

This creates 5000 realistic screening samples (2500 PHQ-9, 2500 GAD-7) following clinical guidelines.

## Preprocess Data

```bash
python scripts/preprocess.py
```

Creates train/test splits in `data/processed/`:
- `train_phq9.csv`, `test_phq9.csv`
- `train_gad7.csv`, `test_gad7.csv`

## Train Models

```bash
# Ensure MLflow is running
docker-compose -f ../docker-compose.ml.yml up -d mlflow

# Train models
python scripts/train_screening.py
```

Trains LightGBM classifiers for both screening types with:
- SHAP explainability
- MLflow experiment tracking
- Model artifact saving

## Evaluate Models

```bash
python scripts/evaluate.py
```

Generates:
- `metrics/eval_metrics.json` - Comprehensive metrics
- `metrics/confusion_matrix_phq9.png` - Confusion matrix viz
- `metrics/confusion_matrix_gad7.png`

## Register Models (Optional)

```bash
# Get run ID from MLflow UI (http://localhost:5002)
python scripts/register_model.py \
  --model-name screening-phq9 \
  --run-id <RUN_ID> \
  --stage Production
```

## View Results

- **MLflow UI**: http://localhost:5002
- **Metrics**: `ml/metrics/eval_metrics.json`
- **Models**: `ml/models/screening_*.pkl`

## Full Pipeline (DVC)

```bash
# Run entire pipeline
dvc repro
```

---

## Troubleshooting

**Issue**: MLflow connection error
**Fix**: Ensure docker-compose services are running

**Issue**: No data found
**Fix**: Run `generate_synthetic_data.py` first

**Issue**: Model performance below threshold
**Fix**: Increase `--n-samples` to 10000+ or adjust hyperparameters in `params.yaml`
