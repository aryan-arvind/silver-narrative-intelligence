"""
Narrative analysis service that classifies clusters as narratives vs noise,
assigns lifecycle stages, and generates human-readable descriptions.

ENHANCED: Lifecycle stages now driven by explicit temporal logic:
- Early: Just emerging, limited temporal spread
- Growth: Building momentum with rising or stable mentions
- Acceleration: High persistence + strong coherence consolidation
- Decay: Falling mention trend with fragmenting coherence
"""

from typing import List, Dict, Tuple
import numpy as np


class NarrativeAnalyzer:
    """
    Analyzes clusters to extract narrative intelligence.
    
    Enhanced with:
    - Explicit lifecycle stage detection based on temporal patterns
    - Dynamic timeline generation from mention frequency
    - Defensible scoring logic with clear formulas
    """
    
    # =========================================================================
    # CLASSIFICATION THRESHOLDS
    # =========================================================================
    
    # Minimum thresholds for a cluster to be considered a valid narrative
    COHERENCE_THRESHOLD = 0.3       # Minimum semantic similarity within cluster
    PERSISTENCE_THRESHOLD = 0.2     # Minimum temporal spread
    MIN_SIZE = 2                    # Minimum number of documents
    
    # =========================================================================
    # LIFECYCLE STAGE DETECTION LOGIC
    # =========================================================================
    # 
    # Stage determination uses multiple signals:
    # - Persistence: How many time periods the narrative spans
    # - Trend: Whether mentions are rising, stable, or falling
    # - Coherence evolution: Is the narrative consolidating or fragmenting?
    #
    # Decision matrix:
    # | Persistence | Trend   | Coherence Delta | Stage        |
    # |-------------|---------|-----------------|--------------|
    # | Low (<0.35) | Any     | Any             | Early        |
    # | Med         | Rising  | Positive        | Acceleration |
    # | Med         | Rising  | Negative        | Growth       |
    # | Med         | Stable  | Any             | Growth       |
    # | Med         | Falling | Any             | Decay        |
    # | High (>0.7) | Rising  | Any             | Acceleration |
    # | High        | Stable  | Any             | Acceleration |
    # | High        | Falling | Any             | Decay        |
    # =========================================================================
    
    LIFECYCLE_THRESHOLDS = {
        "persistence_low": 0.35,    # Below this = Early stage
        "persistence_high": 0.70,   # Above this = likely Acceleration
    }
    
    # Keywords for narrative naming and sentiment
    NARRATIVE_PATTERNS = {
        "industrial": {
            "keywords": ["industrial", "manufacturing", "solar", "ev", "electric", "semiconductor", "5g", "tech", "production", "photovoltaic"],
            "name": "Industrial Demand Surge",
            "sentiment": "Bullish"
        },
        "inflation": {
            "keywords": ["inflation", "hedge", "monetary", "dollar", "currency", "central bank", "safe-haven", "yields", "easing"],
            "name": "Inflation Hedge Rally",
            "sentiment": "Bullish"
        },
        "supply": {
            "keywords": ["supply", "mining", "mine", "production decline", "shortage", "disruption", "scrap", "ore"],
            "name": "Supply Constraint Pressure",
            "sentiment": "Bullish"
        },
        "medical": {
            "keywords": ["medical", "healthcare", "antimicrobial", "nanoparticle", "device", "infection"],
            "name": "Medical Applications Growth",
            "sentiment": "Neutral"
        }
    }
    
    def classify_narrative_vs_noise(self, cluster: Dict) -> bool:
        """
        Determine if a cluster represents a valid narrative or noise.
        
        Classification logic:
        1. Must have minimum size (at least 2 documents)
        2. Must have minimum coherence (texts are semantically related)
        3. Must have minimum persistence (spans multiple time periods)
        
        Args:
            cluster: Cluster info dictionary with coherence, persistence, size
            
        Returns:
            True if cluster is a valid narrative, False if noise
        """
        # Rule 1: Size check - need enough data points
        if cluster["size"] < self.MIN_SIZE:
            return False
        
        # Rule 2: Coherence check - texts must be semantically similar
        if cluster["coherence"] < self.COHERENCE_THRESHOLD:
            return False
        
        # Rule 3: Persistence check - must span time
        if cluster["persistence"] < self.PERSISTENCE_THRESHOLD:
            return False
        
        return True
    
    def determine_lifecycle_stage(self, cluster: Dict) -> str:
        """
        Assign lifecycle stage based on explicit temporal logic.
        
        ENHANCED: Now uses multiple signals instead of just persistence:
        - Persistence level (low/medium/high)
        - Mention trend (rising/stable/falling)
        - Coherence evolution (consolidating or fragmenting)
        
        Stages:
        - Early: Narrative is just emerging, limited evidence
        - Growth: Narrative is building momentum, gaining traction
        - Acceleration: Mature narrative with strong presence
        - Decay: Narrative is fading, losing coherence or mentions
        
        Args:
            cluster: Cluster info with temporal metrics
            
        Returns:
            Lifecycle stage string
        """
        persistence = cluster.get("persistence", 0.5)
        frequency = cluster.get("frequency", {})
        evolution = cluster.get("evolution", {})
        
        # Extract signals
        trend = frequency.get("trend", "stable")
        is_consolidating = evolution.get("is_consolidating", False)
        coherence_delta = evolution.get("coherence_delta", 0)
        
        # =====================================================================
        # STAGE DETERMINATION LOGIC
        # =====================================================================
        
        # Stage 1: Early - Low persistence indicates just emerging
        if persistence < self.LIFECYCLE_THRESHOLDS["persistence_low"]:
            return "Early"
        
        # Stage 2: Decay - Falling trend regardless of other factors
        if trend == "falling":
            return "Decay"
        
        # Stage 3: Acceleration - High persistence OR (rising trend + consolidating)
        if persistence >= self.LIFECYCLE_THRESHOLDS["persistence_high"]:
            return "Acceleration"
        
        if trend == "rising" and is_consolidating:
            return "Acceleration"
        
        # Stage 4: Growth - Everything else (medium persistence, stable/rising)
        return "Growth"
    
    def detect_narrative_type(self, texts: List[str]) -> Tuple[str, str, str]:
        """
        Detect narrative type based on keyword matching.
        
        Uses weighted keyword scoring to identify the dominant theme.
        
        Args:
            texts: List of text documents in the cluster
            
        Returns:
            Tuple of (name, sentiment, description)
        """
        combined_text = " ".join(texts).lower()
        
        # Score each pattern by counting keyword occurrences
        pattern_scores = {}
        for pattern_key, pattern_info in self.NARRATIVE_PATTERNS.items():
            score = sum(1 for kw in pattern_info["keywords"] if kw in combined_text)
            if score > 0:
                pattern_scores[pattern_key] = score
        
        if not pattern_scores:
            # No matching pattern - generic narrative
            return "Emerging Market Pattern", "Neutral", "Detected emerging pattern in silver market discourse."
        
        # Select best matching pattern
        best_pattern = max(pattern_scores, key=pattern_scores.get)
        pattern_info = self.NARRATIVE_PATTERNS[best_pattern]
        
        # Generate description
        description = self._generate_description(best_pattern, texts)
        
        return pattern_info["name"], pattern_info["sentiment"], description
    
    def _generate_description(self, pattern_key: str, texts: List[str]) -> str:
        """Generate human-readable description for the narrative."""
        descriptions = {
            "industrial": "Rising industrial demand for silver driven by green energy, semiconductors, and technology manufacturing is creating sustained bullish pressure on prices.",
            "inflation": "Macro-economic conditions including inflation fears and monetary policy shifts are driving safe-haven flows into silver as a store of value.",
            "supply": "Global silver supply faces headwinds from mining disruptions, declining ore grades, and production constraints across major producing regions.",
            "medical": "Emerging applications of silver in medical devices and healthcare settings highlight novel demand drivers for the precious metal."
        }
        return descriptions.get(pattern_key, "Market narrative detected through pattern analysis of recent news flow.")
    
    def compute_confidence(self, cluster: Dict) -> float:
        """
        Compute overall confidence score for the narrative.
        
        ENHANCED: Now considers temporal factors in confidence calculation.
        
        Formula:
        confidence = (w1 * coherence) + (w2 * persistence) + (w3 * size_score) + (w4 * trend_bonus)
        
        Where:
        - coherence: Semantic similarity within cluster (0-1)
        - persistence: Temporal spread (0-1)
        - size_score: Normalized document count (0-1)
        - trend_bonus: Bonus for rising mentions (0-0.1)
        
        Args:
            cluster: Cluster info dictionary
            
        Returns:
            Confidence score (0-1)
        """
        coherence = cluster.get("coherence", 0.5)
        persistence = cluster.get("persistence", 0.5)
        size = cluster.get("size", 0)
        frequency = cluster.get("frequency", {})
        
        # Weight factors (must sum to ~1.0)
        W_COHERENCE = 0.35
        W_PERSISTENCE = 0.30
        W_SIZE = 0.20
        W_TREND = 0.15
        
        # Normalize size (cap at 10 items for max score)
        size_score = min(size / 10.0, 1.0)
        
        # Trend bonus: rising = 1.0, stable = 0.5, falling = 0.0
        trend = frequency.get("trend", "stable")
        trend_score = {"rising": 1.0, "stable": 0.5, "falling": 0.0}.get(trend, 0.5)
        
        # Combine scores
        confidence = (
            W_COHERENCE * coherence +
            W_PERSISTENCE * persistence +
            W_SIZE * size_score +
            W_TREND * trend_score
        )
        
        # Clamp to valid range
        return round(min(max(confidence, 0.0), 0.99), 2)
    
    def generate_timeline(self, cluster: Dict) -> List[int]:
        """
        Generate timeline array from mention frequency data.
        
        ENHANCED: Timeline now reflects actual mention patterns from backend data.
        Each element represents narrative strength on that day.
        
        Timeline format:
        - Index = day (1 = day 1, 7 = day 7)
        - Value = normalized strength (not just presence)
        
        For the API response, we return the list of days where narrative is present.
        
        Args:
            cluster: Cluster info with frequency data
            
        Returns:
            List of days where narrative is present (1-indexed, chronological)
        """
        frequency = cluster.get("frequency", {})
        mentions_by_day = frequency.get("mentions_by_day", {})
        timestamps = cluster.get("timestamps", [])
        
        if not mentions_by_day and timestamps:
            # Fallback: build from raw timestamps
            mentions_by_day = {}
            for ts in timestamps:
                mentions_by_day[ts] = mentions_by_day.get(ts, 0) + 1
        
        if not mentions_by_day:
            return []
        
        # Convert "days ago" to chronological day numbers
        # Days ago: 1 = yesterday, 7 = week ago
        # Chronological: Day 7 = oldest, Day 1 = newest (confusing!)
        # For clarity in UI: we'll use "Day X" where higher = more recent
        max_day = max(mentions_by_day.keys()) if mentions_by_day else 7
        
        timeline = []
        for days_ago, count in mentions_by_day.items():
            # Convert to chronological order (day 1 = oldest, day 7 = newest)
            chronological_day = max_day - days_ago + 1
            timeline.append(chronological_day)
        
        return sorted(set(timeline))
    
    def generate_strength_timeline(self, cluster: Dict) -> List[Dict]:
        """
        Generate detailed timeline with strength values.
        
        This provides richer data for charting if needed.
        
        Returns:
            List of {day: int, strength: float, mentions: int}
        """
        frequency = cluster.get("frequency", {})
        mentions_by_day = frequency.get("mentions_by_day", {})
        
        if not mentions_by_day:
            return []
        
        # Normalize mention counts to 0-1 strength
        max_mentions = max(mentions_by_day.values()) if mentions_by_day else 1
        max_day = max(mentions_by_day.keys())
        
        timeline = []
        for days_ago, count in mentions_by_day.items():
            chronological_day = max_day - days_ago + 1
            strength = count / max_mentions
            timeline.append({
                "day": chronological_day,
                "strength": round(strength, 2),
                "mentions": count
            })
        
        return sorted(timeline, key=lambda x: x["day"])
    
    def analyze_clusters(self, clusters: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Analyze all clusters and separate narratives from noise.
        
        ENHANCED: Uses improved lifecycle detection and timeline generation.
        
        Args:
            clusters: List of cluster info dictionaries (from ClusteringService)
            
        Returns:
            Tuple of (narratives, discarded_noise)
        """
        narratives = []
        noise = []
        
        for idx, cluster in enumerate(clusters):
            is_narrative = self.classify_narrative_vs_noise(cluster)
            
            if is_narrative:
                # Detect narrative type from text content
                name, sentiment, description = self.detect_narrative_type(cluster["texts"])
                
                # Determine lifecycle stage using temporal logic
                stage = self.determine_lifecycle_stage(cluster)
                
                # Compute confidence score
                confidence = self.compute_confidence(cluster)
                
                # Generate timeline from mention frequency
                timeline = self.generate_timeline(cluster)
                
                # Build narrative response object
                narrative = {
                    "id": f"N{idx + 1}",
                    "name": name,
                    "stage": stage,
                    "confidence": confidence,
                    "sentiment": sentiment,
                    "coherence": round(cluster["coherence"], 2),
                    "persistence": round(cluster["persistence"], 2),
                    "description": description,
                    "sources": ["News"],
                    "timeline": timeline
                }
                narratives.append(narrative)
            else:
                noise.append({
                    "cluster_id": cluster["cluster_id"],
                    "reason": self._get_discard_reason(cluster),
                    "texts": cluster["texts"][:2]  # Sample texts for explanation
                })
        
        return narratives, noise
    
    def _get_discard_reason(self, cluster: Dict) -> str:
        """
        Get human-readable reason for discarding a cluster as noise.
        
        Provides explainability for the classification decision.
        """
        reasons = []
        
        if cluster["size"] < self.MIN_SIZE:
            reasons.append(f"insufficient size ({cluster['size']} < {self.MIN_SIZE})")
        
        if cluster["coherence"] < self.COHERENCE_THRESHOLD:
            reasons.append(f"low coherence ({cluster['coherence']:.2f} < {self.COHERENCE_THRESHOLD})")
        
        if cluster["persistence"] < self.PERSISTENCE_THRESHOLD:
            reasons.append(f"low persistence ({cluster['persistence']:.2f} < {self.PERSISTENCE_THRESHOLD})")
        
        return ", ".join(reasons) if reasons else "did not meet classification thresholds"


# Singleton
_analyzer = None


def get_narrative_analyzer() -> NarrativeAnalyzer:
    """Get or create the narrative analyzer singleton."""
    global _analyzer
    if _analyzer is None:
        _analyzer = NarrativeAnalyzer()
    return _analyzer
