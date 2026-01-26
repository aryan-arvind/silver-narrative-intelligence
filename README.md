Narrative Detection Agent

**Autonomous Pattern Hunter for Silver Prediction Market**

A complete system that detects, validates, and visualizes market narratives around silver from text data, separating coherent narratives from noise, and exposing narrative lifecycle intelligence.

---

## 🏗 Project Structure

```
ECHELON2.0/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── sample_data.py          # Silver market news data
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

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js (optional, for serving frontend)

### 1. Start the Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
python main.py
```

The backend will be running at: **http://localhost:8000**

### 2. Start the Frontend

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Option 1: Python simple server
python3 -m http.server 8080

# Option 2: Node.js (if installed)
npx serve -p 8080
```

The frontend will be running at: **http://localhost:8080**

---

## 📡 API Endpoints

### `GET /api/narratives`

Returns detected narratives and discarded noise.

**Response Schema:**
```json
{
  "narratives": [
    {
      "id": "N1",
      "name": "Industrial Demand Surge",
      "stage": "Growth",
      "confidence": 0.82,
      "sentiment": "Bullish",
      "coherence": 0.76,
      "persistence": 0.81,
      "description": "Human readable explanation",
      "sources": ["News"],
      "timeline": [2, 3, 4, 5, 6]
    }
  ],
  "noise": [...],
  "metadata": {
    "total_documents": 25,
    "clusters_found": 4,
    "narratives_detected": 3,
    "processing_time_seconds": 1.234
  }
}
```

### `GET /api/health`

Health check endpoint.

---

## 🎯 Features

### Frontend Dashboard
- **Overview Cards**: Active narratives, market bias, volatility, confidence
- **Narrative Strength Timeline**: Chart.js visualization
- **Detected Narratives List**: Clickable cards with details
- **Narrative Details Panel**: Lifecycle stage, confidence/coherence/persistence bars
- **Valid vs Noise Analysis**: Side-by-side comparison
- **Dark Analyst-Grade Theme**: Bloomberg-inspired design

### Backend Pipeline
1. **Load Sample Data**: Silver market news texts
2. **Generate Embeddings**: SentenceTransformers (all-MiniLM-L6-v2)
3. **Autonomous Clustering**: HDBSCAN (no predefined cluster count)
4. **Score Clusters**: Coherence & persistence metrics
5. **Classify**: Narratives vs Noise
6. **Stage Assignment**: Early → Growth → Acceleration

---

## 🔧 Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML, CSS, Vanilla JavaScript, Chart.js |
| Backend | Python, FastAPI, Uvicorn |
| Embeddings | SentenceTransformers |
| Clustering | HDBSCAN |
| Styling | Custom Bloomberg-like dark theme |

---

## 📝 Notes

- No authentication required
- No database - data is processed in-memory
- Frontend fetches from backend via REST API
- CORS enabled for cross-origin requests
- Graceful error handling with visible error messages



Built for narrative intelligence, not trading. Focus on clarity and explainability.
