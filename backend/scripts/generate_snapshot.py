#!/usr/bin/env python3
"""
Snapshot Generation Script

Processes raw text data through the narrative intelligence pipeline
and generates a processed snapshot for deterministic demo evaluation.

This script:
1. Loads raw_text_snapshot.json
2. Passes text through embedding, clustering, and scoring
3. Outputs processed_narratives_snapshot.json

Usage:
    python generate_snapshot.py
"""

import json
import sys
import os
from datetime import datetime, timezone

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from embedding_service import get_embedding_service
from clustering_service import get_clustering_service
from narrative_analyzer import get_narrative_analyzer


def load_raw_data(filepath: str) -> list:
    """Load raw text snapshot from JSON file."""
    with open(filepath, 'r') as f:
        return json.load(f)


def convert_timestamp_to_days_ago(timestamp_str: str) -> int:
    """Convert ISO-8601 timestamp to 'days ago' integer."""
    # Parse the timestamp
    dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    now = datetime.now(timezone.utc)
    delta = now - dt
    return max(0, delta.days)


def process_raw_data(raw_data: list) -> tuple:
    """
    Process raw text data through the narrative pipeline.
    
    Returns:
        tuple: (texts, timestamps) for pipeline processing
    """
    texts = []
    timestamps = []
    
    for entry in raw_data:
        texts.append(entry['text'])
        days_ago = convert_timestamp_to_days_ago(entry['timestamp'])
        timestamps.append(days_ago)
    
    return texts, timestamps


def run_pipeline(texts: list, timestamps: list) -> tuple:
    """
    Run the full narrative detection pipeline.
    
    Returns:
        tuple: (narratives, noise) from the analyzer
    """
    print("Step 1/4: Loading embedding service...")
    embedding_service = get_embedding_service()
    
    print("Step 2/4: Generating embeddings...")
    embeddings = embedding_service.encode(texts)
    
    print("Step 3/4: Clustering documents...")
    clustering_service = get_clustering_service()
    labels = clustering_service.cluster(embeddings)
    
    # Get cluster information with temporal analysis
    clusters, noise_texts = clustering_service.get_cluster_info(
        embeddings, labels, texts, timestamps
    )
    
    print(f"       Found {len(clusters)} clusters, {len(noise_texts)} outliers")
    
    print("Step 4/4: Analyzing narratives...")
    analyzer = get_narrative_analyzer()
    narratives, noise = analyzer.analyze_clusters(clusters)
    
    return narratives, noise


def serialize_narrative(narrative: dict) -> dict:
    """
    Serialize a narrative dict to JSON-safe format.
    Handles numpy types and ensures clean output.
    """
    def clean_value(v):
        """Convert numpy types to Python natives."""
        if hasattr(v, 'item'):  # numpy scalar
            return v.item()
        elif isinstance(v, list):
            return [clean_value(x) for x in v]
        elif isinstance(v, dict):
            return {k: clean_value(val) for k, val in v.items()}
        else:
            return v
    
    return {
        "id": narrative.get("id", "N0"),
        "name": narrative.get("name", "Unknown"),
        "stage": narrative.get("stage", "Early"),
        "sentiment": narrative.get("sentiment", "Neutral"),
        "confidence": round(clean_value(narrative.get("confidence", 0.5)), 2),
        "coherence": round(clean_value(narrative.get("coherence", 0.5)), 2),
        "persistence": round(clean_value(narrative.get("persistence", 0.5)), 2),
        "timeline": [clean_value(d) for d in narrative.get("timeline", [])],
        "sources": narrative.get("sources", []),
        "description": narrative.get("description", "")
    }


def generate_snapshot():
    """Main function to generate processed narrative snapshot."""
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(os.path.dirname(script_dir), 'data')
    raw_path = os.path.join(data_dir, 'raw_text_snapshot.json')
    output_path = os.path.join(data_dir, 'processed_narratives_snapshot.json')
    
    print("=" * 60)
    print("NARRATIVE SNAPSHOT GENERATOR")
    print("=" * 60)
    print()
    
    # Load raw data
    print(f"Loading raw data from: {raw_path}")
    raw_data = load_raw_data(raw_path)
    print(f"Loaded {len(raw_data)} text entries")
    print()
    
    # Process raw data
    texts, timestamps = process_raw_data(raw_data)
    
    # Run pipeline
    print("Running narrative detection pipeline...")
    print("-" * 40)
    narratives, noise = run_pipeline(texts, timestamps)
    print("-" * 40)
    print()
    
    # Serialize output
    processed = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source_file": "raw_text_snapshot.json",
            "total_documents": len(raw_data),
            "narratives_detected": len(narratives),
            "noise_discarded": len(noise)
        },
        "narratives": [serialize_narrative(n) for n in narratives],
        "noise": noise
    }
    
    # Write output
    print(f"Writing processed snapshot to: {output_path}")
    with open(output_path, 'w') as f:
        json.dump(processed, f, indent=2)
    
    # Summary
    print()
    print("=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print()
    print("Detected Narratives:")
    for n in processed["narratives"]:
        print(f"  • {n['name']} ({n['stage']}) - Confidence: {n['confidence']}")
    print()
    print(f"Noise items discarded: {len(noise)}")
    print()
    print(f"Output saved to: {output_path}")


if __name__ == "__main__":
    generate_snapshot()
