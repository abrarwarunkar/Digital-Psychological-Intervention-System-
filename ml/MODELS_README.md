# ML Models Setup

## Important Note

The trained ML models are **NOT included** in this repository due to their large file sizes (>500MB total). The models are excluded in `.gitignore` to comply with GitHub's file size limits.

## Required Models

The following models need to be trained or downloaded separately:

### 1. Screening Models (Small - ~5MB total)
- `ml/models/screening_phq9.pkl`
- `ml/models/screening_gad7.pkl`
- `ml/models/shap_explainer_phq9.pkl`
- `ml/models/shap_explainer_gad7.pkl`

### 2. Deep Learning Models (Large - ~535MB total)
- `ml/models/intent_classifier/` (DistilBERT model - ~268MB)
- `ml/models/risk_detector/` (DistilBERT model - ~268MB)

## How to Get the Models

### Option 1: Train from Scratch
Follow the training instructions in `ml/README.md`:

```bash
cd ml

# Train screening models
python scripts/train_screening.py

# Train intent classifier
python scripts/train_intent.py

# Train risk detector
python scripts/train_risk.py
```

### Option 2: Download Pre-trained Models
If pre-trained models are available, download them and place in the `ml/models/` directory.

### Option 3: Use Git LFS (Recommended for Team)
If you want to version control the models:

```bash
# Install Git LFS
git lfs install

# Track model files
git lfs track "ml/models/*.pkl"
git lfs track "ml/models/*.safetensors"
git lfs track "ml/models/intent_classifier/*"
git lfs track "ml/models/risk_detector/*"

# Commit and push
git add .gitattributes
git add ml/models/
git commit -m "Add ML models with Git LFS"
git push
```

## Verification

After placing the models, verify they're loaded correctly:

```bash
cd ml/serving
python app.py
```

You should see:
```
✅ PHQ-9 model loaded
✅ GAD-7 model loaded
✅ Risk detector loaded
✅ Intent classifier loaded
```

## Model Directory Structure

```
ml/models/
├── .gitkeep
├── screening_phq9.pkl
├── screening_gad7.pkl
├── shap_explainer_phq9.pkl
├── shap_explainer_gad7.pkl
├── intent_classifier/
│   ├── config.json
│   ├── model.safetensors
│   ├── tokenizer_config.json
│   ├── vocab.txt
│   ├── special_tokens_map.json
│   └── label_map.json
└── risk_detector/
    ├── config.json
    ├── model.safetensors
    ├── tokenizer_config.json
    ├── vocab.txt
    └── special_tokens_map.json
```
