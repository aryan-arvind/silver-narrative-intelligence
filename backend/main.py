"""
FastAPI backend for Narrative Detection Agent.
Provides API endpoint for detecting and analyzing silver market narratives.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time

from sample_data import SILVER_NEWS_DATA
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
    1. Load sample news text
    2. Generate sentence embeddings
    3. Cluster texts autonomously using HDBSCAN
    4. Score clusters for coherence and persistence
    5. Classify as narratives vs noise
    6. Assign lifecycle stages
    
    Returns detected narratives and discarded noise.
    """
    start_time = time.time()
    
    try:
        # Step 1: Extract texts and metadata from sample data
        texts = [item["text"] for item in SILVER_NEWS_DATA]
        timestamps = [item["timestamp"] for item in SILVER_NEWS_DATA]
        
        # Step 2: Generate embeddings
        embedding_service = get_embedding_service()
        embeddings = embedding_service.encode(texts)
        
        # Step 3: Cluster texts autonomously
        clustering_service = get_clustering_service()
        labels = clustering_service.cluster(embeddings)
        
        # Step 4: Get cluster information with coherence and persistence scores
        clusters, noise_texts = clustering_service.get_cluster_info(
            embeddings, labels, texts, timestamps
        )
        
        # Step 5 & 6: Analyze clusters - classify and stage
        analyzer = get_narrative_analyzer()
        narratives, classified_noise = analyzer.analyze_clusters(clusters)
        
        # Add noise from outliers (label=-1)
        if noise_texts:
            classified_noise.append({
                "cluster_id": None,
                "reason": "HDBSCAN outlier detection",
                "texts": noise_texts[:3]  # Sample
            })
        
        processing_time = round(time.time() - start_time, 3)
        
        return NarrativesAPIResponse(
            narratives=narratives,
            noise=classified_noise,
            metadata={
                "total_documents": len(texts),
                "clusters_found": len(clusters),
                "narratives_detected": len(narratives),
                "noise_discarded": len(classified_noise),
                "processing_time_seconds": processing_time
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
    return {
        "status": "healthy",
        "services": {
            "embedding": "ready",
            "clustering": "ready",
            "analyzer": "ready"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
