"""
Narrative analysis service that classifies clusters as narratives vs noise,
assigns lifecycle stages, and generates human-readable descriptions.
"""

from typing import List, Dict, Tuple
import numpy as np


class NarrativeAnalyzer:
    """Analyzes clusters to extract narrative intelligence."""
    
    # Thresholds for narrative vs noise classification
    COHERENCE_THRESHOLD = 0.3
    PERSISTENCE_THRESHOLD = 0.3
    MIN_SIZE = 2
    
    # Lifecycle stage thresholds based on persistence
    STAGE_THRESHOLDS = {
        "Early": (0.0, 0.35),
        "Growth": (0.35, 0.65),
        "Acceleration": (0.65, 1.0)
    }
    
    # Keywords for narrative naming and sentiment
    NARRATIVE_PATTERNS = {
        "industrial": {
            "keywords": ["industrial", "manufacturing", "solar", "ev", "electric", "semiconductor", "5g", "tech", "production"],
            "name": "Industrial Demand Surge",
            "sentiment": "Bullish"
        },
        "inflation": {
            "keywords": ["inflation", "hedge", "monetary", "dollar", "currency", "central bank", "safe-haven", "yields"],
            "name": "Inflation Hedge Rally",
            "sentiment": "Bullish"
        },
        "supply": {
            "keywords": ["supply", "mining", "mine", "production decline", "shortage", "disruption", "scrap"],
            "name": "Supply Constraint Pressure",
            "sentiment": "Bullish"
        },
        "medical": {
            "keywords": ["medical", "healthcare", "antimicrobial", "nanoparticle", "device"],
            "name": "Medical Applications Growth",
            "sentiment": "Neutral"
        }
    }
    
    def classify_narrative_vs_noise(self, cluster: Dict) -> bool:
        """
        Determine if a cluster represents a valid narrative or noise.
        
        Args:
            cluster: Cluster info dictionary with coherence, persistence, size
            
        Returns:
            True if cluster is a valid narrative, False if noise
        """
        if cluster["size"] < self.MIN_SIZE:
            return False
        if cluster["coherence"] < self.COHERENCE_THRESHOLD:
            return False
        if cluster["persistence"] < self.PERSISTENCE_THRESHOLD:
            return False
        return True
    
    def determine_lifecycle_stage(self, persistence: float, coherence: float) -> str:
        """
        Assign lifecycle stage based on persistence and coherence.
        
        Early: Just emerging, low persistence
        Growth: Building momentum
        Acceleration: Mature, widespread narrative
        """
        # Use persistence as primary signal
        for stage, (low, high) in self.STAGE_THRESHOLDS.items():
            if low <= persistence < high:
                return stage
        return "Growth"  # Default
    
    def detect_narrative_type(self, texts: List[str]) -> Tuple[str, str, str]:
        """
        Detect narrative type based on keyword matching.
        
        Returns:
            Tuple of (name, sentiment, description)
        """
        combined_text = " ".join(texts).lower()
        
        # Score each pattern
        pattern_scores = {}
        for pattern_key, pattern_info in self.NARRATIVE_PATTERNS.items():
            score = sum(1 for kw in pattern_info["keywords"] if kw in combined_text)
            if score > 0:
                pattern_scores[pattern_key] = score
        
        if not pattern_scores:
            # Generic narrative
            return "Emerging Market Pattern", "Neutral", "Detected emerging pattern in silver market discourse."
        
        # Get best matching pattern
        best_pattern = max(pattern_scores, key=pattern_scores.get)
        pattern_info = self.NARRATIVE_PATTERNS[best_pattern]
        
        # Generate description based on texts
        description = self._generate_description(best_pattern, texts)
        
        return pattern_info["name"], pattern_info["sentiment"], description
    
    def _generate_description(self, pattern_key: str, texts: List[str]) -> str:
        """Generate human-readable description using actual cluster content."""
        # Try to find the best representative text from the cluster
        if texts:
            # Filter valid texts (length > 30)
            valid_texts = [t for t in texts if len(t) > 30]
            
            if valid_texts:
                # Use the longest text as it likely contains the most detail
                # (News headlines or Reddit posts)
                best_text = sorted(valid_texts, key=len, reverse=True)[0]
                
                # Truncate if extremely long (e.g. Reddit selftext)
                if len(best_text) > 180:
                    return best_text[:177] + "..."
                return best_text
        
        # Fallback to static descriptions
        descriptions = {
            "industrial": "Rising industrial demand for silver driven by green energy, semiconductors, and technology manufacturing.",
            "inflation": "Macro-economic conditions including inflation fears and monetary policy shifts are driving safe-haven flows.",
            "supply": "Global silver supply faces headwinds from mining disruptions and production constraints.",
            "medical": "Emerging applications of silver in medical devices and healthcare settings."
        }
        return descriptions.get(pattern_key, "Market narrative detected through pattern analysis of recent news flow.")
    
    def compute_confidence(self, coherence: float, persistence: float, size: int) -> float:
        """
        Compute overall confidence score for the narrative.
        
        Combines coherence, persistence, and size into a single score.
        """
        # Weight factors
        w_coherence = 0.4
        w_persistence = 0.35
        w_size = 0.25
        
        # Normalize size (cap at 10 items)
        size_score = min(size / 10.0, 1.0)
        
        confidence = (
            w_coherence * coherence +
            w_persistence * persistence +
            w_size * size_score
        )
        
        return round(min(confidence, 0.99), 2)
    
    def analyze_clusters(self, clusters: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Analyze all clusters and separate narratives from noise.
        
        Args:
            clusters: List of cluster info dictionaries
            
        Returns:
            Tuple of (narratives, discarded_noise)
        """
        narratives = []
        noise = []
        
        for idx, cluster in enumerate(clusters):
            is_narrative = self.classify_narrative_vs_noise(cluster)
            
            if is_narrative:
                name, sentiment, description = self.detect_narrative_type(cluster["texts"])
                stage = self.determine_lifecycle_stage(
                    cluster["persistence"], 
                    cluster["coherence"]
                )
                confidence = self.compute_confidence(
                    cluster["coherence"],
                    cluster["persistence"],
                    cluster["size"]
                )
                
                # Build timeline from dates
                timeline = sorted(list(set(cluster.get("dates", []))))
                
                # Fallback if no dates (e.g. sample data without dates)
                if not timeline:
                    timestamps = sorted(set(cluster["timestamps"]))
                    timeline = [f"Day {7 - t}" for t in timestamps]
                
                narrative = {
                    "id": f"N{idx + 1}",
                    "name": name,
                    "stage": stage,
                    "confidence": confidence,
                    "sentiment": sentiment,
                    "coherence": round(cluster["coherence"], 2),
                    "persistence": round(cluster["persistence"], 2),
                    "description": description,
                    "sources": cluster.get("sources", ["Unknown"]),
                    "timeline": timeline
                }
                narratives.append(narrative)
            else:
                noise.append({
                    "cluster_id": cluster["cluster_id"],
                    "reason": self._get_discard_reason(cluster),
                    "texts": cluster["texts"][:2]  # Sample texts
                })
        
        return narratives, noise
    
    def _get_discard_reason(self, cluster: Dict) -> str:
        """Get human-readable reason for discarding a cluster."""
        reasons = []
        if cluster["size"] < self.MIN_SIZE:
            reasons.append("insufficient size")
        if cluster["coherence"] < self.COHERENCE_THRESHOLD:
            reasons.append("low coherence")
        if cluster["persistence"] < self.PERSISTENCE_THRESHOLD:
            reasons.append("low persistence")
        return ", ".join(reasons) if reasons else "did not meet thresholds"


# Singleton
_analyzer = None


def get_narrative_analyzer() -> NarrativeAnalyzer:
    """Get or create the narrative analyzer singleton."""
    global _analyzer
    if _analyzer is None:
        _analyzer = NarrativeAnalyzer()
    return _analyzer
