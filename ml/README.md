# ML Infrastructure Setup Guide

## Prerequisites

1. **Docker Desktop** installed and running
2. **Python 3.10+** installed
3. **Git** installed
4. **10GB+** free disk space

## Quick Start

### 1. Start ML Services

```bash
# From project root
docker-compose -f docker-compose.ml.yml up -d

# Check services are running
docker-compose -f docker-compose.ml.yml ps
```

**Services started:**
- MLflow UI: http://localhost:5002
- Label Studio: http://localhost:8080
- MinIO Console: http://localhost:9001
- Milvus: localhost:19530
- MongoDB: localhost:27017

### 2. Setup Python Environment

```bash
# Create virtual environment
cd ml
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spacy model (for PII detection)
python -m spacy download en_core_web_sm
```

### 3. Initialize DVC

```bash
# Initialize DVC (one-time)
dvc init

# Add local remote (for testing)
dvc remote add -d local /tmp/dvc-storage
# Or use MinIO (S3-compatible)
# dvc remote add -d minio s3://mlflow/dvc-store
# dvc remote modify minio endpointurl http://localhost:9000
```

### 4. Export Seed Data

```bash
# Make sure MongoDB has some screening data
# Run from ml/ directory
python scripts/export_data.py --output-dir data/raw

# Track with DVC
dvc add data/raw/screenings.csv
git add data/raw/screenings.csv.dvc .gitignore
git commit -m "Track screening data"
```

### 5. Run Preprocessing

```bash
python scripts/preprocess.py

# Verify processed data created
ls data/processed/
```

## Service Access

### MLflow
- **URL**: http://localhost:5002
- **Use**: Track experiments, register models
- **Storage**: MongoDB backend, MinIO artifacts

### Label Studio
- **URL**: http://localhost:8080
- **Use**: Annotate chat messages for risk/intent labels
- **Setup**: Create account on first visit

### MinIO (S3)
- **Console**: http://localhost:9001
- **Credentials**: minioadmin / minioadmin
- **Use**: Browse MLflow artifacts, DVC storage

### Milvus
- **Host**: localhost:19530
- **Use**: Vector DB for RAG (future sprint)

## Common Commands

### Docker

```bash
# Start services
docker-compose -f docker-compose.ml.yml up -d

# Stop services
docker-compose -f docker-compose.ml.yml down

# View logs
docker-compose -f docker-compose.ml.yml logs -f mlflow

# Restart a service
docker-compose -f docker-compose.ml.yml restart mlflow
```

### DVC

```bash
# Run full pipeline
dvc repro

# Run specific stage
dvc repro preprocess

# Pull data from remote
dvc pull

# Push data to remote
dvc push

# Check pipeline status
dvc dag
```

### MLflow

```bash
# Start UI (if not using Docker)
mlflow ui --backend-store-uri mongodb://localhost:27017/mlflow

# List experiments
mlflow experiments list

# Compare runs
mlflow ui  # Then use web interface
```

## Troubleshooting

### "Port already in use"
```bash
# Check what's using the port
netstat -ano | findstr :5002  # Windows
lsof -i :5002  # Mac/Linux

# Change port in docker-compose.ml.yml
```

### "DVC: No remote configured"
```bash
dvc remote add -d local /tmp/dvc-storage
```

### "MongoDB connection failed"
Ensure MongoDB from main app is running:
```bash
# Check if mongo container is up
docker ps | grep mongo
```

### "Out of memory"
Reduce Docker resource limits in Docker Desktop settings or disable unused services:
```bash
# Start only MLflow
docker-compose -f docker-compose.ml.yml up mlflow mongo minio
```

## Next Steps

1. ✅ Infrastructure running
2. ✅ Data exported
3. → **Sprint 7**: Train baseline screening model
4. → **Sprint 8**: Risk detection & triage
5. → **Sprint 9**: RAG system

## Security Notes

- **Local only**: All services are currently local. Do NOT expose ports publicly.
- **PII**: Data export scripts mask PII automatically
- **Credentials**: Change default MinIO credentials in production
- **HTTPS**: Add TLS termination before production deployment

## Support

- MLflow docs: https://mlflow.org/docs/latest/index.html
- DVC docs: https://dvc.org/doc
- Label Studio: https://labelstud.io/guide/
