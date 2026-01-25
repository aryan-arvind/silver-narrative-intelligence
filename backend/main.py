"""
FastAPI backend for Narrative Detection Agent.
Provides API endpoint for detecting and analyzing silver market narratives.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time
from datetime import date, timedelta

from sample_data import SILVER_NEWS_DATA
from embedding_service import get_embedding_service
from clustering_service import get_clustering_service
from narrative_analyzer import get_narrative_analyzer
from data_ingestion_service import get_ingestion_service

from explanation_service import get_explanation_service

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
    timeline: List[str]
    narrative_status: str  # New field: Emerging, Strengthening, Fading, Continuing


class NoiseItem(BaseModel):
    cluster_id: Optional[int]
    reason: str
    texts: List[str]


class NarrativesAPIResponse(BaseModel):
    narratives: List[NarrativeResponse]
    noise: List[NoiseItem]
    metadata: dict


class ExplainRequest(BaseModel):
    question: str


class ExplainResponse(BaseModel):
    question_type: str
    explanation: str
    is_supported: bool
    data_points: dict


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


# Global cache for latest analysis (in-memory for hackathon)
_cached_narratives = []
_cached_noise = []


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "service": "Narrative Detection Agent"}


@app.get("/api/narratives", response_model=NarrativesAPIResponse)
async def get_narratives(use_live_data: bool = True):
    """
    Main endpoint for narrative detection.
    
    Args:
        use_live_data: If True, fetch real-time data from News API and Reddit.
                      If False, use sample data.
    
    Pipeline:
    1. Load news data (live or sample)
    2. Generate sentence embeddings
    3. Cluster texts autonomously using HDBSCAN
    4. Score clusters for coherence and persistence
    5. Classify as narratives vs noise
    6. Assign lifecycle stages
    
    Returns detected narratives and discarded noise.
    """
    global _cached_narratives, _cached_noise
    start_time = time.time()
    
    try:
        # Step 1: Get data from live sources or sample data
        if use_live_data:
            ingestion_service = get_ingestion_service()
            data = ingestion_service.fetch_all_sources()
            data_source = "live"
            
            # Fallback if live data fails or returns nothing
            if not data:
                print("Live data search returned 0 results. Falling back to sample data.")
                data = SILVER_NEWS_DATA
                data_source = "sample_fallback"
        else:
            data = SILVER_NEWS_DATA
            data_source = "sample"
        
        # Extract texts, timestamps, and sources
        texts = [item["text"] for item in data]
        timestamps = [item.get("timestamp", 1) for item in data]
        text_sources = [item.get("source", "Unknown") for item in data]
        sources = list(set(text_sources))
        
        # Extract or calculate dates
        today = date.today()
        dates = []
        for item in data:
            if "date" in item:
                dates.append(item["date"])
            else:
                # Calculate from timestamp (days ago) for sample data
                days_ago = item.get("timestamp", 0)
                d = today - timedelta(days=days_ago)
                dates.append(d.strftime("%Y-%m-%d"))
        
        # Step 2: Generate embeddings
        embedding_service = get_embedding_service()
        embeddings = embedding_service.encode(texts)
        
        # Step 3: Cluster texts autonomously
        clustering_service = get_clustering_service()
        labels = clustering_service.cluster(embeddings)
        
        # Step 4: Get cluster information with coherence and persistence scores
        clusters, noise_texts = clustering_service.get_cluster_info(
            embeddings, labels, texts, timestamps, text_sources, dates
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
            
        # Determine narrative status/continuity using Fuzzy Matching
        # Compare with _cached_narratives (previous run)
        
        # Helper to find best match in previous run
        def find_best_match(current_name, previous_list):
            curr_tokens = set(current_name.lower().replace(':', '').replace('(', '').replace(')', '').split())
            best_match = None
            best_overlap = 0
            
            for prev in previous_list:
                prev_tokens = set(prev["name"].lower().replace(':', '').replace('(', '').replace(')', '').split())
                # intersection
                overlap = len(curr_tokens.intersection(prev_tokens))
                
                # We need significant overlap (e.g. > 50% of tokens or at least 2 words)
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_match = prev
            
            # Threshold: At least 2 words overlap ("Industrial Demand" matches "Industrial Demand (Solar)")
            if best_overlap >= 2:
                return best_match
            return None

        previous_run = _cached_narratives if _cached_narratives else []
        
        for n in narratives:
            # Try finding a match in previous run
            prev = find_best_match(n["name"], previous_run)
            
            if not prev:
                # Case 1: Did not exist last run
                n["narrative_status"] = "Emerging"
            else:
                # Case 2: Existed last run - compare metrics
                curr_p = n["persistence"]
                prev_p = prev["persistence"]
                
                # REFINEMENT: Only move to Continuing/Strengthening if persistence is significant
                if curr_p < 0.35:
                     # It persists, but is weak. Keep as Emerging.
                     n["narrative_status"] = "Emerging"
                else:
                    if curr_p > prev_p:
                        n["narrative_status"] = "Strengthening"
                    elif curr_p < prev_p:
                        n["narrative_status"] = "Fading"
                    else:
                        n["narrative_status"] = "Continuing"
                    
        # Update cache
        _cached_narratives = narratives
        _cached_noise = classified_noise
        
        processing_time = round(time.time() - start_time, 3)
        
        return NarrativesAPIResponse(
            narratives=narratives,
            noise=classified_noise,
            metadata={
                "total_documents": len(texts),
                "clusters_found": len(clusters),
                "narratives_detected": len(narratives),
                "noise_discarded": len(classified_noise),
                "processing_time_seconds": processing_time,
                "data_source": data_source,
                "sources": sources
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Narrative detection pipeline failed: {str(e)}"
        )


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


@app.get("/api/health")
async def health_check():
    """Detailed health check with service status."""
    return {
        "status": "healthy",
        "services": {
            "embedding": "ready",
            "clustering": "ready",
            "analyzer": "ready",
            "explanation": "ready"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
