# Sprint 8 Quick Start Guide

## Generate Synthetic Chat Data

```bash
cd ml
python scripts/generate_synthetic_chats.py --n-samples 5000
```

This creates 5000 realistic chat messages across risk levels:
- Emergency: 250 (5%) - Suicidal ideation
- High: 500 (10%) - Self-harm, severe distress  
- Medium: 750 (15%) - Moderate distress
- Low: 1500 (30%) - Mild symptoms
- No-risk: 2000 (40%) - Normal questions

## Preprocess Chat Data

```bash
python scripts/preprocess_chats.py
```

Creates train/val/test splits (70/15/15):
- Tokenizes messages for transformer models
- Encodes risk levels (0-4) and intents (0-5)
- Saves to `data/processed/chat_*.pt`

## Train Risk Detector

```bash
# Option 1: Quick baseline (10 epochs)
python scripts/train_risk_detector.py --epochs 10

# Option 2: Full training (best performance)
python scripts/train_risk_detector.py --epochs 30 --batch-size 16
```

Trains DistilBERT for risk classification:
- 5-class (emergency → no-risk)
- Class weighting (10x for emergency)
- Target: 98%+ recall on emergency class

## Train Intent Classifier

```bash
python scripts/train_intent_classifier.py --epochs 15
```

Trains 6-class intent classifier:
- crisis, escalate, emotional_support, faq, resource_request, booking_request

## Test ML Inference

```bash
# Start FastAPI service
cd ../
docker-compose -f docker-compose.ml.yml up -d ml-inference

# Test emergency detection
curl -X POST http://localhost:8000/api/ml/chat/process \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to end my life"}'

# Expected: risk="emergency", action="escalate_to_human"
```

## View Training Metrics

- **MLflow UI**: http://localhost:5002
- **Models**: `ml/models/risk_detector.pt`, `intent_classifier.pt`
- **Metrics**: `ml/metrics/risk_eval.json`

---

## Expected Performance

With 5000 training samples:
- **Emergency Recall**: 0.96-0.99
- **Overall F1**: 0.92-0.95
- **Inference Time**: 50-100ms/message

---

## Troubleshooting

**Issue**: Out of memory during training
**Fix**: Reduce batch size: `--batch-size 8`

**Issue**: Low emergency recall
**Fix**: Increase class weight in `ml/configs/risk_config.yaml`

**Issue**: Slow inference
**Fix**: Use DistilBERT (smaller) or quantize model
