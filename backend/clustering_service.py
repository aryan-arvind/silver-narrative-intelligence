"""
Autonomous clustering service using HDBSCAN for narrative detection.
No predefined cluster count - algorithm discovers clusters automatically.

ENHANCED: Now includes temporal analysis for lifecycle detection and
dynamic timeline generation based on mention patterns.
"""

import hdbscan
import numpy as np
from typing import List, Dict, Tuple
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter


class ClusteringService:
    """
    Service for autonomous clustering of text embeddings.
    
    Enhanced with:
    - Temporal mention frequency tracking
    - Trend detection (rising, stable, falling)
    - Time-window based coherence evolution
    """
    
    def __init__(self, min_cluster_size: int = 2, min_samples: int = 1):
        """
        Initialize HDBSCAN clustering parameters.
        
        Args:
            min_cluster_size: Minimum number of samples in a cluster
            min_samples: Number of samples in neighborhood for core points
        """
        self.min_cluster_size = min_cluster_size
        self.min_samples = min_samples
    
    def cluster(self, embeddings: np.ndarray) -> np.ndarray:
        """
        Cluster embeddings using HDBSCAN.
        
        HDBSCAN automatically determines cluster count based on density.
        Label -1 indicates noise (outliers that don't fit any cluster).
        
        Args:
            embeddings: Document embeddings array (n_docs, embedding_dim)
            
        Returns:
            Cluster labels array (-1 indicates noise)
        """
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=self.min_cluster_size,
            min_samples=self.min_samples,
            metric='euclidean',
            cluster_selection_method='eom'  # Excess of Mass - better for varying densities
        )
        labels = clusterer.fit_predict(embeddings)
        return labels
    
    def compute_coherence(self, embeddings: np.ndarray, labels: np.ndarray) -> Dict[int, float]:
        """
        Compute coherence score for each cluster.
        
        Coherence measures cluster compactness via average pairwise cosine similarity.
        Higher coherence = texts in cluster are semantically more similar.
        
        Formula: coherence = mean(cosine_similarity(text_i, text_j)) for all pairs
        
        Args:
            embeddings: Document embeddings
            labels: Cluster labels
            
        Returns:
            Dictionary mapping cluster_id -> coherence_score (0-1)
        """
        coherence_scores = {}
        unique_labels = set(labels)
        
        for label in unique_labels:
            if label == -1:  # Skip noise
                continue
            
            cluster_mask = labels == label
            cluster_embeddings = embeddings[cluster_mask]
            
            if len(cluster_embeddings) < 2:
                # Single item cluster - assign moderate coherence
                coherence_scores[label] = 0.5
                continue
            
            # Compute full pairwise similarity matrix
            similarities = cosine_similarity(cluster_embeddings)
            
            # Extract upper triangle (excluding diagonal self-similarities)
            n = len(cluster_embeddings)
            upper_tri_indices = np.triu_indices(n, k=1)
            pairwise_sims = similarities[upper_tri_indices]
            
            if len(pairwise_sims) > 0:
                # Mean similarity as coherence measure
                coherence_scores[label] = float(np.mean(pairwise_sims))
            else:
                coherence_scores[label] = 0.5
        
        return coherence_scores
    
    def compute_persistence(self, labels: np.ndarray, timestamps: List[int]) -> Dict[int, float]:
        """
        Compute persistence score for each cluster.
        
        Persistence measures temporal spread - how many distinct time periods
        the narrative appears in. High persistence = narrative is sustained over time.
        
        Formula: persistence = unique_periods / (total_time_range * 0.5)
        Capped at 1.0 for normalization.
        
        Args:
            labels: Cluster labels
            timestamps: Timestamp for each document (days ago, 1=yesterday, 7=week ago)
            
        Returns:
            Dictionary mapping cluster_id -> persistence_score (0-1)
        """
        persistence_scores = {}
        unique_labels = set(labels)
        timestamps = np.array(timestamps)
        
        # Calculate global time range for normalization
        if len(timestamps) > 0:
            max_range = max(timestamps) - min(timestamps) + 1
        else:
            max_range = 1
        
        for label in unique_labels:
            if label == -1:
                continue
            
            cluster_mask = labels == label
            cluster_timestamps = timestamps[cluster_mask]
            
            # Count unique time periods where this narrative appears
            unique_periods = len(set(cluster_timestamps))
            
            # Normalize by half of max range (50% coverage = 1.0 persistence)
            # This rewards narratives that span multiple days
            persistence_scores[label] = min(1.0, unique_periods / max(max_range * 0.5, 1))
        
        return persistence_scores
    
    def compute_mention_frequency(self, labels: np.ndarray, timestamps: List[int]) -> Dict[int, Dict]:
        """
        Compute mention frequency distribution over time for each cluster.
        
        This powers the timeline visualization and lifecycle stage detection.
        
        Returns per-cluster:
        - mentions_by_day: {day: count} dictionary
        - total_mentions: total document count
        - trend: 'rising', 'stable', or 'falling'
        
        Args:
            labels: Cluster labels
            timestamps: Timestamp for each document
            
        Returns:
            Dictionary mapping cluster_id -> frequency_info
        """
        frequency_data = {}
        unique_labels = set(labels)
        timestamps = np.array(timestamps)
        
        for label in unique_labels:
            if label == -1:
                continue
            
            cluster_mask = labels == label
            cluster_timestamps = timestamps[cluster_mask]
            
            # Count mentions per day
            mentions_by_day = Counter(cluster_timestamps)
            
            # Convert to sorted list for trend analysis
            sorted_days = sorted(mentions_by_day.keys())
            mention_counts = [mentions_by_day[d] for d in sorted_days]
            
            # Detect trend direction
            trend = self._detect_trend(sorted_days, mention_counts)
            
            frequency_data[label] = {
                "mentions_by_day": dict(mentions_by_day),
                "total_mentions": len(cluster_timestamps),
                "trend": trend,
                "first_seen": min(sorted_days) if sorted_days else 0,
                "last_seen": max(sorted_days) if sorted_days else 0,
                "peak_day": max(mentions_by_day, key=mentions_by_day.get) if mentions_by_day else 0
            }
        
        return frequency_data
    
    def _detect_trend(self, days: List[int], counts: List[int]) -> str:
        """
        Detect trend direction from mention counts over time.
        
        Uses simple linear regression slope to determine trend:
        - Positive slope > threshold -> 'rising'
        - Negative slope < -threshold -> 'falling'
        - Otherwise -> 'stable'
        
        Note: Days in our data are "days ago", so we reverse for chronological order.
        Day 7 = oldest, Day 1 = most recent.
        
        Args:
            days: List of days (in "days ago" format)
            counts: Mention counts per day
            
        Returns:
            Trend string: 'rising', 'stable', or 'falling'
        """
        if len(days) < 2:
            return "stable"
        
        # Convert "days ago" to chronological order for trend analysis
        # Higher day number = older, so we need to flip the axis
        chronological_days = [max(days) - d + 1 for d in days]
        
        # Simple linear regression: slope = covariance(x,y) / variance(x)
        x = np.array(chronological_days)
        y = np.array(counts)
        
        x_mean = np.mean(x)
        y_mean = np.mean(y)
        
        # Covariance and variance
        covariance = np.sum((x - x_mean) * (y - y_mean))
        variance = np.sum((x - x_mean) ** 2)
        
        if variance == 0:
            return "stable"
        
        slope = covariance / variance
        
        # Threshold for trend detection (tuned for small datasets)
        TREND_THRESHOLD = 0.15
        
        if slope > TREND_THRESHOLD:
            return "rising"
        elif slope < -TREND_THRESHOLD:
            return "falling"
        else:
            return "stable"
    
    def compute_coherence_evolution(
        self, 
        embeddings: np.ndarray, 
        labels: np.ndarray, 
        timestamps: List[int]
    ) -> Dict[int, Dict]:
        """
        Track how cluster coherence changes over time windows.
        
        This helps identify narratives that are:
        - Consolidating (coherence rising over time)
        - Fragmenting (coherence falling over time)
        
        Args:
            embeddings: Document embeddings
            labels: Cluster labels
            timestamps: Document timestamps
            
        Returns:
            Dictionary with per-cluster coherence evolution data
        """
        evolution_data = {}
        unique_labels = set(labels)
        timestamps = np.array(timestamps)
        
        for label in unique_labels:
            if label == -1:
                continue
            
            cluster_mask = labels == label
            cluster_embeddings = embeddings[cluster_mask]
            cluster_timestamps = timestamps[cluster_mask]
            
            # Split into early and late windows
            median_time = np.median(cluster_timestamps)
            early_mask = cluster_timestamps >= median_time  # Higher = older (days ago)
            late_mask = cluster_timestamps < median_time
            
            early_coherence = self._compute_subset_coherence(cluster_embeddings[early_mask])
            late_coherence = self._compute_subset_coherence(cluster_embeddings[late_mask])
            
            # Determine if coherence is improving
            coherence_delta = late_coherence - early_coherence
            
            evolution_data[label] = {
                "early_coherence": early_coherence,
                "late_coherence": late_coherence,
                "coherence_delta": coherence_delta,
                "is_consolidating": coherence_delta > 0.05
            }
        
        return evolution_data
    
    def _compute_subset_coherence(self, embeddings: np.ndarray) -> float:
        """Helper to compute coherence for a subset of embeddings."""
        if len(embeddings) < 2:
            return 0.5
        
        similarities = cosine_similarity(embeddings)
        n = len(embeddings)
        upper_tri = similarities[np.triu_indices(n, k=1)]
        
        return float(np.mean(upper_tri)) if len(upper_tri) > 0 else 0.5
    
    def get_cluster_info(
        self, 
        embeddings: np.ndarray, 
        labels: np.ndarray, 
        texts: List[str],
        timestamps: List[int]
    ) -> Tuple[List[Dict], List[str]]:
        """
        Get comprehensive information about each cluster.
        
        ENHANCED: Now includes temporal metrics for lifecycle detection:
        - mention_frequency: Distribution of mentions over time
        - trend: Rising/stable/falling detection
        - coherence_evolution: How coherence changes over time
        
        Args:
            embeddings: Document embeddings
            labels: Cluster labels
            texts: Original text documents
            timestamps: Document timestamps
            
        Returns:
            Tuple of (cluster_info_list, noise_texts)
        """
        # Compute all metrics
        coherence_scores = self.compute_coherence(embeddings, labels)
        persistence_scores = self.compute_persistence(labels, timestamps)
        frequency_data = self.compute_mention_frequency(labels, timestamps)
        evolution_data = self.compute_coherence_evolution(embeddings, labels, timestamps)
        
        clusters = []
        unique_labels = set(labels)
        
        for label in unique_labels:
            if label == -1:
                continue
            
            cluster_mask = labels == label
            cluster_texts = [t for t, m in zip(texts, cluster_mask) if m]
            cluster_timestamps = [ts for ts, m in zip(timestamps, cluster_mask) if m]
            
            # Build comprehensive cluster info
            cluster_info = {
                "cluster_id": label,
                "texts": cluster_texts,
                "timestamps": cluster_timestamps,
                "coherence": coherence_scores.get(label, 0.5),
                "persistence": persistence_scores.get(label, 0.5),
                "size": len(cluster_texts),
                # NEW: Temporal analysis data
                "frequency": frequency_data.get(label, {}),
                "evolution": evolution_data.get(label, {})
            }
            
            clusters.append(cluster_info)
        
        # Extract noise items (label = -1)
        noise_mask = labels == -1
        noise_texts = [t for t, m in zip(texts, noise_mask) if m]
        
        return clusters, noise_texts


# Singleton instance
_clustering_service = None


def get_clustering_service() -> ClusteringService:
    """Get or create the clustering service singleton."""
    global _clustering_service
    if _clustering_service is None:
        _clustering_service = ClusteringService()
    return _clustering_service
