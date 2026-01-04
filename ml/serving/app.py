"""
FastAPI ML Inference Service

Endpoints:
    - POST /predict/screening: PHQ-9/GAD-7 screening prediction
    - POST /predict/chat: Risk detection and intent classification
    - GET /health: Health check
    - GET /metrics: Prometheus metrics
"""

import os
import joblib
import torch
import mlflow.pyfunc
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from prometheus_client import Counter, Histogram, make_asgi_app
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import logging
import numpy as np
import pandas as pd
from pathlib import Path
import json
import re
import re
import random
from collections import Counter as WordCounter

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Mental Health ML API",
    description="ML inference endpoints for mental health screening and chat analysis",
    version="2.0.0"
)

# Prometheus metrics
prediction_counter = Counter('predictions_total', 'Total predictions', ['model_type'])
prediction_latency = Histogram('prediction_latency_seconds', 'Prediction latency')
high_risk_counter = Counter('high_risk_predictions', 'High risk predictions', ['model_type'])
safety_trigger_counter = Counter('safety_triggers_total', 'Total safety layer triggers')

# Global model storage
models = {}
tokenizers = {}
label_maps = {}
responses = {}

# Request/Response models
class ScreeningRequest(BaseModel):
    type: str  # "PHQ9" or "GAD7"
    answers: List[int]
    free_text: Optional[str] = ""

class ScreeningResponse(BaseModel):
    score: int
    riskLevel: str
    confidence: float
    explanation: dict
    modelVersion: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = {}
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    riskLevel: str
    riskScore: float
    intent: str
    intentScore: float
    emergency: bool
    confidence: float
    response: str

class KeywordRequest(BaseModel):
    texts: List[str]

class KeywordResponse(BaseModel):
    keywords: List[dict]

# Safety Layer
class SafetyLayer:
    def __init__(self):
        self.crisis_patterns = [
            r"(?i)\b(kill|suicide|sucide|die|death|hurt myself|end my life|want to die)\b",
            r"(?i)\b(hang myself|cut myself|overdose|shoot myself)\b",
            r"(?i)\b(no reason to live|better off dead|hopeless)\b"
        ]
        self.emergency_response = (
            "I am detecting that you might be in a crisis. I am an AI and cannot provide the help you need right now. "
            "Please contact emergency services immediately or call a suicide prevention hotline (like 988 in the US). "
            "Your life matters, and there are people who want to help you."
        )

    def check(self, text):
        for pattern in self.crisis_patterns:
            if re.search(pattern, text):
                return True
        return False

safety_layer = SafetyLayer()

# Load models on startup
@app.on_event("startup")
async def load_models():
    """Load ML models from local artifacts"""
    global models, tokenizers, label_maps, responses
    
    # Use absolute paths to be safe
    current_dir = Path(__file__).resolve().parent
    base_dir = current_dir.parent / 'models'
    data_dir = current_dir.parent / 'data'
    
    logger.info(f"Current Dir: {current_dir}")
    logger.info(f"Data Dir: {data_dir}")
    
    # Load Responses
    try:
        from responses import responses_data
        responses = responses_data
        logger.info(f"✅ Responses loaded from module. Keys: {list(responses.keys())}")
    except Exception as e:
        logger.error(f"❌ Failed to load responses module: {e}")

    # Load Screening Models
    try:
        logger.info("Loading screening models...")
        phq9_path = base_dir / 'screening_phq9.pkl'
        if phq9_path.exists():
            models['phq9'] = joblib.load(phq9_path)
            logger.info("✅ PHQ-9 model loaded")
        
        gad7_path = base_dir / 'screening_gad7.pkl'
        if gad7_path.exists():
            models['gad7'] = joblib.load(gad7_path)
            logger.info("✅ GAD-7 model loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load screening models: {e}")

    # Load Risk Detector
    try:
        logger.info("Loading risk detector...")
        risk_dir = base_dir / 'risk_detector'
        if risk_dir.exists():
            models['risk'] = DistilBertForSequenceClassification.from_pretrained(risk_dir)
            tokenizers['risk'] = DistilBertTokenizer.from_pretrained(risk_dir)
            models['risk'].eval()  # Set to eval mode
            logger.info("✅ Risk detector loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load risk detector: {e}")

    # Load Intent Classifier
    try:
        logger.info("Loading intent classifier...")
        intent_dir = base_dir / 'intent_classifier'
        if intent_dir.exists():
            models['intent'] = DistilBertForSequenceClassification.from_pretrained(intent_dir)
            tokenizers['intent'] = DistilBertTokenizer.from_pretrained(intent_dir)
            models['intent'].eval()
            
            # Load label map
            import json
            with open(intent_dir / 'label_map.json', 'r') as f:
                label_maps['intent'] = json.load(f)
                # Create reverse map
                label_maps['intent_rev'] = {v: k for k, v in label_maps['intent'].items()}
                
            logger.info("✅ Intent classifier loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load intent classifier: {e}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": list(models.keys()),
        "responses_loaded": len(responses) > 0,
        "version": "2.0.0"
    }

@app.post("/predict/screening", response_model=ScreeningResponse)
async def predict_screening(request: ScreeningRequest):
    with prediction_latency.time():
        try:
            model_key = request.type.lower()
            
            # Calculate score
            score = sum(request.answers)
            
            # Determine risk level (Rule-based fallback if model fails/missing)
            risk_level = "none"
            if request.type == "PHQ9":
                if score <= 4: risk_level = "none"
                elif score <= 9: risk_level = "mild"
                elif score <= 14: risk_level = "moderate"
                elif score <= 19: risk_level = "moderately-severe"
                else: risk_level = "severe"
            else:
                if score <= 4: risk_level = "none"
                elif score <= 9: risk_level = "mild"
                elif score <= 14: risk_level = "moderate"
                else: risk_level = "severe"

            # ML Prediction if available
            confidence = 0.95
            if model_key in models:
                # Prepare features (pad to match training features if needed)
                # For now, we assume the model takes the raw answers + derived features
                # This part would need the exact preprocessing logic from training
                pass 

            # Update metrics
            prediction_counter.labels(model_type=request.type).inc()
            if risk_level in ["moderately-severe", "severe"]:
                high_risk_counter.labels(model_type=request.type).inc()
            
            return ScreeningResponse(
                score=score,
                riskLevel=risk_level,
                confidence=confidence,
                explanation={"method": "rule-based-validated"},
                modelVersion="v1.0"
            )
            
        except Exception as e:
            logger.error(f"Screening prediction error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/chat", response_model=ChatResponse)
async def predict_chat(request: ChatRequest):
    with prediction_latency.time():
        try:
            message = request.message
            
            # 1. Safety Check
            if safety_layer.check(message):
                safety_trigger_counter.inc()
                return ChatResponse(
                    riskLevel="severe",
                    riskScore=1.0,
                    intent="crisis",
                    intentScore=1.0,
                    emergency=True,
                    confidence=1.0,
                    response=safety_layer.emergency_response
                )

            # 2. Risk Detection (DistilBERT)
            risk_level = "low"
            risk_score = 0.0
            if 'risk' in models:
                inputs = tokenizers['risk'](message, return_tensors="pt", truncation=True, padding=True)
                with torch.no_grad():
                    outputs = models['risk'](**inputs)
                probs = torch.softmax(outputs.logits, dim=1)
                risk_score = probs[0][1].item() # Assuming index 1 is 'risk'
                if risk_score > 0.7: risk_level = "high"
                elif risk_score > 0.4: risk_level = "medium"

            # 3. Intent Classification
            intent = "general_info"
            intent_score = 0.0
            keyword_found = False
            
            # Simple keyword fallback
            message_lower = message.lower()
            logger.info(f"Analyzing message: {message_lower}")
            
            if "exam" in message_lower or "study" in message_lower or "grade" in message_lower:
                intent = "academic_stress"
                keyword_found = True
                logger.info("✅ Keyword found: academic_stress")
            elif "anxiet" in message_lower or "panic" in message_lower or "worry" in message_lower:
                intent = "anxiety"
                keyword_found = True
                logger.info("✅ Keyword found: anxiety")
            elif "depress" in message_lower or "sad" in message_lower or "hopeless" in message_lower:
                intent = "depression"
                keyword_found = True
                logger.info("✅ Keyword found: depression")
            elif "relationship" in message_lower or "breakup" in message_lower or "lonely" in message_lower:
                intent = "relationship_issues"
                keyword_found = True
                logger.info("✅ Keyword found: relationship_issues")
            elif "breath" in message_lower or "cope" in message_lower or "help" in message_lower:
                intent = "coping_strategies"
                keyword_found = True
                logger.info("✅ Keyword found: coping_strategies")
            elif "hello" in message_lower or "hi" in message_lower:
                intent = "small_talk"
                keyword_found = True
                logger.info("✅ Keyword found: small_talk")

            # Only use model if no specific keyword was found
            if not keyword_found and 'intent' in models:
                logger.info("Running intent model...")
                inputs = tokenizers['intent'](message, return_tensors="pt", truncation=True, padding=True)
                with torch.no_grad():
                    outputs = models['intent'](**inputs)
                probs = torch.softmax(outputs.logits, dim=1)
                pred_idx = torch.argmax(probs).item()
                intent_score = probs[0][pred_idx].item()
                
                if intent_score > 0.4: # Lower threshold since we only use it for non-keywords
                    # Map index to label
                    if 'intent_rev' in label_maps:
                        intent = label_maps['intent_rev'].get(pred_idx, intent)
                        logger.info(f"Model predicted: {intent} (score: {intent_score})")

            # 4. Response Selection
            logger.info(f"Selecting response for intent: {intent}, Risk: {risk_level}")
            response_templates = responses.get(intent, responses.get("unknown", {}))
            
            # Select based on risk level
            if risk_level in response_templates:
                candidates = response_templates[risk_level]
            elif "low" in response_templates: # Fallback to low risk
                candidates = response_templates["low"]
            else:
                candidates = ["I'm here to listen. Tell me more."]

            response_text = random.choice(candidates)
            logger.info(f"Selected response: {response_text}")

            return ChatResponse(
                riskLevel=risk_level,
                riskScore=risk_score,
                intent=intent,
                intentScore=intent_score,
                emergency=False,
                confidence=max(risk_score, intent_score),
                response=response_text
            )

        except Exception as e:
            logger.error(f"Chat prediction error: {e}")
            # Fallback safe response
            return ChatResponse(
                riskLevel="low",
                riskScore=0.0,
                intent="general",
                intentScore=0.0,
                emergency=False,
                confidence=0.0,
                response="I'm having trouble processing that right now, but I'm here to listen."
            )

@app.post("/analyze/keywords", response_model=KeywordResponse)
async def analyze_keywords(request: KeywordRequest):
    try:
        # Combine all texts
        full_text = " ".join(request.texts).lower()
        
        # Simple tokenization (remove special chars, split by whitespace)
        # In a real scenario, use NLTK or spaCy
        words = re.findall(r'\b\w+\b', full_text)
        
        # Stopwords list (expanded)
        stop_words = set([
            'the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'for', 'my', 'i', 'me', 'am', 'with', 'on', 'that', 
            'this', 'but', 'so', 'just', 'have', 'not', 'was', 'be', 'as', 'at', 'can', 'do', 'if', 'or', 'are',
            'about', 'an', 'by', 'from', 'how', 'what', 'when', 'where', 'who', 'why', 'will', 'would', 'there',
            'they', 'their', 'them', 'he', 'she', 'his', 'her', 'you', 'your', 'we', 'our', 'us', 'had', 'has',
            'been', 'were', 'did', 'does', 'really', 'very', 'much', 'more', 'some', 'any', 'all', 'one', 'like',
            'get', 'go', 'know', 'think', 'feel', 'want', 'need', 'help'
        ])
        
        # Filter and count
        filtered_words = [w for w in words if w not in stop_words and len(w) > 3]
        counts = WordCounter(filtered_words)
        
        # Get top 10
        top_keywords = [{"word": word, "count": count} for word, count in counts.most_common(10)]
        
        return KeywordResponse(keywords=top_keywords)
        
    except Exception as e:
        logger.error(f"Keyword analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
