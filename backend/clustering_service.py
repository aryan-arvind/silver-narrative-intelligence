"""
Autonomous clustering service using HDBSCAN for narrative detection.
No predefined cluster count - algorithm discovers clusters automatically.
"""

import hdbscan
import numpy as np
from typing import List, Dict, Tuple
from sklearn.metrics.pairwise import cosine_similarity


class ClusteringService:
    """Service for autonomous clustering of text embeddings."""
    
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
        
        Args:
            embeddings: Document embeddings array
            
        Returns:
            Cluster labels (-1 indicates noise)
        """
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=self.min_cluster_size,
            min_samples=self.min_samples,
            metric='euclidean',
            cluster_selection_method='eom'
        )
        labels = clusterer.fit_predict(embeddings)
        return labels
    
    def compute_coherence(self, embeddings: np.ndarray, labels: np.ndarray) -> Dict[int, float]:
        """
        Compute coherence score for each cluster.
        Coherence = average pairwise cosine similarity within cluster.
        
        Args:
            embeddings: Document embeddings
            labels: Cluster labels
            
        Returns:
            Dictionary mapping cluster_id -> coherence_score
        """
        coherence_scores = {}
        unique_labels = set(labels)
        
        for label in unique_labels:
            if label == -1:  # Skip noise
                continue
            
            cluster_mask = labels == label
            cluster_embeddings = embeddings[cluster_mask]
            
            if len(cluster_embeddings) < 2:
                coherence_scores[label] = 0.5  # Single item, moderate coherence
                continue
            
            # Compute pairwise similarities
            similarities = cosine_similarity(cluster_embeddings)
            # Get upper triangle (excluding diagonal)
            n = len(cluster_embeddings)
            upper_tri = similarities[np.triu_indices(n, k=1)]
            
            if len(upper_tri) > 0:
                coherence_scores[label] = float(np.mean(upper_tri))
            else:
                coherence_scores[label] = 0.5
        
        return coherence_scores
    
    def compute_persistence(self, labels: np.ndarray, timestamps: List[int]) -> Dict[int, float]:
        """
        Compute persistence score for each cluster.
        Persistence = how many different time periods the narrative spans.
        
        Args:
            labels: Cluster labels
            timestamps: Timestamp for each document (days ago)
            
        Returns:
            Dictionary mapping cluster_id -> persistence_score (0-1)
        """
        persistence_scores = {}
        unique_labels = set(labels)
        timestamps = np.array(timestamps)
        
        # Get max time range
        max_range = max(timestamps) - min(timestamps) + 1 if len(timestamps) > 0 else 1
        
        for label in unique_labels:
            if label == -1:
                continue
            
            cluster_mask = labels == label
            cluster_timestamps = timestamps[cluster_mask]
            
            # Number of unique time periods in cluster
            unique_periods = len(set(cluster_timestamps))
            
            # Normalize by max possible range
            persistence_scores[label] = min(1.0, unique_periods / max(max_range, 1))
        
        return persistence_scores
    
    def get_cluster_info(
        self, 
        embeddings: np.ndarray, 
        labels: np.ndarray, 
        texts: List[str],
        timestamps: List[int],
        sources: List[str],
        dates: List[str]
    ) -> List[Dict]:
        """
        Get detailed information about each cluster.
        
        Returns list of cluster info dictionaries.
        """
        coherence_scores = self.compute_coherence(embeddings, labels)
        persistence_scores = self.compute_persistence(labels, timestamps)
        
        clusters = []
        unique_labels = set(labels)
        
        for label in unique_labels:
            if label == -1:
                continue
            
            cluster_mask = labels == label
            cluster_texts = [t for t, m in zip(texts, cluster_mask) if m]
            cluster_timestamps = [ts for ts, m in zip(timestamps, cluster_mask) if m]
            cluster_sources = [s for s, m in zip(sources, cluster_mask) if m]
            cluster_dates = [d for d, m in zip(dates, cluster_mask) if m]
            
            # Get unique sources
            unique_sources = sorted(list(set(cluster_sources)))
            
            # Get unique dates
            unique_dates = sorted(list(set(cluster_dates)))
            
            clusters.append({
                "cluster_id": label,
                "texts": cluster_texts,
                "timestamps": cluster_timestamps,
                "sources": unique_sources,
                "dates": unique_dates,
                "coherence": coherence_scores.get(label, 0.5),
                "persistence": persistence_scores.get(label, 0.5),
                "size": len(cluster_texts)
            })
        
        # Get noise items
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
