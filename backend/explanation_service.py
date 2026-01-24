"""
Narrative Explanation Service
==============================

This module provides an interpretability layer for the narrative detection system.
It explains and justifies backend decisions - it does NOT generate new intelligence.

CORE PRINCIPLE:
    The backend narrative engine is the source of truth.
    This service only explains, compares, and justifies existing outputs.

ALLOWED QUESTION TYPES:
    1. narrative_explanation - Why is X marked as Y stage?
    2. comparison - Why is X stronger/weaker than Y?
    3. noise_justification - Why was X discarded as noise?
    4. lifecycle_reasoning - What would make X move to Y stage?
    5. unsupported - Anything outside scope

FORBIDDEN:
    - Price predictions
    - Investment advice
    - Generating new narratives
    - Questions outside silver market scope
"""

import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ExplanationResult:
    """Structured explanation result."""
    question_type: str
    explanation: str
    confidence: float  # How confident we are in the classification
    data_points: Dict  # Supporting data from backend
    is_supported: bool


class QuestionClassifier:
    """
    Rule-based question classifier.
    
    Uses keyword matching and pattern recognition to classify questions
    into supported categories. This is deterministic and explainable.
    """
    
    # Keywords for each question type
    PATTERNS = {
        "narrative_explanation": {
            "keywords": ["why is", "explain", "how come", "what makes", "tell me about", "describe"],
            "context": ["stage", "growth", "early", "acceleration", "decay", "confidence", "coherence", "persistence", "marked as", "classified"],
            "weight": 1.0
        },
        "comparison": {
            "keywords": ["compare", "versus", "vs", "stronger", "weaker", "better", "worse", "difference", "between"],
            "context": ["than", "and", "compared to"],
            "weight": 1.2  # Slightly higher weight for explicit comparison terms
        },
        "noise_justification": {
            "keywords": ["noise", "discarded", "rejected", "filtered", "why not", "invalid"],
            "context": ["noise", "discard", "reject", "filter", "not a narrative"],
            "weight": 1.0
        },
        "lifecycle_reasoning": {
            "keywords": ["what would", "how could", "what if", "conditions for", "move to", "become", "transition"],
            "context": ["acceleration", "growth", "decay", "early", "stage", "next"],
            "weight": 1.0
        }
    }
    
    # Forbidden topics - immediate rejection
    FORBIDDEN_PATTERNS = [
        r"price.*(predict|forecast|will|going to)",
        r"(should i|do you recommend|invest|buy|sell)",
        r"(bitcoin|crypto|stock|forex)",
        r"(weather|sports|politics|news)",
        r"(who are you|what can you do|help me with)",
    ]
    
    def classify(self, question: str) -> Tuple[str, float]:
        """
        Classify a question into one of the supported types.
        
        Args:
            question: User's question text
            
        Returns:
            Tuple of (question_type, confidence_score)
        """
        question_lower = question.lower().strip()
        
        # Check for forbidden patterns first
        for pattern in self.FORBIDDEN_PATTERNS:
            if re.search(pattern, question_lower):
                return "unsupported", 1.0
        
        # Score each question type
        scores = {}
        for qtype, config in self.PATTERNS.items():
            score = 0.0
            
            # Check keywords
            for keyword in config["keywords"]:
                if keyword in question_lower:
                    score += 1.0 * config["weight"]
            
            # Check context words
            for context in config["context"]:
                if context in question_lower:
                    score += 0.5 * config["weight"]
            
            scores[qtype] = score
        
        # Get best match
        if not scores or max(scores.values()) == 0:
            return "unsupported", 0.5
        
        best_type = max(scores, key=scores.get)
        best_score = scores[best_type]
        
        # Normalize confidence (cap at 1.0)
        confidence = min(best_score / 3.0, 1.0)
        
        # Require minimum confidence
        if confidence < 0.3:
            return "unsupported", confidence
        
        return best_type, confidence


class ExplanationGenerator:
    """
    Generates structured explanations based on backend data.
    
    This is a rule-based explanation generator. It constructs explanations
    from the actual data produced by the narrative detection pipeline.
    """
    
    # Stage descriptions for lifecycle reasoning
    STAGE_REQUIREMENTS = {
        "Early": {
            "description": "Narrative is just emerging with limited temporal spread",
            "conditions": ["Persistence < 0.35", "Limited time window coverage"]
        },
        "Growth": {
            "description": "Narrative is building momentum with stable or rising mentions",
            "conditions": ["Persistence 0.35-0.70", "Stable or rising trend", "Moderate coherence"]
        },
        "Acceleration": {
            "description": "Mature narrative with strong presence and consolidating coherence",
            "conditions": ["Persistence > 0.70 OR", "Rising trend + consolidating coherence", "High confidence"]
        },
        "Decay": {
            "description": "Narrative is fading with falling mention frequency",
            "conditions": ["Falling mention trend", "Decreasing coherence over time"]
        }
    }
    
    def __init__(self, narratives: List[Dict], noise: List[Dict]):
        """
        Initialize with current backend data.
        
        Args:
            narratives: List of detected narratives from /api/narratives
            noise: List of discarded noise clusters
        """
        self.narratives = {n["name"]: n for n in narratives}
        self.narratives_by_id = {n["id"]: n for n in narratives}
        self.all_narratives = narratives
        self.noise = noise
    
    def find_narrative(self, query: str) -> Optional[Dict]:
        """Find a narrative by name or partial match."""
        query_lower = query.lower()
        
        # Exact match
        for name, narrative in self.narratives.items():
            if name.lower() == query_lower:
                return narrative
        
        # Partial match
        for name, narrative in self.narratives.items():
            if query_lower in name.lower() or name.lower() in query_lower:
                return narrative
        
        # Keyword match
        keywords = query_lower.split()
        for name, narrative in self.narratives.items():
            name_lower = name.lower()
            if any(kw in name_lower for kw in keywords if len(kw) > 3):
                return narrative
        
        return None
    
    def explain_narrative(self, question: str) -> ExplanationResult:
        """Generate explanation for a specific narrative's classification."""
        narrative = self.find_narrative(question)
        
        if not narrative:
            # Try to explain using the first narrative as example
            if self.all_narratives:
                narrative = self.all_narratives[0]
                preamble = f"I'll explain using '{narrative['name']}' as an example. "
            else:
                return ExplanationResult(
                    question_type="narrative_explanation",
                    explanation="No narratives are currently detected in the system.",
                    confidence=1.0,
                    data_points={},
                    is_supported=True
                )
        else:
            preamble = ""
        
        # Build structured explanation
        stage = narrative["stage"]
        stage_info = self.STAGE_REQUIREMENTS.get(stage, {})
        
        explanation_parts = [
            preamble,
            f"**{narrative['name']}** is classified as **{stage}** stage.\n\n",
            f"**Key Metrics:**\n",
            f"- Confidence: {narrative['confidence']*100:.0f}%\n",
            f"- Coherence: {narrative['coherence']*100:.0f}% (semantic similarity within cluster)\n",
            f"- Persistence: {narrative['persistence']*100:.0f}% (temporal spread)\n\n",
            f"**Stage Reasoning:**\n",
            f"{stage_info.get('description', 'Stage criteria met.')}\n\n",
            f"**Timeline Presence:** Days {narrative['timeline']}\n",
            f"**Sentiment:** {narrative['sentiment']}"
        ]
        
        return ExplanationResult(
            question_type="narrative_explanation",
            explanation="".join(explanation_parts),
            confidence=0.9,
            data_points={
                "narrative": narrative["name"],
                "stage": stage,
                "confidence": narrative["confidence"],
                "coherence": narrative["coherence"],
                "persistence": narrative["persistence"]
            },
            is_supported=True
        )
    
    def explain_comparison(self, question: str) -> ExplanationResult:
        """Compare two narratives."""
        # Find mentioned narratives
        found_narratives = []
        for name, narrative in self.narratives.items():
            if any(word.lower() in question.lower() for word in name.split()):
                found_narratives.append(narrative)
        
        if len(found_narratives) < 2:
            # Compare top 2 by confidence
            sorted_narratives = sorted(self.all_narratives, key=lambda x: x["confidence"], reverse=True)
            if len(sorted_narratives) >= 2:
                found_narratives = sorted_narratives[:2]
            else:
                return ExplanationResult(
                    question_type="comparison",
                    explanation="Need at least two narratives to compare.",
                    confidence=0.7,
                    data_points={},
                    is_supported=True
                )
        
        n1, n2 = found_narratives[0], found_narratives[1]
        
        # Determine stronger narrative
        if n1["confidence"] > n2["confidence"]:
            stronger, weaker = n1, n2
        else:
            stronger, weaker = n2, n1
        
        explanation_parts = [
            f"**Comparing {n1['name']} vs {n2['name']}**\n\n",
            f"| Metric | {n1['name'][:20]} | {n2['name'][:20]} |\n",
            f"|--------|----------|----------|\n",
            f"| Confidence | {n1['confidence']*100:.0f}% | {n2['confidence']*100:.0f}% |\n",
            f"| Coherence | {n1['coherence']*100:.0f}% | {n2['coherence']*100:.0f}% |\n",
            f"| Persistence | {n1['persistence']*100:.0f}% | {n2['persistence']*100:.0f}% |\n",
            f"| Stage | {n1['stage']} | {n2['stage']} |\n\n",
            f"**{stronger['name']}** is stronger because:\n",
            f"- Higher confidence ({stronger['confidence']*100:.0f}% vs {weaker['confidence']*100:.0f}%)\n",
            f"- {'Wider' if stronger['persistence'] > weaker['persistence'] else 'Comparable'} temporal spread\n",
            f"- Timeline covers {len(stronger['timeline'])} days vs {len(weaker['timeline'])} days"
        ]
        
        return ExplanationResult(
            question_type="comparison",
            explanation="".join(explanation_parts),
            confidence=0.85,
            data_points={
                "narrative1": n1["name"],
                "narrative2": n2["name"],
                "stronger": stronger["name"]
            },
            is_supported=True
        )
    
    def explain_noise(self, question: str) -> ExplanationResult:
        """Explain why something was classified as noise."""
        if not self.noise:
            return ExplanationResult(
                question_type="noise_justification",
                explanation="No items were discarded as noise in the current analysis.",
                confidence=1.0,
                data_points={},
                is_supported=True
            )
        
        # Get noise examples
        noise_examples = []
        for noise_item in self.noise:
            noise_examples.extend(noise_item.get("texts", [])[:2])
        
        explanation_parts = [
            "**Noise Classification Criteria**\n\n",
            "Items are discarded as noise when they fail to meet narrative thresholds:\n\n",
            "1. **Low Coherence** (< 30%): Texts are not semantically related\n",
            "2. **Low Persistence** (< 20%): Appears in too few time periods\n",
            "3. **Insufficient Size**: Fewer than 2 documents\n",
            "4. **HDBSCAN Outlier**: Statistical outlier, doesn't fit any cluster\n\n",
            f"**{len(self.noise)} noise cluster(s)** were discarded.\n\n",
            "**Sample discarded texts:**\n"
        ]
        
        for i, text in enumerate(noise_examples[:3], 1):
            explanation_parts.append(f"{i}. \"{text[:80]}...\"\n")
        
        explanation_parts.append("\nThese texts didn't form a coherent, persistent narrative pattern.")
        
        return ExplanationResult(
            question_type="noise_justification",
            explanation="".join(explanation_parts),
            confidence=0.9,
            data_points={"noise_count": len(self.noise)},
            is_supported=True
        )
    
    def explain_lifecycle(self, question: str) -> ExplanationResult:
        """Explain conditions for lifecycle stage transitions."""
        narrative = self.find_narrative(question)
        
        if not narrative:
            narrative = self.all_narratives[0] if self.all_narratives else None
        
        if not narrative:
            return ExplanationResult(
                question_type="lifecycle_reasoning",
                explanation="No narratives available to explain lifecycle transitions.",
                confidence=1.0,
                data_points={},
                is_supported=True
            )
        
        current_stage = narrative["stage"]
        
        # Determine next logical stage
        stage_order = ["Early", "Growth", "Acceleration"]
        current_idx = stage_order.index(current_stage) if current_stage in stage_order else 1
        
        explanation_parts = [
            f"**Lifecycle Analysis for {narrative['name']}**\n\n",
            f"Current Stage: **{current_stage}**\n",
            f"Current Persistence: {narrative['persistence']*100:.0f}%\n",
            f"Current Coherence: {narrative['coherence']*100:.0f}%\n\n",
        ]
        
        if current_stage == "Early":
            explanation_parts.extend([
                "**To move to Growth:**\n",
                "- Persistence must increase to > 35%\n",
                "- Narrative must appear in more time periods\n",
                "- Requires sustained mention frequency\n"
            ])
        elif current_stage == "Growth":
            explanation_parts.extend([
                "**To move to Acceleration:**\n",
                "- Persistence must exceed 70%, OR\n",
                "- Show rising mention trend + consolidating coherence\n",
                "- Coherence should strengthen over time\n"
            ])
        elif current_stage == "Acceleration":
            explanation_parts.extend([
                "**This narrative is at Acceleration (mature stage).**\n",
                "- It has high persistence and strong signals\n",
                "- Could transition to Decay if mentions fall\n"
            ])
        
        explanation_parts.extend([
            "\n**Note:** This is conditional reasoning based on system thresholds. ",
            "It does not predict what *will* happen, only what *would* trigger a stage change."
        ])
        
        return ExplanationResult(
            question_type="lifecycle_reasoning",
            explanation="".join(explanation_parts),
            confidence=0.85,
            data_points={
                "narrative": narrative["name"],
                "current_stage": current_stage
            },
            is_supported=True
        )
    
    def generate_unsupported_response(self, question: str) -> ExplanationResult:
        """Generate a polite refusal for unsupported questions."""
        return ExplanationResult(
            question_type="unsupported",
            explanation=(
                "**I can only explain the narrative detection system's decisions.**\n\n"
                "I can help you understand:\n"
                "- Why a narrative is classified at a particular stage\n"
                "- How two narratives compare\n"
                "- Why something was discarded as noise\n"
                "- What conditions would change a narrative's stage\n\n"
                "I cannot:\n"
                "- Predict prices or market movements\n"
                "- Provide investment advice\n"
                "- Answer questions outside silver market narratives\n"
                "- Generate new narratives or intelligence\n\n"
                "Please rephrase your question about the detected narratives."
            ),
            confidence=1.0,
            data_points={},
            is_supported=False
        )


class ExplanationService:
    """
    Main service for handling explanation requests.
    
    Coordinates question classification and explanation generation.
    """
    
    def __init__(self):
        self.classifier = QuestionClassifier()
    
    def explain(
        self, 
        question: str, 
        narratives: List[Dict], 
        noise: List[Dict]
    ) -> ExplanationResult:
        """
        Process a question and generate an explanation.
        
        Args:
            question: User's question
            narratives: Current narrative data from backend
            noise: Current noise data from backend
            
        Returns:
            ExplanationResult with structured response
        """
        # Classify the question
        question_type, confidence = self.classifier.classify(question)
        
        # Create generator with current data
        generator = ExplanationGenerator(narratives, noise)
        
        # Route to appropriate handler
        if question_type == "narrative_explanation":
            return generator.explain_narrative(question)
        elif question_type == "comparison":
            return generator.explain_comparison(question)
        elif question_type == "noise_justification":
            return generator.explain_noise(question)
        elif question_type == "lifecycle_reasoning":
            return generator.explain_lifecycle(question)
        else:
            return generator.generate_unsupported_response(question)


# Convenience function
def classify_question(question: str) -> str:
    """
    Classify a question into supported categories.
    
    Returns one of:
    - narrative_explanation
    - comparison
    - noise_justification
    - lifecycle_reasoning
    - unsupported
    """
    classifier = QuestionClassifier()
    question_type, _ = classifier.classify(question)
    return question_type


# Singleton
_explanation_service = None


def get_explanation_service() -> ExplanationService:
    """Get or create the explanation service singleton."""
    global _explanation_service
    if _explanation_service is None:
        _explanation_service = ExplanationService()
    return _explanation_service
