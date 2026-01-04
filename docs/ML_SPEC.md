# ML/AI Specification - Student Mental Health Platform

## Overview
This document specifies the ML/AI components, data pipelines, model architecture, APIs, and MLOps infrastructure for the privacy-first Student Mental Health Platform.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [ML Features](#ml-features)
3. [Data & Labeling](#data--labeling)
4. [Models](#models)
5. [API Contracts](#api-contracts)
6. [MLOps Pipeline](#mlops-pipeline)
7. [Security & Privacy](#security--privacy)
8. [Monitoring & Evaluation](#monitoring--evaluation)

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  Student / Counsellor / Admin Portals + AI-Assisted UX     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js/Express)            │
│        Auth │ User Mgmt │ Bookings │ Forum │ Admin          │
└────────┬────────────────────────────────┬──────────────────┘
         │                                 │
         │                                 ▼
         │                    ┌─────────────────────────────┐
         │                    │   ML Inference Services     │
         │                    │   (FastAPI + TorchServe)   │
         │                    │                             │
         │                    │  • Screening Classifier     │
         │                    │  • Risk Detector           │
         │                    │  • Intent Classifier       │
         │                    │  • RAG Pipeline            │
         │                    │  • Recommender             │
         │                    │  • Summarizer              │
         │                    └────────┬───────────────────┘
         │                              │
         ▼                              ▼
┌────────────────────┐       ┌──────────────────────────────┐
│   MongoDB          │       │   Vector DB (Pinecone/Milvus)│
│   • Users          │       │   • Resource embeddings      │
│   • Screenings     │       │   • FAQ embeddings           │
│   • Interactions   │       │   • Context retrieval        │
│   • Labels         │       └──────────────────────────────┘
└────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    ML Training Infrastructure                │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐ │
│  │   DVC    │  │ MLflow   │  │   Label   │  │  GitHub   │ │
│  │ (Data    │  │(Tracking)│  │  Studio   │  │  Actions  │ │
│  │ Version) │  │(Registry)│  │(Labeling) │  │  (CI/CD)  │ │
│  └──────────┘  └──────────┘  └───────────┘  └───────────┘ │
│                                                              │
│  Data: S3 │ Compute: GPU nodes │ Monitoring: Evidently     │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React, Tailwind CSS, Zustand |
| **Backend** | Node.js, Express, MongoDB |
| **ML Inference** | FastAPI, TorchServe, Uvicorn |
| **ML Training** | Python, PyTorch, Hugging Face, scikit-learn |
| **Data Versioning** | DVC + S3 |
| **Experiment Tracking** | MLflow |
| **Model Registry** | MLflow Registry |
| **Vector DB** | Pinecone / Milvus |
| **LLM** | OpenAI GPT / Local Llama2 |
| **Embeddings** | OpenAI / BGE-small / MiniLM |
| **Labeling** | Label Studio |
| **Monitoring** | Prometheus, Grafana, Evidently, Sentry |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker, docker-compose |

---

## ML Features

### 1. Automated Screening & Severity Prediction

**Purpose**: Automatically score PHQ-9/GAD-7 assessments and predict depression/anxiety severity with explainability.

**Input**:
- PHQ-9/GAD-7 structured answers (arrays of 0-3 scores)
- Optional free-text symptom description

**Output**:
- Numerical score (0-27 for PHQ-9, 0-21 for GAD-7)
- Risk level: `none`, `mild`, `moderate`, `moderately-severe`, `severe`
- Confidence score (0-1)
- Explainability: Top contributing questions (SHAP values)
- Model version

**Models**:
- **Tabular**: LightGBM/XGBoost for structured answers
- **Text**: Fine-tuned DistilBERT for free-text severity regression

**Metrics**:
- Accuracy, F1-score per class
- Precision/Recall for severe class (target: Recall > 0.90)
- Calibration (Brier score)

---

### 2. Conversational Triage (Chatbot)

**Purpose**: Classify user intent, detect mental health risk (especially suicidal ideation), and route to appropriate responses.

**Input**:
- User message text
- Session context (previous messages)
- User profile (anonymized risk history)

**Output**:
- **Intent**: `faq`, `resource_request`, `booking_request`, `urgent_risk`, `escalate`, `general_chat`
- **Risk level**: `none`, `low`, `medium`, `high`, `emergency`
- **Risk confidence**: 0-1
- **Action**: `respond_auto`, `escalate_to_human`, `show_emergency_resources`
- **Reply**: Generated response text (from RAG or template)
- **Model version**

**Models**:
- **Intent Classifier**: Fine-tuned DistilBERT/DeBERTa (multi-class)
- **Risk Detector**: Fine-tuned DistilBERT (high-recall binary + severity)
- **Response Generator**: RAG pipeline (retriever + LLM)

**Metrics**:
- Intent: Macro F1-score
- Risk detector: Recall for `emergency` class (target >= 0.95), Precision, F1
- Response quality: Human evaluation (relevance, safety)

**Safety**:
- Override generator for high-risk cases
- Emergency keywords trigger immediate escalation
- Content filter for inappropriate outputs

---

### 3. Retrieval-Augmented Generation (RAG)

**Purpose**: Provide accurate, contextual answers to user questions using verified mental health resources.

**Input**:
- User query
- Session context

**Output**:
- Generated answer
- Source documents (IDs, titles, snippets)
- Retrieval confidence
- Model version

**Pipeline**:
1. **Embed query** using OpenAI embeddings or BGE-small
2. **Retrieve top-k** (k=5) relevant documents from vector DB
3. **Create prompt** with retrieved context + user query
4. **Generate answer** using LLM (GPT-4 / Llama2)
5. **Post-process**: Safety check, citation formatting

**Vector DB Schema**:
```json
{
  "id": "resource_123",
  "vector": [0.1, 0.2, ...],  // embedding
  "metadata": {
    "title": "Coping with Academic Stress",
    "category": "anxiety",
    "url": "https://...",
    "snippet": "...",
    "approved": true
  }
}
```

**Metrics**:
- Retrieval: Recall@5, MRR
- Answer quality: BLEU, ROUGE, human evaluation

---

### 4. Personalized Resource Recommendation

**Purpose**: Recommend mental health resources tailored to user's screening results, engagement history, and preferences.

**Input**:
- User ID
- Recent screening results
- Interaction history (viewed resources, clicks)
- User preferences (anonymity, topics)

**Output**:
- Ranked list of resource IDs with scores
- Explanation for each recommendation

**Models**:
- **Collaborative filtering**: Matrix factorization (user-resource interactions)
- **Content-based**: Cosine similarity of user profile vs resource embeddings
- **Hybrid**: Weighted combination

**Metrics**:
- CTR (click-through rate)
- MRR (mean reciprocal rank)
- User engagement uplift vs baseline

---

### 5. Session Summarization (Counsellor Assist)

**Purpose**: Auto-generate summaries of counseling sessions from chat logs, highlighting risk indicators and recommended actions.

**Input**:
- Chat log (array of messages)
- Session metadata

**Output**:
- Summary text (max 500 words)
- Risk highlights (flagged segments)
- Recommended next steps
- PII-redacted version

**Model**:
- Fine-tuned T5/BART/Pegasus or Llama2 summarizer

**Metrics**:
- ROUGE-L
- Human evaluation (informativeness, accuracy)

---

### 6. Analytics & Trend Detection

**Purpose**: Detect spikes in risk levels, seasonal trends, and at-risk user cohorts for proactive intervention.

**Models**:
- Time-series anomaly detection (Prophet, ARIMA)
- Clustering (K-means on user embeddings)

**Output**:
- Weekly risk trend reports
- At-risk user segments
- Recommendations for targeted outreach

---

## Data & Labeling

### Data Types

| Data Type | Source | Schema | Volume Target |
|-----------|--------|--------|---------------|
| **Screening (tabular)** | PHQ-9/GAD-7 submissions | `{userId, type, answers[], score, timestamp}` | 5k+ labeled |
| **Screening (text)** | Free-text symptom fields | `{userId, text, severity_label}` | 3k+ labeled |
| **Chat messages** | Chatbot interactions | `{sessionId, message, sender, risk_label, intent_label}` | 10k+ labeled |
| **Resources** | Admin-curated docs | `{id, title, content, category, url}` | 500-2k docs |
| **User interactions** | Clicks, views, ratings | `{userId, resourceId, action, timestamp}` | Ongoing |
| **Forum posts** | Community forum | `{postId, content, flags, risk_label}` | Ongoing |

### Labeling Workflow

1. **Seed labels** using rule-based heuristics:
   - PHQ-9/GAD-7: Auto-score using official guidelines
   - Risk detection: Regex for suicidal keywords (e.g., "kill myself", "end it all")
   - Intent: Keyword matching for FAQ/booking requests

2. **Human annotation** using Label Studio:
   - Deploy Label Studio on secure VPC
   - Create labeling tasks for edge cases
   - Configure multi-annotator consensus (2+ annotators for risk labels)

3. **Active learning**:
   - Model flags low-confidence predictions for human review
   - Prioritize difficult examples for labeling

4. **Data versioning**:
   - Store labeled datasets in `ml/data/labels/`
   - Version with DVC: `dvc add ml/data/labels/`
   - Tag versions: `dvc tag v1.0 -m "Initial screening dataset"`

### Privacy in Labeling

- **PII stripping**: Remove names, emails, phone numbers before labeling
- **Pseudonymization**: Use hashed user IDs
- **Access control**: Labelers sign NDAs, access via VPN
- **Audit logs**: Track who labeled what

---

## Models

### 1. Screening Classifier

**Type**: Tabular (LightGBM) + Text (DistilBERT)

**Training**:
```python
# Tabular
import lightgbm as lgb
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(features, labels)
model = lgb.LGBMClassifier(
    num_leaves=31,
    learning_rate=0.05,
    n_estimators=100
)
model.fit(X_train, y_train)
```

**Explainability**:
```python
import shap
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)
# Return top 3 features per prediction
```

**Text model**:
- Fine-tune `distilbert-base-uncased` on free-text → severity labels
- Use Hugging Face Trainer with class weighting

**Deployment**:
- Pickle tabular model, save to MLflow
- Save Hugging Face model to MLflow artifact store
- Serve via FastAPI endpoint

---

### 2. Risk & Intent Detector

**Type**: Transformer (DistilBERT/DeBERTa)

**Training**:
```python
from transformers import AutoModelForSequenceClassification, Trainer, TrainingArguments

model = AutoModelForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=2  # risk: 0=safe, 1=high-risk
)

training_args = TrainingArguments(
    output_dir="./models/risk_detector",
    eval_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    num_train_epochs=3,
    weight_decay=0.01,
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="recall",  # Optimize for recall
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    compute_metrics=compute_metrics,
)
trainer.train()
```

**Class weighting**: Use `compute_class_weight` to handle imbalanced emergency class

**Deployment**:
- Save to MLflow
- Serve via TorchServe or FastAPI

---

### 3. RAG System

**Components**:

1. **Embeddings**: 
   - Use OpenAI `text-embedding-ada-002` or open-source `BAAI/bge-small-en`
   
2. **Vector DB (Pinecone example)**:
```python
import pinecone
from sentence_transformers import SentenceTransformer

# Initialize
pinecone.init(api_key=API_KEY, environment="us-west1-gcp")
index = pinecone.Index("mental-health-resources")

# Embed and upsert
model = SentenceTransformer('BAAI/bge-small-en')
vectors = model.encode(resource_texts)
index.upsert(vectors=[(id, vec, metadata) for id, vec, metadata in ...])
```

3. **Retriever**:
```python
def retrieve(query, top_k=5):
    query_vec = model.encode([query])[0]
    results = index.query(query_vec, top_k=top_k, include_metadata=True)
    return results['matches']
```

4. **Generator** (OpenAI GPT):
```python
from openai import OpenAI
client = OpenAI(api_key=API_KEY)

def generate_answer(query, retrieved_docs):
    context = "\n\n".join([doc['metadata']['snippet'] for doc in retrieved_docs])
    prompt = f"""You are a mental health support assistant. Answer the question using only the provided context.

Context:
{context}

Question: {query}

Answer:"""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500
    )
    return response.choices[0].message.content
```

**Safety**:
- Content filter before/after LLM
- Emergency keyword detector overrides RAG
- Fallback to rule-based responses if retrieval fails

---

### 4. Recommender

**Hybrid approach**:

1. **Collaborative filtering** (matrix factorization):
```python
from surprise import SVD, Dataset, Reader
reader = Reader(rating_scale=(0, 1))
data = Dataset.load_from_df(interactions_df[['userId', 'resourceId', 'rating']], reader)
model = SVD()
model.fit(data.build_full_trainset())
```

2. **Content-based** (cosine similarity):
```python
from sklearn.metrics.pairwise import cosine_similarity
user_profile_vec = compute_user_profile(user_id)  # avg of interacted resource embeds
similarity_scores = cosine_similarity(user_profile_vec, resource_embeds)
```

3. **Hybrid**:
```python
final_score = 0.6 * collab_score + 0.4 * content_score
```

---

## API Contracts

### Base URL
```
Production: https://api.yourapp.com
Development: http://localhost:5001
```

### Authentication
All ML endpoints require Bearer token from main API auth.

---

### 1. Screening Prediction

**Endpoint**: `POST /api/ml/screening/predict`

**Request**:
```json
{
  "type": "PHQ9",
  "answers": [0, 1, 2, 1, 0, 1, 0, 2, 1],
  "free_text": "I've been feeling low and can't stay motivated"
}
```

**Response**:
```json
{
  "score": 8,
  "riskLevel": "moderate",
  "confidence": 0.92,
  "explanation": {
    "topContributors": [
      {"question": "sleep", "shap": 0.3, "questionText": "Trouble sleeping"},
      {"question": "concentration", "shap": 0.25}
    ]
  },
  "modelVersion": "screening-v1.2",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Codes**:
- 400: Invalid input format
- 500: Model inference error

---

### 2. Chat Triage

**Endpoint**: `POST /api/ml/chat/process`

**Request**:
```json
{
  "sessionId": "abc123",
  "message": "I can't stop thinking about ending it",
  "context": [
    {"role": "user", "content": "I feel hopeless"},
    {"role": "assistant", "content": "I'm here to help..."}
  ],
  "anonymous": true
}
```

**Response**:
```json
{
  "intent": "escalate",
  "intentConfidence": 0.89,
  "risk": "emergency",
  "riskConfidence": 0.98,
  "action": "escalate_to_human",
  "reply": "I'm really sorry you're feeling like this. This sounds serious. Can I connect you to a counselor now? If you're in immediate danger, please call [Crisis Hotline].",
  "emergencyResources": [
    {"name": "National Suicide Prevention Lifeline", "phone": "988"}
  ],
  "modelVersion": "triage-v2.1",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Actions**:
- `respond_auto`: Send automated reply
- `escalate_to_human`: Alert counselor, offer immediate connection
- `show_emergency_resources`: Display crisis hotlines

---

### 3. RAG Answer

**Endpoint**: `POST /api/ml/rag/answer`

**Request**:
```json
{
  "query": "How can I deal with academic stress?",
  "sessionId": "xyz789",
  "userId": "user_456",
  "context": ["previous", "messages"]
}
```

**Response**:
```json
{
  "answer": "Academic stress can be managed through several evidence-based strategies...",
  "sources": [
    {
      "id": "resource_123",
      "title": "Coping with Academic Stress",
      "snippet": "Studies show that breaking tasks into smaller chunks...",
      "url": "https://resources.app.com/stress",
      "score": 0.87
    }
  ],
  "retrievalConfidence": 0.91,
  "modelVersion": "rag-v1.0",
  "timestamp": "2024-01-15T10:40:00Z"
}
```

---

### 4. Recommendations

**Endpoint**: `GET /api/ml/recommendations?userId={userId}&limit={limit}`

**Request**:
```
GET /api/ml/recommendations?userId=user_456&limit=5
Authorization: Bearer <token>
```

**Response**:
```json
{
  "recommendations": [
    {
      "resourceId": "res_789",
      "title": "Mindfulness for Anxiety",
      "score": 0.94,
      "reason": "Based on your moderate anxiety screening",
      "category": "anxiety",
      "type": "article",
      "url": "https://..."
    }
  ],
  "modelVersion": "recommender-v1.0",
  "timestamp": "2024-01-15T10:45:00Z"
}
```

---

### 5. Session Summary

**Endpoint**: `POST /api/ml/summarize`

**Request**:
```json
{
  "sessionId": "session_999",
  "messages": [
    {"role": "user", "content": "I'm struggling with sleep"},
    {"role": "counselor", "content": "Tell me more about that..."}
  ],
  "redactPii": true
}
```

**Response**:
```json
{
  "summary": "Student reported persistent sleep difficulties affecting daily function...",
  "riskHighlights": [
    {
      "segment": "I sometimes think it would be easier to just...",
      "risk": "medium",
      "timestamp": "2024-01-15T10:20:00Z"
    }
  ],
  "recommendations": ["Follow up on sleep hygiene", "Consider referral to psychiatrist"],
  "modelVersion": "summarizer-v1.0"
}
```

---

## MLOps Pipeline

### 1. Data Versioning (DVC)

**Setup**:
```bash
# Initialize DVC
cd student-mental-health/ml
dvc init

# Add S3 remote
dvc remote add -d myremote s3://my-bucket/dvc-store
dvc remote modify myremote region us-east-1

# Track data
dvc add data/raw/screenings.csv
git add data/raw/screenings.csv.dvc .gitignore
git commit -m "Track screening data v1"

# Push to remote
dvc push
```

**Data pipeline**:
```yaml
# dvc.yaml
stages:
  preprocess:
    cmd: python scripts/preprocess.py
    deps:
      - data/raw/screenings.csv
      - scripts/preprocess.py
    outs:
      - data/processed/train.csv
      - data/processed/test.csv
    
  train:
    cmd: python scripts/train_screening.py
    deps:
      - data/processed/train.csv
      - scripts/train_screening.py
    params:
      - train.learning_rate
      - train.n_estimators
    metrics:
      - metrics/train_metrics.json:
          cache: false
    outs:
      - models/screening_model.pkl
```

**Run pipeline**:
```bash
dvc repro
```

---

### 2. Experiment Tracking (MLflow)

**Setup MLflow server**:
```bash
# Install
pip install mlflow pymongo boto3

# Run tracking server
mlflow server \
  --backend-store-uri mongodb://localhost:27017/mlflow \
  --default-artifact-root s3://my-bucket/mlflow-artifacts \
  --host 0.0.0.0 \
  --port 5002
```

**Track experiments**:
```python
import mlflow
import mlflow.sklearn

mlflow.set_tracking_uri("http://localhost:5002")
mlflow.set_experiment("screening-classifier")

with mlflow.start_run():
    # Log params
    mlflow.log_param("learning_rate", 0.05)
    mlflow.log_param("n_estimators", 100)
    
    # Train model
    model.fit(X_train, y_train)
    
    # Log metrics
    mlflow.log_metric("accuracy", accuracy)
    mlflow.log_metric("f1_score", f1)
    
    # Log model
    mlflow.sklearn.log_model(model, "model")
    
    # Log artifacts
    mlflow.log_artifact("metrics/confusion_matrix.png")
```

---

### 3. Model Registry

**Register model**:
```python
# After training
model_uri = f"runs:/{run_id}/model"
mlflow.register_model(model_uri, "screening-classifier")
```

**Promote to production**:
```python
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Transition to production
client.transition_model_version_stage(
    name="screening-classifier",
    version=3,
    stage="Production"
)
```

**Load production model**:
```python
model = mlflow.pyfunc.load_model(
    model_uri="models:/screening-classifier/Production"
)
predictions = model.predict(data)
```

---

### 4. CI/CD (GitHub Actions)

**Training workflow** (`.github/workflows/train-model.yml`):
```yaml
name: Train ML Model

on:
  push:
    branches: [ml-train]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  train:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install -r ml/requirements.txt
      
      - name: Configure DVC
        run: |
          dvc remote modify myremote access_key_id ${{ secrets.AWS_ACCESS_KEY }}
          dvc remote modify myremote secret_access_key ${{ secrets.AWS_SECRET_KEY }}
      
      - name: Pull data
        run: dvc pull
      
      - name: Run training pipeline
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_URI }}
        run: |
          cd ml
          dvc repro
      
      - name: Evaluate model
        run: python ml/scripts/evaluate.py
      
      - name: Register model (if passing)
        if: success()
        run: python ml/scripts/register_model.py
```

**Deployment workflow** (`.github/workflows/deploy-model.yml`):
```yaml
name: Deploy ML Model

on:
  workflow_dispatch:
    inputs:
      model_version:
        description: 'Model version to deploy'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -t ml-inference:${{ github.event.inputs.model_version }} \
            --build-arg MODEL_VERSION=${{ github.event.inputs.model_version }} \
            ./ml/serving
      
      - name: Push to registry
        run: |
          docker tag ml-inference:${{ github.event.inputs.model_version }} \
            ${{ secrets.DOCKER_REGISTRY }}/ml-inference:${{ github.event.inputs.model_version }}
          docker push ${{ secrets.DOCKER_REGISTRY }}/ml-inference:${{ github.event.inputs.model_version }}
      
      - name: Deploy to production
        run: kubectl apply -f ml/k8s/deployment.yaml
```

---

### 5. Model Serving (FastAPI)

**Inference service** (`ml/serving/app.py`):
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import mlflow.pyfunc
import logging

app = FastAPI(title="ML Inference API")

# Load model on startup
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = mlflow.pyfunc.load_model("models:/screening-classifier/Production")
    logging.info("Model loaded successfully")

class ScreeningRequest(BaseModel):
    type: str
    answers: list[int]
    free_text: str = ""

class ScreeningResponse(BaseModel):
    score: int
    riskLevel: str
    confidence: float
    explanation: dict
    modelVersion: str

@app.post("/predict", response_model=ScreeningResponse)
async def predict(request: ScreeningRequest):
    try:
        # Preprocess
        features = preprocess(request.answers, request.free_text)
        
        # Predict
        prediction = model.predict(features)
        
        # Explain
        explanation = compute_shap(features)
        
        return ScreeningResponse(
            score=compute_score(request.answers),
            riskLevel=map_to_risk_level(prediction),
            confidence=prediction.probability,
            explanation=explanation,
            modelVersion="v1.2"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}
```

**Dockerfile**:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY utils/ ./utils/

ENV MLFLOW_TRACKING_URI=http://mlflow:5002
ENV MODEL_NAME=screening-classifier
ENV MODEL_STAGE=Production

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 6. Monitoring & Drift Detection

**Evidently monitoring**:
```python
from evidently.dashboard import Dashboard
from evidently.dashboard.tabs import DataDriftTab, CatTargetDriftTab

# Compare reference (training) vs current (production) data
dashboard = Dashboard(tabs=[DataDriftTab(), CatTargetDriftTab()])
dashboard.calculate(reference_data, current_data, column_mapping=column_mapping)
dashboard.save("reports/drift_report.html")

# Check for drift
drift_detected = dashboard.analyzers_results[0].drift_score > 0.1
if drift_detected:
    send_alert("Model drift detected!")
```

**Prometheus metrics** (in FastAPI app):
```python
from prometheus_client import Counter, Histogram, make_asgi_app

# Metrics
prediction_counter = Counter('predictions_total', 'Total predictions')
prediction_latency = Histogram('prediction_latency_seconds', 'Prediction latency')
high_risk_counter = Counter('high_risk_predictions', 'High risk predictions')

@app.post("/predict")
async def predict(request: ScreeningRequest):
    with prediction_latency.time():
        result = model.predict(...)
    
    prediction_counter.inc()
    if result.riskLevel == "severe":
        high_risk_counter.inc()
    
    return result

# Expose metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

**Grafana dashboard queries**:
```promql
# Request rate
rate(predictions_total[5m])

# P95 latency
histogram_quantile(0.95, prediction_latency_seconds_bucket)

# High risk ratio
rate(high_risk_predictions[1h]) / rate(predictions_total[1h])
```

---

## Security & Privacy

### 1. PII Masking

**Preprocessing pipeline**:
```python
import re
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

def mask_pii(text):
    # Detect PII
    results = analyzer.analyze(text=text, language='en')
    
    # Anonymize
    anonymized = anonymizer.anonymize(text=text, analyzer_results=results)
    return anonymized.text

# Example
user_message = "My name is John Doe and my email is john@example.com"
safe_text = mask_pii(user_message)
# Output: "My name is <PERSON> and my email is <EMAIL>"
```

**Apply before storage**:
```python
@app.post("/chat")
async def chat(message: str):
    # Mask PII before saving
    anonymized_message = mask_pii(message)
    
    # Save to DB
    db.messages.insert_one({
        "content": anonymized_message,
        "original_hash": hash(message),  # For verification only
        "timestamp": datetime.now()
    })
```

---

### 2. Consent Management

**User consent schema**:
```javascript
// MongoDB
{
  userId: ObjectId,
  mlDataConsent: {
    screening: { granted: true, timestamp: ISODate },
    chatLogs: { granted: false, timestamp: null },
    recommendations: { granted: true, timestamp: ISODate }
  },
  dataRetention: {
    deleteAfterDays: 365,
    requestedDeletion: false
  }
}
```

**Check consent before training**:
```python
def get_training_data():
    # Only include users who consented
    consented_users = db.users.find({"mlDataConsent.chatLogs.granted": True})
    user_ids = [u['_id'] for u in consented_users]
    
    data = db.messages.find({"userId": {"$in": user_ids}})
    return data
```

---

### 3. Encryption

**Envelope encryption** for sensitive model artifacts:
```python
from cryptography.fernet import Fernet
import boto3

# Generate data encryption key (DEK)
dek = Fernet.generate_key()
cipher = Fernet(dek)

# Encrypt model file
with open("model.pkl", "rb") as f:
    encrypted_model = cipher.encrypt(f.read())

# Encrypt DEK with KMS
kms = boto3.client('kms')
encrypted_dek = kms.encrypt(
    KeyId='alias/ml-models',
    Plaintext=dek
)['CiphertextBlob']

# Store encrypted model + encrypted DEK
s3.put_object(
    Bucket='models',
    Key='screening-v1.2.enc',
    Body=encrypted_model,
    Metadata={'encrypted_key': encrypted_dek.hex()}
)
```

---

### 4. Audit Logging

**Log all predictions**:
```python
@app.post("/predict")
async def predict(request: ScreeningRequest, user: User = Depends(get_current_user)):
    prediction = model.predict(...)
    
    # Audit log
    db.audit_log.insert_one({
        "userId": user.id,
        "endpoint": "/predict",
        "modelVersion": "v1.2",
        "input": hash(str(request)),  # Don't log raw data
        "output": prediction.riskLevel,
        "timestamp": datetime.now(),
        "ipAddress": request.client.host
    })
    
    return prediction
```

---

## Monitoring & Evaluation

### 1. Model Performance Metrics

**Track in MLflow**:
```python
# During evaluation
metrics = {
    "accuracy": 0.89,
    "f1_macro": 0.87,
    "precision_severe": 0.92,
    "recall_severe": 0.91,
    "brier_score": 0.08,
    "inference_latency_p95": 0.15
}

with mlflow.start_run():
    for key, value in metrics.items():
        mlflow.log_metric(key, value)
```

**Acceptance thresholds** (CI check):
```python
def validate_model(metrics):
    thresholds = {
        "f1_macro": 0.85,
        "recall_severe": 0.90,
        "brier_score_max": 0.10
    }
    
    if metrics["f1_macro"] < thresholds["f1_macro"]:
        raise ValueError("F1 below threshold")
    if metrics["recall_severe"] < thresholds["recall_severe"]:
        raise ValueError("Recall for severe class too low")
    if metrics["brier_score"] > thresholds["brier_score_max"]:
        raise ValueError("Poor calibration")
    
    return True
```

---

### 2. A/B Testing

**Feature flag for model versions**:
```python
@app.post("/predict")
async def predict(request: ScreeningRequest, user: User = Depends(get_current_user)):
    # Route 10% to new model
    if hash(user.id) % 10 == 0:
        model = load_model("screening-v2.0")
        variant = "B"
    else:
        model = load_model("screening-v1.2")
        variant = "A"
    
    prediction = model.predict(...)
    
    # Log variant for analysis
    db.ab_test_log.insert_one({
        "userId": user.id,
        "variant": variant,
        "prediction": prediction,
        "timestamp": datetime.now()
    })
    
    return prediction
```

**Analyze results**:
```python
# After 2 weeks
variant_a = db.ab_test_log.find({"variant": "A"})
variant_b = db.ab_test_log.find({"variant": "B"})

# Compare metrics (e.g., user engagement, counselor override rate)
```

---

### 3. Human-in-the-Loop Evaluation

**Weekly review pipeline**:
```python
# Sample 100 random predictions
samples = db.predictions.aggregate([{"$sample": {"size": 100}}])

# Send to Label Studio for review
for sample in samples:
    label_studio.create_task({
        "data": {
            "text": sample["input"],
            "prediction": sample["output"]
        },
        "annotations": [],
        "predictions": [{"result": sample["output"]}]
    })

# Calculate human agreement
agreements = sum(human_label == model_pred for human_label, model_pred in zip(...))
agreement_rate = agreements / 100
```

---

## Environment Variables

**`.env.example` for ML services**:
```bash
# MLflow
MLFLOW_TRACKING_URI=http://mlflow:5002
MLFLOW_S3_ENDPOINT_URL=https://s3.amazonaws.com

# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET=ml-artifacts

# MongoDB
MONGO_URI=mongodb://localhost:27017/student-mental-health

# Vector DB
PINECONE_API_KEY=your_key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=mental-health-rag

# LLM
OPENAI_API_KEY=your_key
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.3

# Encryption
KMS_KEY_ID=alias/ml-models

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
EVIDENTLY_MONITORING=true

# Feature Flags
ENABLE_AB_TESTING=true
AB_TEST_VARIANT_B_RATIO=0.1
```

---

## Development Commands

### Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r ml/requirements.txt

# Initialize DVC
cd ml
dvc init
dvc remote add -d myremote s3://my-bucket/dvc-store

# Start MLflow server
mlflow server --backend-store-uri mongodb://localhost:27017/mlflow \
  --default-artifact-root s3://my-bucket/mlflow-artifacts \
  --host 0.0.0.0 --port 5002 &

# Start Label Studio
label-studio start --port 8080
```

### Training
```bash
# Pull latest data
dvc pull

# Run experiment
python ml/scripts/train_screening.py --config configs/experiment1.yaml

# Reproduce DVC pipeline
dvc repro

# Compare experiments
mlflow ui --port 5002
```

### Serving
```bash
# Local development
cd ml/serving
uvicorn app:app --reload --port 8000

# Docker
docker build -t ml-inference:latest .
docker run -p 8000:8000 ml-inference:latest

# Test endpoint
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"type":"PHQ9","answers":[0,1,2,1,0,1,0,2,1]}'
```

### Monitoring
```bash
# Start Prometheus
docker run -p 9090:9090 -v ./prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus

# Start Grafana
docker run -p 3001:3000 grafana/grafana

# Generate drift report
python ml/scripts/check_drift.py
```

---

## Next Steps

1. **Choose deployment option**:
   - Option A: Full local + GPU node (for autonomy)
   - Option B: Managed services (AWS SageMaker / Vertex AI)
   - Option C: Hybrid (local training, managed serving)

2. **Set up infrastructure**:
   - Provision GPU node for training
   - Deploy MLflow server
   - Configure S3 buckets
   - Set up vector DB (Pinecone free tier or self-hosted Milvus)

3. **Data collection & labeling**:
   - Export existing screening data
   - Set up Label Studio
   - Create initial seed labels
   - Recruit annotators (internal team or crowdsource)

4. **Baseline models**:
   - Train screening classifier (Sprint 7)
   - Achieve F1 > 0.85 on test set
   - Deploy to staging

5. **Iterate**:
   - Collect live data
   - Retrain weekly
   - Monitor drift
   - A/B test improvements

---

## Support & Resources

- **MLflow Docs**: https://mlflow.org/docs/latest/index.html
- **DVC Docs**: https://dvc.org/doc
- **Hugging Face**: https://huggingface.co/docs
- **Evidently**: https://docs.evidentlyai.com/
- **Label Studio**: https://labelstud.io/guide/

For questions: [Your contact or documentation link]
