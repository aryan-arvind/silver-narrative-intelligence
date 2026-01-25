"""
Multi-Narrative Generator Service.
Generates 25 concurrent silver market narratives with deterministic scoring.
"""

from typing import List, Dict
from datetime import date, timedelta


# 25 Seed narrative themes for silver markets
NARRATIVE_SEEDS = [
    {"key": "industrial_demand", "name": "Industrial Demand", "base_strength": 72, "sentiment": "Bullish", "momentum": "+"},
    {"key": "solar_panel", "name": "Solar Panel Demand", "base_strength": 68, "sentiment": "Bullish", "momentum": "+"},
    {"key": "ev_batteries", "name": "EV Batteries", "base_strength": 65, "sentiment": "Bullish", "momentum": "+"},
    {"key": "green_energy", "name": "Green Energy Transition", "base_strength": 63, "sentiment": "Bullish", "momentum": "+"},
    {"key": "china_imports", "name": "China Imports", "base_strength": 58, "sentiment": "Bullish", "momentum": "+"},
    {"key": "mining_supply", "name": "Mining Supply", "base_strength": 55, "sentiment": "Bearish", "momentum": "-"},
    {"key": "recycling_supply", "name": "Recycling Supply", "base_strength": 48, "sentiment": "Neutral", "momentum": "+"},
    {"key": "inflation_hedge", "name": "Inflation Hedge", "base_strength": 52, "sentiment": "Bullish", "momentum": "+"},
    {"key": "interest_rates", "name": "Interest Rates", "base_strength": 45, "sentiment": "Bearish", "momentum": "-"},
    {"key": "usd_strength", "name": "USD Strength", "base_strength": 42, "sentiment": "Bearish", "momentum": "-"},
    {"key": "geopolitical_risk", "name": "Geopolitical Risk", "base_strength": 56, "sentiment": "Bullish", "momentum": "+"},
    {"key": "manufacturing_pmi", "name": "Manufacturing PMI", "base_strength": 38, "sentiment": "Neutral", "momentum": "-"},
    {"key": "electronics_demand", "name": "Electronics Demand", "base_strength": 50, "sentiment": "Bullish", "momentum": "+"},
    {"key": "medical_devices", "name": "Medical Devices", "base_strength": 35, "sentiment": "Bullish", "momentum": "+"},
    {"key": "silver_etfs", "name": "Silver ETFs", "base_strength": 44, "sentiment": "Neutral", "momentum": "+"},
    {"key": "futures_speculation", "name": "Futures Speculation", "base_strength": 40, "sentiment": "Neutral", "momentum": "-"},
    {"key": "retail_investment", "name": "Retail Investment", "base_strength": 32, "sentiment": "Bullish", "momentum": "+"},
    {"key": "central_bank_policy", "name": "Central Bank Policy", "base_strength": 47, "sentiment": "Bearish", "momentum": "-"},
    {"key": "commodity_rotation", "name": "Commodity Rotation", "base_strength": 28, "sentiment": "Neutral", "momentum": "+"},
    {"key": "safe_haven", "name": "Safe Haven Demand", "base_strength": 54, "sentiment": "Bullish", "momentum": "+"},
    {"key": "tech_hardware", "name": "Tech Hardware", "base_strength": 22, "sentiment": "Bullish", "momentum": "+"},
    {"key": "ai_hardware", "name": "AI Hardware Demand", "base_strength": 61, "sentiment": "Bullish", "momentum": "+"},
    {"key": "energy_storage", "name": "Energy Storage", "base_strength": 18, "sentiment": "Bullish", "momentum": "+"},
    {"key": "grid_expansion", "name": "Grid Expansion", "base_strength": 14, "sentiment": "Neutral", "momentum": "+"},
    {"key": "global_trade", "name": "Global Trade", "base_strength": 12, "sentiment": "Bearish", "momentum": "-"},
]

# Narrative descriptions for each theme
NARRATIVE_DESCRIPTIONS = {
    "industrial_demand": "Manufacturing sector recovery driving unprecedented silver consumption in industrial applications. Factory orders for silver-intensive components surge across Asia and Europe.",
    "solar_panel": "Global solar panel installations accelerating faster than projected. Silver paste demand for photovoltaic cells reaching record levels as renewable targets tighten.",
    "ev_batteries": "Electric vehicle production ramp-up creating sustained demand for silver in battery components and electrical contacts.",
    "green_energy": "Government green energy mandates worldwide spurring investment in silver-intensive clean technologies.",
    "china_imports": "China silver imports surging as domestic industrial demand outpaces local production. Shanghai premiums widening.",
    "mining_supply": "Major silver mining operations reporting production challenges. Grade decline at key mines compressing global supply.",
    "recycling_supply": "Silver recycling rates improving as technology advances make recovery more economical.",
    "inflation_hedge": "Persistent inflation driving investor allocation to precious metals as hedge against currency debasement.",
    "interest_rates": "Central bank rate decisions impacting silver's appeal relative to yield-bearing assets.",
    "usd_strength": "Dollar strength creating headwinds for silver priced in USD. FX correlation remains elevated.",
    "geopolitical_risk": "Escalating geopolitical tensions driving safe-haven flows into precious metals including silver.",
    "manufacturing_pmi": "Mixed manufacturing PMI signals creating uncertainty around near-term industrial silver demand.",
    "electronics_demand": "Consumer electronics demand stabilizing with silver content per device remaining steady.",
    "medical_devices": "Medical device sector expanding use of silver for antimicrobial properties in healthcare applications.",
    "silver_etfs": "Silver ETF holdings showing steady accumulation as institutional investors maintain exposure.",
    "futures_speculation": "COMEX silver futures positioning reflecting mixed speculative sentiment. Net longs fluctuating.",
    "retail_investment": "Retail silver coin and bar demand moderating after previous surge in physical buying.",
    "central_bank_policy": "Central bank policy uncertainty creating volatility in precious metals complex.",
    "commodity_rotation": "Portfolio managers rotating between commodities. Silver positioning relative to gold shifting.",
    "safe_haven": "Market stress indicators elevating safe-haven appeal of precious metals.",
    "tech_hardware": "Data center and technology hardware expansion requiring silver-based thermal and electrical components.",
    "ai_hardware": "AI infrastructure build-out driving demand for high-performance silver applications in computing hardware.",
    "energy_storage": "Grid-scale energy storage systems incorporating silver-based components for efficiency.",
    "grid_expansion": "Electrical grid modernization creating incremental demand for silver in transmission equipment.",
    "global_trade": "Trade policy developments impacting silver supply chain and cross-border flows.",
}


class MultiNarrativeGenerator:
    """Generates and scores 25 concurrent silver market narratives."""
    
    def __init__(self):
        self.narratives = []
        
    def _determine_lifecycle_stage(self, strength: int, momentum: str) -> str:
        """Determine lifecycle stage based on strength and momentum."""
        if strength >= 60:
            return "Peak" if momentum == "-" else "Expanding"
        elif strength >= 35:
            return "Expanding" if momentum == "+" else "Fading"
        elif strength >= 20:
            return "Emerging" if momentum == "+" else "Fading"
        else:
            return "Emerging"
    
    def _compute_coherence(self, strength: int) -> float:
        """Compute coherence score based on strength."""
        # Higher strength narratives tend to have higher coherence
        base = 0.5 + (strength / 200)
        return round(min(base, 0.95), 2)
    
    def _compute_persistence(self, strength: int, momentum: str) -> float:
        """Compute persistence score."""
        base = 0.4 + (strength / 250)
        if momentum == "+":
            base += 0.1
        return round(min(base, 0.92), 2)
    
    def _generate_timeline(self, strength: int) -> List[str]:
        """Generate timeline based on narrative strength."""
        today = date.today()
        num_days = max(3, min(14, strength // 8))
        
        timeline = []
        for i in range(num_days):
            d = today - timedelta(days=i)
            timeline.append(d.strftime("%Y-%m-%d"))
        
        return sorted(timeline)
    
    def _get_sources(self, key: str) -> List[str]:
        """Get data sources for a narrative."""
        source_map = {
            "industrial_demand": ["Reuters", "Bloomberg", "Industry Reports"],
            "solar_panel": ["BloombergNEF", "Solar Industry News", "Reuters"],
            "ev_batteries": ["Reuters", "EV News", "Battery Tech"],
            "green_energy": ["IEA", "Government Sources", "Reuters"],
            "china_imports": ["Customs Data", "Shanghai Metals", "Bloomberg"],
            "mining_supply": ["Mining Weekly", "Company Reports", "Reuters"],
            "recycling_supply": ["Industry Reports", "Recycling Today"],
            "inflation_hedge": ["FRED Data", "Financial Times", "Reuters"],
            "interest_rates": ["Federal Reserve", "ECB", "Bloomberg"],
            "usd_strength": ["DXY Data", "Forex Markets", "Bloomberg"],
            "geopolitical_risk": ["Reuters", "AP News", "Geopolitical Monitor"],
            "manufacturing_pmi": ["ISM", "PMI Data", "Reuters"],
            "electronics_demand": ["Consumer Tech", "Industry Reports"],
            "medical_devices": ["Medical Device News", "Industry Reports"],
            "silver_etfs": ["ETF Holdings", "Bloomberg", "Reuters"],
            "futures_speculation": ["CFTC COT", "CME Data"],
            "retail_investment": ["Dealer Reports", "Reddit", "Silver News"],
            "central_bank_policy": ["Fed Minutes", "ECB", "BOJ"],
            "commodity_rotation": ["Commodity Indices", "Bloomberg"],
            "safe_haven": ["VIX Data", "Gold/Silver Ratio", "Reuters"],
            "tech_hardware": ["Tech Industry", "Supply Chain Data"],
            "ai_hardware": ["AI News", "Nvidia Reports", "Tech Industry"],
            "energy_storage": ["Energy Storage News", "Industry Reports"],
            "grid_expansion": ["Utility Reports", "Government Data"],
            "global_trade": ["Trade Data", "WTO", "Reuters"],
        }
        return source_map.get(key, ["Market Data", "News"])
    
    def generate_narratives(self) -> List[Dict]:
        """Generate all 25 narratives with deterministic scoring."""
        narratives = []
        
        for idx, seed in enumerate(NARRATIVE_SEEDS):
            strength = seed["base_strength"]
            stage = self._determine_lifecycle_stage(strength, seed["momentum"])
            coherence = self._compute_coherence(strength)
            persistence = self._compute_persistence(strength, seed["momentum"])
            
            # Compute confidence from coherence and persistence
            confidence = round((coherence * 0.5 + persistence * 0.5) * (strength / 100), 2)
            confidence = min(confidence, 0.95)
            
            narrative = {
                "id": f"N{idx + 1}",
                "name": seed["name"],
                "strength": strength,
                "stage": stage,
                "confidence": confidence,
                "sentiment": seed["sentiment"],
                "momentum": seed["momentum"],
                "coherence": coherence,
                "persistence": persistence,
                "description": NARRATIVE_DESCRIPTIONS.get(seed["key"], f"Silver market narrative: {seed['name']}"),
                "sources": self._get_sources(seed["key"]),
                "timeline": self._generate_timeline(strength)
            }
            narratives.append(narrative)
        
        # Sort by strength descending
        narratives.sort(key=lambda x: x["strength"], reverse=True)
        
        # Re-assign IDs based on sorted order
        for idx, n in enumerate(narratives):
            n["id"] = f"N{idx + 1}"
        
        return narratives
    
    def get_narrative_stats(self, narratives: List[Dict]) -> Dict:
        """Compute narrative statistics."""
        active_count = sum(1 for n in narratives if n["strength"] > 15)
        dominant_count = sum(1 for n in narratives if n["strength"] > 60)
        weak_count = sum(1 for n in narratives if n["strength"] <= 15)
        mid_range_count = sum(1 for n in narratives if 20 < n["strength"] <= 60)
        
        return {
            "total_narratives": len(narratives),
            "active_narratives": active_count,
            "dominant_narratives": dominant_count,
            "weak_narratives": weak_count,
            "mid_range_narratives": mid_range_count
        }


# Singleton
_generator = None


def get_multi_narrative_generator() -> MultiNarrativeGenerator:
    """Get or create the multi-narrative generator singleton."""
    global _generator
    if _generator is None:
        _generator = MultiNarrativeGenerator()
    return _generator
