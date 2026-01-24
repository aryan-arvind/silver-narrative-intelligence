"""
Source Adapter - API-Agnostic Data Ingestion Layer
====================================================

This module provides a clean abstraction for data ingestion into the narrative
detection pipeline. It decouples the intelligence layer from data sources.

ARCHITECTURE:
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                         SOURCE ADAPTERS                                   │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
    │  │ Sample Data │  │  NewsAPI    │  │  RSS Feeds  │  │  Twitter/X  │     │
    │  │  (Current)  │  │  (Future)   │  │  (Future)   │  │  (Future)   │     │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
    │         │                │                │                │             │
    │         └────────────────┴────────────────┴────────────────┘             │
    │                                   │                                       │
    │                         ┌─────────▼─────────┐                            │
    │                         │  SourceAdapter    │                            │
    │                         │  (Unified API)    │                            │
    │                         └─────────┬─────────┘                            │
    └───────────────────────────────────┼──────────────────────────────────────┘
                                        │
                                        ▼
                              [Narrative Pipeline]
                              - Embedding Service
                              - Clustering Service
                              - Narrative Analyzer

WHY SAMPLE DATA FOR HACKATHON:
    - Deterministic: Same input = Same output (reproducible demos)
    - Offline: No API keys, rate limits, or network failures
    - Curated: Hand-picked examples that showcase narrative patterns
    - Stable: Judges see exactly what we intend to demonstrate

PLUGGING IN LIVE SOURCES:
    To add a new data source, implement a function that returns List[Document].
    Then update get_documents() to call your source. Example:

    def fetch_from_newsapi(query: str, days: int) -> List[Document]:
        # import requests
        # response = requests.get(
        #     "https://newsapi.org/v2/everything",
        #     params={"q": query, "apiKey": API_KEY, "from": date_from}
        # )
        # return [Document(...) for article in response.json()["articles"]]
        pass
"""

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta
import hashlib


# =============================================================================
# DOCUMENT MODEL - Standardized format for all ingested data
# =============================================================================

@dataclass
class Document:
    """
    Standardized document format for the narrative detection pipeline.
    
    All data sources must convert their data to this format before passing
    to the intelligence layer. This ensures the pipeline is source-agnostic.
    
    Attributes:
        id: Unique document identifier (generated from content hash if not provided)
        text: The actual text content to analyze
        timestamp: When this document was published/created (days ago from now)
        source: Origin of the document (e.g., "NewsAPI", "Twitter", "RSS")
        metadata: Optional additional fields (author, url, etc.)
    """
    id: str
    text: str
    timestamp: int  # Days ago (1 = yesterday, 7 = week ago)
    source: str
    metadata: Optional[dict] = None
    
    def __post_init__(self):
        """Generate ID from content hash if not provided."""
        if not self.id:
            content_hash = hashlib.md5(self.text.encode()).hexdigest()[:8]
            self.id = f"doc_{content_hash}"


# =============================================================================
# SAMPLE DATA SOURCE - Used for hackathon demonstrations
# =============================================================================

def _get_sample_silver_news() -> List[Document]:
    """
    Load curated sample news data for silver market narrative detection.
    
    This is the PRIMARY data source for hackathon demonstrations.
    Data is carefully curated to showcase:
    - Industrial demand narrative (solar, EV, semiconductors)
    - Inflation hedge narrative (monetary policy, safe-haven)
    - Supply constraint narrative (mining disruptions)
    - Medical applications narrative (emerging)
    - Noise documents (unrelated market news)
    
    Returns:
        List of Document objects ready for the pipeline
    """
    
    # Curated silver market news data
    SAMPLE_DATA = [
        # =====================================================================
        # INDUSTRIAL DEMAND SURGE NARRATIVE
        # Strong, persistent narrative spanning multiple days
        # =====================================================================
        {
            "text": "Solar panel manufacturers are ramping up production, driving unprecedented demand for silver in photovoltaic cells.",
            "timestamp": 1,
            "source": "News"
        },
        {
            "text": "Electric vehicle battery technology increasingly relies on silver components, boosting industrial consumption.",
            "timestamp": 2,
            "source": "News"
        },
        {
            "text": "5G infrastructure deployment accelerates, with silver paste demand for electronics reaching new highs.",
            "timestamp": 3,
            "source": "News"
        },
        {
            "text": "Green energy transition is creating a structural shift in silver industrial demand patterns.",
            "timestamp": 4,
            "source": "News"
        },
        {
            "text": "Semiconductor shortage has silver component suppliers struggling to meet manufacturing needs.",
            "timestamp": 5,
            "source": "News"
        },
        {
            "text": "Industrial silver consumption hits decade high as tech sector expansion continues.",
            "timestamp": 6,
            "source": "News"
        },
        
        # =====================================================================
        # INFLATION HEDGE NARRATIVE
        # Macro-economic safe-haven narrative
        # =====================================================================
        {
            "text": "Central banks worldwide signal continued monetary easing, investors turn to silver as inflation hedge.",
            "timestamp": 1,
            "source": "News"
        },
        {
            "text": "Dollar weakness accelerates precious metals rally, silver outperforms gold in safe-haven flows.",
            "timestamp": 2,
            "source": "News"
        },
        {
            "text": "Inflation expectations rise sharply, institutional investors increase silver portfolio allocation.",
            "timestamp": 3,
            "source": "News"
        },
        {
            "text": "Real yields turn negative, boosting attractiveness of non-yielding assets like silver.",
            "timestamp": 4,
            "source": "News"
        },
        {
            "text": "Currency debasement fears drive retail investors into physical silver ETFs.",
            "timestamp": 5,
            "source": "News"
        },
        
        # =====================================================================
        # SUPPLY CONSTRAINT NARRATIVE
        # Mining and production challenges
        # =====================================================================
        {
            "text": "Major silver mining operations in Mexico face disruption due to labor disputes.",
            "timestamp": 2,
            "source": "News"
        },
        {
            "text": "Peru mining output declines amid regulatory challenges, impacting global silver supply.",
            "timestamp": 3,
            "source": "News"
        },
        {
            "text": "Primary silver mine production continues multi-year decline as ore grades deteriorate.",
            "timestamp": 4,
            "source": "News"
        },
        {
            "text": "Scrap silver recycling rates fall short of bridging the supply-demand gap.",
            "timestamp": 5,
            "source": "News"
        },
        
        # =====================================================================
        # NOISE - Unrelated market news (should be filtered by HDBSCAN)
        # =====================================================================
        {
            "text": "Weather patterns affecting agricultural commodities show seasonal variations.",
            "timestamp": 1,
            "source": "News"
        },
        {
            "text": "Cryptocurrency markets experience volatility amid regulatory uncertainty.",
            "timestamp": 2,
            "source": "News"
        },
        {
            "text": "Tech stocks rally on strong earnings reports from major companies.",
            "timestamp": 3,
            "source": "News"
        },
        {
            "text": "Oil prices fluctuate as OPEC discusses production quotas.",
            "timestamp": 4,
            "source": "News"
        },
        {
            "text": "Housing market shows mixed signals in different metropolitan areas.",
            "timestamp": 5,
            "source": "News"
        },
        {
            "text": "Random market movement observed across various asset classes today.",
            "timestamp": 6,
            "source": "News"
        },
        {
            "text": "Consumer sentiment index releases show expected seasonal patterns.",
            "timestamp": 7,
            "source": "News"
        },
        
        # =====================================================================
        # MEDICAL APPLICATIONS NARRATIVE (Early stage)
        # Emerging narrative with limited data points
        # =====================================================================
        {
            "text": "New research highlights silver nanoparticles' antimicrobial properties in medical devices.",
            "timestamp": 1,
            "source": "News"
        },
        {
            "text": "Healthcare sector explores silver-based coatings for infection prevention.",
            "timestamp": 2,
            "source": "News"
        },
    ]
    
    # Convert raw data to Document objects
    documents = []
    for idx, item in enumerate(SAMPLE_DATA):
        doc = Document(
            id=f"sample_{idx + 1:03d}",
            text=item["text"],
            timestamp=item["timestamp"],
            source=item["source"],
            metadata={"type": "sample_data", "index": idx}
        )
        documents.append(doc)
    
    return documents


# =============================================================================
# FUTURE: LIVE API ADAPTERS (Not implemented - placeholders for extensibility)
# =============================================================================

def _fetch_from_newsapi(query: str = "silver", days: int = 7) -> List[Document]:
    """
    [FUTURE] Fetch articles from NewsAPI.org
    
    To implement:
    1. Sign up at newsapi.org for API key
    2. pip install requests
    3. Uncomment and modify the code below
    
    Example implementation:
    ```
    import requests
    from datetime import datetime, timedelta
    
    API_KEY = os.environ.get("NEWSAPI_KEY")
    date_from = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    response = requests.get(
        "https://newsapi.org/v2/everything",
        params={
            "q": query,
            "apiKey": API_KEY,
            "from": date_from,
            "language": "en",
            "sortBy": "publishedAt"
        }
    )
    
    documents = []
    for article in response.json().get("articles", []):
        pub_date = datetime.fromisoformat(article["publishedAt"].replace("Z", ""))
        days_ago = (datetime.now() - pub_date).days
        
        documents.append(Document(
            id=hashlib.md5(article["url"].encode()).hexdigest()[:12],
            text=f"{article['title']}. {article['description']}",
            timestamp=max(1, days_ago),
            source="NewsAPI",
            metadata={"url": article["url"], "author": article["author"]}
        ))
    
    return documents
    ```
    """
    # Not implemented for hackathon
    raise NotImplementedError("NewsAPI adapter not configured. Using sample data.")


def _fetch_from_rss(feed_urls: List[str]) -> List[Document]:
    """
    [FUTURE] Fetch articles from RSS feeds
    
    To implement:
    1. pip install feedparser
    2. Add feed URLs for silver/commodity news sources
    
    Example feeds:
    - https://www.kitco.com/rss/all.rss
    - https://www.mining.com/feed/
    """
    raise NotImplementedError("RSS adapter not configured. Using sample data.")


def _fetch_from_twitter(query: str = "silver commodity") -> List[Document]:
    """
    [FUTURE] Fetch tweets from Twitter/X API v2
    
    To implement:
    1. Apply for Twitter API access
    2. pip install tweepy
    3. Filter for relevant financial accounts
    
    Note: Twitter API has strict rate limits and cost considerations.
    """
    raise NotImplementedError("Twitter adapter not configured. Using sample data.")


# =============================================================================
# MAIN ADAPTER INTERFACE - Used by the pipeline
# =============================================================================

class SourceAdapter:
    """
    Unified interface for data ingestion.
    
    This is the ONLY entry point the pipeline uses to get documents.
    All source-specific logic is encapsulated here.
    
    Usage:
        adapter = SourceAdapter()
        documents = adapter.get_documents()
        
        # Or for specific source
        documents = adapter.get_documents(source="sample")
    """
    
    # Available sources
    SOURCES = {
        "sample": _get_sample_silver_news,
        # Future sources (uncomment when implemented):
        # "newsapi": _fetch_from_newsapi,
        # "rss": _fetch_from_rss,
        # "twitter": _fetch_from_twitter,
    }
    
    def __init__(self, default_source: str = "sample"):
        """
        Initialize the adapter.
        
        Args:
            default_source: Which source to use by default.
                           "sample" for hackathon demo (stable, deterministic)
        """
        self.default_source = default_source
    
    def get_documents(self, source: Optional[str] = None) -> List[Document]:
        """
        Fetch documents from the specified source.
        
        This method abstracts away all source-specific details.
        The pipeline code never needs to know where data comes from.
        
        Args:
            source: Source name ("sample", "newsapi", etc.)
                   If None, uses default_source
        
        Returns:
            List of Document objects in standardized format
            
        Raises:
            ValueError: If source is not recognized
            NotImplementedError: If source adapter is not yet implemented
        """
        source = source or self.default_source
        
        if source not in self.SOURCES:
            available = ", ".join(self.SOURCES.keys())
            raise ValueError(f"Unknown source: {source}. Available: {available}")
        
        fetch_fn = self.SOURCES[source]
        documents = fetch_fn()
        
        return documents
    
    def get_available_sources(self) -> List[str]:
        """Return list of available source names."""
        return list(self.SOURCES.keys())


# =============================================================================
# CONVENIENCE FUNCTION - For simple usage
# =============================================================================

def get_documents(source: str = "sample") -> List[Document]:
    """
    Convenience function to get documents without instantiating adapter.
    
    Args:
        source: Source name (default: "sample" for hackathon)
        
    Returns:
        List of Document objects
    """
    adapter = SourceAdapter(default_source=source)
    return adapter.get_documents()


# Singleton adapter instance for reuse
_adapter = None


def get_source_adapter() -> SourceAdapter:
    """Get or create the source adapter singleton."""
    global _adapter
    if _adapter is None:
        _adapter = SourceAdapter()
    return _adapter
