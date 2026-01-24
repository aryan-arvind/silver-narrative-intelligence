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
import os
import json

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
from explanation_service import get_explanation_service, classify_question

# =============================================================================
# CACHED DATA - For explanation service access
# =============================================================================
# The explanation service needs access to the latest narrative data.
# This cache is updated whenever /api/narratives is called.
_cached_narratives = []
_cached_noise = []


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
    
    SNAPSHOT MODE (Default):
    Loads pre-processed narratives from processed_narratives_snapshot.json
    This ensures deterministic, explainable behavior for demos and evaluation.
    
    LIVE MODE (Fallback):
    If snapshot is not available, runs the full pipeline:
    1. INGEST: Load documents via source adapter (API-agnostic)
    2. EMBED: Generate sentence embeddings (SentenceTransformers)
    3. CLUSTER: Group texts autonomously (HDBSCAN)
    4. SCORE: Calculate coherence and persistence
    5. CLASSIFY: Separate narratives from noise
    6. STAGE: Assign lifecycle stages (Early/Growth/Acceleration/Decay)
    
    Returns detected narratives and discarded noise.
    """
    start_time = time.time()
    
    global _cached_narratives, _cached_noise
    
    # =================================================================
    # TRY SNAPSHOT MODE FIRST - Deterministic for demos
    # =================================================================
    snapshot_path = os.path.join(
        os.path.dirname(__file__), 
        'data', 
        'processed_narratives_snapshot.json'
    )
    
    if os.path.exists(snapshot_path):
        try:
            with open(snapshot_path, 'r') as f:
                snapshot = json.load(f)
            
            narratives = snapshot.get('narratives', [])
            noise = snapshot.get('noise', [])
            metadata = snapshot.get('metadata', {})
            
            # Update cache for explanation service
            _cached_narratives = narratives
            _cached_noise = noise
            
            processing_time = round(time.time() - start_time, 3)
            
            return NarrativesAPIResponse(
                narratives=narratives,
                noise=noise,
                metadata={
                    "total_documents": metadata.get("total_documents", 0),
                    "clusters_found": len(narratives),
                    "narratives_detected": len(narratives),
                    "noise_discarded": len(noise),
                    "processing_time_seconds": processing_time,
                    "source": "processed_snapshot",
                    "snapshot_generated": metadata.get("generated_at", "unknown")
                }
            )
        except Exception as e:
            # Fallback to live processing if snapshot fails
            print(f"Snapshot load failed, falling back to live processing: {e}")
    
    # =================================================================
    # FALLBACK: LIVE PROCESSING MODE
    # =================================================================
    try:
        # STEP 1: INGEST - Load documents through source adapter
        adapter = get_source_adapter()
        documents: List[Document] = adapter.get_documents()
        
        texts = [doc.text for doc in documents]
        timestamps = [doc.timestamp for doc in documents]
        
        # STEP 2: EMBED - Generate sentence embeddings
        embedding_service = get_embedding_service()
        embeddings = embedding_service.encode(texts)
        
        # STEP 3: CLUSTER - Autonomous grouping via HDBSCAN
        clustering_service = get_clustering_service()
        labels = clustering_service.cluster(embeddings)
        
        # STEP 4: SCORE - Coherence, persistence, temporal metrics
        clusters, noise_texts = clustering_service.get_cluster_info(
            embeddings, labels, texts, timestamps
        )
        
        # STEP 5 & 6: CLASSIFY + STAGE - Extract narrative intelligence
        analyzer = get_narrative_analyzer()
        narratives, classified_noise = analyzer.analyze_clusters(clusters)
        
        # Add HDBSCAN outliers to noise
        if noise_texts:
            classified_noise.append({
                "cluster_id": None,
                "reason": "HDBSCAN outlier detection",
                "texts": noise_texts[:3]
            })
        
        # Update cache for explanation service
        _cached_narratives = narratives
        _cached_noise = classified_noise
        
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
                "source": adapter.default_source
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
            "analyzer": "ready",
            "explanation": "ready"
        },
        "data_source": adapter.default_source,
        "available_sources": adapter.get_available_sources()
    }


# =============================================================================
# EXPLANATION ENDPOINT - Interpretability layer
# =============================================================================

class ExplainRequest(BaseModel):
    """Request payload for explanation endpoint."""
    question: str


class ExplainResponse(BaseModel):
    """Response from explanation endpoint."""
    question_type: str
    explanation: str
    is_supported: bool
    data_points: dict


@app.post("/api/explain", response_model=ExplainResponse)
async def explain_narrative(request: ExplainRequest):
    """
    Explain narrative detection system decisions.
    
    This endpoint provides interpretability for the narrative intelligence.
    It does NOT generate new intelligence - only explains existing decisions.
    
    SUPPORTED QUESTION TYPES:
    1. narrative_explanation - Why is X classified as Y stage?
    2. comparison - Why is X stronger/weaker than Y?
    3. noise_justification - Why was X discarded as noise?
    4. lifecycle_reasoning - What would make X move to Y stage?
    
    FORBIDDEN:
    - Price predictions
    - Investment advice
    - Questions outside silver market narratives
    
    Args:
        request: Contains the user's question
        
    Returns:
        Structured explanation with question type and supporting data
    """
    global _cached_narratives, _cached_noise
    
    # Ensure we have cached data
    if not _cached_narratives:
        # Trigger a narrative analysis first
        await get_narratives()
    
    try:
        # Get explanation service
        explanation_service = get_explanation_service()
        
        # Generate explanation
        result = explanation_service.explain(
            question=request.question,
            narratives=_cached_narratives,
            noise=_cached_noise
        )
        
        return ExplainResponse(
            question_type=result.question_type,
            explanation=result.explanation,
            is_supported=result.is_supported,
            data_points=result.data_points
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Explanation generation failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
