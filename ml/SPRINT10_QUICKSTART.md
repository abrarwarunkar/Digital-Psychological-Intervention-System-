# Sprint 10 Quickstart: Recommendations & Summarization

## 🎯 Goal
Implement a personalized recommendation engine for mental health resources and an AI-powered session summarization tool for counselors.

## 📋 Checklist

### 1. Recommendation Engine
- [ ] **Script**: `ml/scripts/train_recommender.py` (Hybrid filtering)
- [ ] **Model**: `RecommendationFeedback` (Track user interactions)
- [ ] **API**: `GET /api/recommendations` (Personalized list)
- [ ] **UI**: `ResourceRecommendation.jsx` (Dashboard component)

### 2. Session Summarization
- [ ] **Script**: `ml/scripts/train_summarizer.py` (T5/BART fine-tuning)
- [ ] **Model**: `SessionSummary` (Store summaries)
- [ ] **API**: `POST /api/sessions/:id/summarize`
- [ ] **UI**: `CounselorSessionView.jsx` (Counselor dashboard)

## 🚀 How to Run

### Train Recommender
```bash
cd ml
python scripts/train_recommender.py
```

### Train Summarizer
```bash
cd ml
python scripts/train_summarizer.py
```

### Test API
```bash
# Get recommendations
curl http://localhost:3000/api/recommendations?userId=123

# Generate summary
curl -X POST http://localhost:3000/api/sessions/456/summarize
```

## 🧠 Key Concepts
- **Hybrid Filtering**: Combines collaborative filtering (users like you) with content-based filtering (tags/categories).
- **Cold Start**: Uses demographic data and screening results for new users.
- **Abstractive Summarization**: Generates concise summaries rather than just extracting sentences.
