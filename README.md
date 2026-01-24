# ECHELON 2.0 - Narrative Detection Agent

**Autonomous Pattern Hunter for Silver Prediction Market**

A complete system that detects, validates, and visualizes market narratives around silver from text data, separating coherent narratives from noise, and exposing narrative lifecycle intelligence.

---

## 🏗 Project Structure

```
ECHELON2.0/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── ingestion/              # Data ingestion layer
│   │   ├── __init__.py
│   │   └── source_adapter.py   # API-agnostic data adapter
│   ├── embedding_service.py    # SentenceTransformer embeddings
│   ├── clustering_service.py   # HDBSCAN autonomous clustering
│   ├── narrative_analyzer.py   # Narrative classification & scoring
│   └── requirements.txt        # Python dependencies
│
└── frontend/
    ├── index.html              # Main dashboard HTML
    ├── styles.css              # Bloomberg-like dark theme
    └── app.js                  # Frontend application logic
```

---

## 🔌 Ingestion Layer Architecture

The ingestion layer is **API-agnostic** and can be swapped with live news feeds without modifying downstream intelligence.

```
┌──────────────────────────────────────────────────────────────┐
│                      SOURCE ADAPTERS                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │  Sample   │  │  NewsAPI  │  │   RSS     │  │ Twitter/X │ │
│  │  (Demo)   │  │ (Future)  │  │ (Future)  │  │ (Future)  │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ │
│        └──────────────┴──────────────┴──────────────┘        │
│                              │                                │
│                    ┌─────────▼─────────┐                     │
│                    │   SourceAdapter   │                     │
│                    │   (Unified API)   │                     │
│                    └─────────┬─────────┘                     │
└──────────────────────────────┼───────────────────────────────┘
                               ▼
                    [Narrative Pipeline]
```

**Why sample data for hackathon:**
- Deterministic: Same input = same output (reproducible demos)
- Offline: No API keys, rate limits, or network failures
- Curated: Hand-picked examples showcasing narrative patterns

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+

### 1. Start the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

Backend: **http://localhost:8000**

### 2. Start the Frontend

```bash
cd frontend
python3 -m http.server 8080
```

Frontend: **http://localhost:8080**

---

## 📡 API Endpoints

### `GET /api/narratives`

Returns detected narratives and discarded noise.

```json
{
  "narratives": [{
    "id": "N1",
    "name": "Industrial Demand Surge",
    "stage": "Acceleration",
    "confidence": 0.82,
    "sentiment": "Bullish",
    "coherence": 0.76,
    "persistence": 0.81,
    "description": "Human readable explanation",
    "sources": ["News"],
    "timeline": [1, 2, 3, 4, 5, 6]
  }],
  "noise": [...],
  "metadata": {
    "total_documents": 24,
    "source": "sample"
  }
}
```

### `GET /api/health`

Health check with ingestion layer status.

---

## 🧠 Intelligence Pipeline

| Stage | Component | Function |
|-------|-----------|----------|
| 1. Ingest | `source_adapter.py` | Load documents (API-agnostic) |
| 2. Embed | `embedding_service.py` | SentenceTransformers vectors |
| 3. Cluster | `clustering_service.py` | HDBSCAN autonomous grouping |
| 4. Score | `clustering_service.py` | Coherence + persistence metrics |
| 5. Classify | `narrative_analyzer.py` | Narrative vs noise |
| 6. Stage | `narrative_analyzer.py` | Early → Growth → Acceleration → Decay |

---

## 🎯 Lifecycle Stages

Stages are explicitly driven by temporal logic:

| Stage | Condition |
|-------|-----------|
| **Early** | Persistence < 0.35 |
| **Growth** | Medium persistence, stable/rising trend |
| **Acceleration** | Persistence > 0.70 OR rising + consolidating |
| **Decay** | Falling mention trend |

---

## 🔧 Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML, CSS, Vanilla JS, Chart.js |
| Backend | Python, FastAPI, Uvicorn |
| Embeddings | SentenceTransformers |
| Clustering | HDBSCAN |
| Design | Bloomberg-inspired dark theme |

---

## 💬 Narrative Explanation Interface

The chatbot does not generate narratives or predictions. It explains and justifies the intelligence produced by the narrative detection system, providing transparency and interpretability.

**Supported Questions:**

| Type | Example |
|------|---------|
| Stage Explanation | "Why is Industrial Demand Surge marked as Acceleration?" |
| Comparison | "Why is Inflation Hedge weaker than Industrial Demand?" |
| Noise Justification | "Why was this discarded as noise?" |
| Lifecycle Reasoning | "What would make this narrative move to Acceleration?" |

**Endpoint:** `POST /api/explain`

```json
{
  "question": "Why is Industrial Demand Surge classified as Acceleration?"
}
```

**Forbidden:**
- Price predictions
- Investment advice
- Questions outside silver market scope

---
This system deliberately refuses to:
• Predict prices
• Give trading advice
• Hallucinate narratives
• Override backend intelligence

## 📝 Notes

- No authentication required
- No database - in-memory processing
- CORS enabled for cross-origin requests
- Graceful error handling

---

## 🏆 Hackathon Submission

Built for narrative intelligence, not trading. Focus on clarity and explainability.
