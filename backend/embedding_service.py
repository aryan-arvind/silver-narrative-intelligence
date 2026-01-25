"""
Embedding service using SentenceTransformers for text vectorization.
"""

import numpy as np
from typing import List


class EmbeddingService:
    """Service to generate sentence embeddings for narrative detection."""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding model.
        
        Args:
            model_name: HuggingFace model name for sentence embeddings.
                       all-MiniLM-L6-v2 is fast and effective for clustering.
        """
        print(f"Loading embedding model: {model_name}")
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(model_name)
        print("Embedding model loaded successfully")
    
    def encode(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings to encode
            
        Returns:
            numpy array of shape (n_texts, embedding_dim)
        """
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return np.array(embeddings)
    
    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score between 0 and 1
        """
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(embedding1, embedding2) / (norm1 * norm2))


# Singleton instance for reuse
_embedding_service = None


def get_embedding_service() -> EmbeddingService:
    """Get or create the embedding service singleton."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
