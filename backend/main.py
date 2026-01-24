"""
FastAPI backend for Narrative Detection Agent.
Provides API endpoint for detecting and analyzing silver market narratives.

ARCHITECTURE:
    [Ingestion Layer] → [Embedding] → [Clustering] → [Analysis] → [API]
    
The ingestion layer is decoupled from the intelligence pipeline.
Data source can be swapped without modifying downstream components.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time

# =============================================================================
# INGESTION LAYER - All data comes through here
# =============================================================================
from ingestion.source_adapter import get_source_adapter, Document

# =============================================================================
# INTELLIGENCE PIPELINE
# =============================================================================
from embedding_service import get_embedding_service
from clustering_service import get_clustering_service
from narrative_analyzer import get_narrative_analyzer


# Pydantic models for API response
class NarrativeResponse(BaseModel):
    id: str
    name: str
    stage: str
    confidence: float
    sentiment: str
    coherence: float
    persistence: float
    description: str
    sources: List[str]
    timeline: List[int]


class NoiseItem(BaseModel):
    cluster_id: Optional[int]
    reason: str
    texts: List[str]


class NarrativesAPIResponse(BaseModel):
    narratives: List[NarrativeResponse]
    noise: List[NoiseItem]
    metadata: dict


# Initialize FastAPI app
app = FastAPI(
    title="Narrative Detection Agent API",
    description="Autonomous pattern hunter for silver market narratives",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "service": "Narrative Detection Agent"}


@app.get("/api/narratives", response_model=NarrativesAPIResponse)
async def get_narratives():
    """
    Main endpoint for narrative detection.
    
    Pipeline:
    1. INGEST: Load documents via source adapter (API-agnostic)
    2. EMBED: Generate sentence embeddings (SentenceTransformers)
    3. CLUSTER: Group texts autonomously (HDBSCAN)
    4. SCORE: Calculate coherence and persistence
    5. CLASSIFY: Separate narratives from noise
    6. STAGE: Assign lifecycle stages (Early/Growth/Acceleration/Decay)
    
    Returns detected narratives and discarded noise.
    """
    start_time = time.time()
    
    try:
        # =================================================================
        # STEP 1: INGEST - Load documents through source adapter
        # =================================================================
        # The adapter abstracts away the data source.
        # Currently uses sample data; can be swapped to NewsAPI/RSS/Twitter
        # without changing any code below this line.
        adapter = get_source_adapter()
        documents: List[Document] = adapter.get_documents()
        
        # Extract texts and timestamps from standardized documents
        texts = [doc.text for doc in documents]
        timestamps = [doc.timestamp for doc in documents]
        
        # =================================================================
        # STEP 2: EMBED - Generate sentence embeddings
        # =================================================================
        embedding_service = get_embedding_service()
        embeddings = embedding_service.encode(texts)
        
        # =================================================================
        # STEP 3: CLUSTER - Autonomous grouping via HDBSCAN
        # =================================================================
        clustering_service = get_clustering_service()
        labels = clustering_service.cluster(embeddings)
        
        # =================================================================
        # STEP 4: SCORE - Coherence, persistence, temporal metrics
        # =================================================================
        clusters, noise_texts = clustering_service.get_cluster_info(
            embeddings, labels, texts, timestamps
        )
        
        # =================================================================
        # STEP 5 & 6: CLASSIFY + STAGE - Extract narrative intelligence
        # =================================================================
        analyzer = get_narrative_analyzer()
        narratives, classified_noise = analyzer.analyze_clusters(clusters)
        
        # Add HDBSCAN outliers to noise
        if noise_texts:
            classified_noise.append({
                "cluster_id": None,
                "reason": "HDBSCAN outlier detection",
                "texts": noise_texts[:3]  # Sample for display
            })
        
        processing_time = round(time.time() - start_time, 3)
        
        return NarrativesAPIResponse(
            narratives=narratives,
            noise=classified_noise,
            metadata={
                "total_documents": len(documents),
                "clusters_found": len(clusters),
                "narratives_detected": len(narratives),
                "noise_discarded": len(classified_noise),
                "processing_time_seconds": processing_time,
                "source": adapter.default_source  # Show which source was used
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Narrative detection pipeline failed: {str(e)}"
        )


@app.get("/api/health")
async def health_check():
    """Detailed health check with service status."""
    adapter = get_source_adapter()
    return {
        "status": "healthy",
        "services": {
            "ingestion": "ready",
            "embedding": "ready",
            "clustering": "ready",
            "analyzer": "ready"
        },
        "data_source": adapter.default_source,
        "available_sources": adapter.get_available_sources()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
