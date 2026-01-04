# Sprint 9 Quick Start Guide

## Prerequisites

```bash
# Install RAG dependencies
pip install pymilvus sentence-transformers openai langchain
```

## 1. Start Milvus Vector Database

```bash
# From project root
docker-compose -f docker-compose.ml.yml up -d milvus etcd minio-milvus
```

## 2. Setup Vector Database

```bash
cd ml
python scripts/setup_vector_db.py --collection mental_health_kb --dim 384
```

Creates Milvus collection with:
- 384-dimensional embeddings (bge-small-en-v1.5)
- Cosine similarity index
- Schema: id, embedding, content, title, category

## 3. Embed Knowledge Base Documents

```bash
python scripts/embed_documents.py \
  --input-dir data/knowledge_base \
  --model bge-small-en-v1.5
```

Processes all JSON documents in knowledge_base/ and stores embeddings in Milvus.

## 4. Test RAG Retrieval

```bash
python scripts/test_rag.py --query "What are symptoms of depression?"
```

Expected output:
- Top 5 relevant document chunks
- Similarity scores
- Source metadata

## 5. Test RAG Generation

```bash
# Set OpenAI API key (or use Llama 2)
export OPENAI_API_KEY=sk-your-key-here

python scripts/test_rag_generation.py \
  --query "How can I manage anxiety?" \
  --model gpt-3.5-turbo
```

Expected output:
- Evidence-based answer
- Source citations
- Safety check passed

## 6. Start ML Inference Service

```bash
# Update serving/app.py with RAG endpoint
cd ..
docker-compose -f docker-compose.ml.yml build ml-inference
docker-compose -f docker-compose.ml.yml up -d ml-inference
```

## 7. Test RAG API

```bash
curl -X POST http://localhost:8000/api/ml/rag/answer \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is cognitive behavioral therapy?",
    "conversationHistory": []
  }'
```

Expected response:
```json
{
  "answer": "Cognitive Behavioral Therapy (CBT) is...",
  "sources": [...],
  "confidence": 0.89,
  "usedRAG": true
}
```

---

## Knowledge Base Structure

Add more documents to expand the knowledge base:

```
ml/data/knowledge_base/
├── mental_health_conditions/
│   ├── depression.json ✅
│   ├── anxiety.json ✅
│   ├── ptsd.json (add more)
│   └── ocd.json
├── coping_strategies/
│   ├── breathing_exercises.json ✅
│   ├── mindfulness.json
│   └── cbt_techniques.json
├── crisis_info/
│   ├── crisis_resources.json ✅
│   └── safety_planning.json
├── resources/
│   └── campus_services.json
└── wellness/
    ├── sleep_hygiene.json
    └── exercise_mental_health.json
```

Each document should be a JSON file with:
```json
{
  "id": "unique_id",
  "title": "Document Title",
  "category": "category_name",
  "content": "Full text content...",
  "tags": ["tag1", "tag2"],
  "source": "Source Organization",
  "verified": true,
  "last_updated": "2024-01-15"
}
```

---

## LLM Options

### Option A: OpenAI (Recommended for Quality)
```bash
export OPENAI_API_KEY=sk-your-key-here
# Uses GPT-3.5-Turbo by default ($0.001/1K tokens)
```

### Option B: Llama 2 (Free, Self-hosted)
```python
# In rag_generator.py, use:
from langchain.llms import HuggingFacePipeline
model = HuggingFacePipeline.from_model_id(
    model_id="meta-llama/Llama-2-13b-chat-hf",
    task="text-generation"
)
```

---

## Performance Targets

- **Retrieval Recall@5**: >= 0.85
- **Retrieval Latency**: < 200ms
- **Generation Latency**: < 2s (GPT-3.5), < 5s (Llama 2)
- **Factual Accuracy**: >= 95% (grounded in context)
- **User Helpfulness**: >= 4/5 rating

---

## Troubleshooting

**Issue**: Milvus connection error
**Fix**: Ensure Milvus services are running:
```bash
docker-compose -f ../docker-compose.ml.yml ps | grep milvus
```

**Issue**: No results from retrieval
**Fix**: Check if documents are embedded:
```bash
python scripts/setup_vector_db.py --test
```

**Issue**: LLM hallucinations
**Fix**: Strengthen system prompt, use safety filters, lower temperature

**Issue**: High OpenAI costs
**Fix**: Cache common responses, use GPT-3.5 instead of GPT-4, set rate limits
