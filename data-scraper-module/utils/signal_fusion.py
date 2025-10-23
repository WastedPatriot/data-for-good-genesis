"""
Trend-Weighted Signal Fusion Engine
Combines multiple institutional signals with trend weighting and time-series analysis
"""

from typing import List, Dict, Any
import statistics
from datetime import datetime, timedelta


class SignalFusionEngine:
    """
    Fuses multiple institutional signals into unified risk and opportunity scores
    """
    
    def __init__(self):
        self.weights = {
            "carbon_futures": 0.25,
            "regulatory_violations": 0.20,
            "supply_chain_signals": 0.18,
            "climate_risk": 0.22,
            "esg_litigation": 0.15
        }
    
    def fuse_signals(self, signals: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Fuse all institutional signals into a unified analysis
        
        Args:
            signals: Dict with keys like "carbon_futures", "regulatory_violations", etc.
        
        Returns:
            Fused signal with aggregated metrics
        """
        
        fusion_result = {
            "fusion_timestamp": int(datetime.now().timestamp()),
            "signal_sources": list(signals.keys()),
            "total_signals": sum(len(v) for v in signals.values()),
            "risk_index": 0,
            "volatility_score": 0,
            "momentum_score": 0,
            "forward_pressure_score": 0,
            "sector_breakdown": {},
            "geographic_breakdown": {},
            "trend_indicators": {}
        }
        
        # Calculate risk index
        fusion_result["risk_index"] = self._calculate_risk_index(signals)
        
        # Calculate volatility score
        fusion_result["volatility_score"] = self._calculate_volatility(signals)
        
        # Calculate momentum score
        fusion_result["momentum_score"] = self._calculate_momentum(signals)
        
        # Calculate forward pressure score
        fusion_result["forward_pressure_score"] = self._calculate_forward_pressure(signals)
        
        # Sector clustering
        fusion_result["sector_breakdown"] = self._cluster_by_sector(signals)
        
        # Geographic analysis
        fusion_result["geographic_breakdown"] = self._analyze_geography(signals)
        
        # Trend indicators
        fusion_result["trend_indicators"] = self._detect_trends(signals)
        
        return fusion_result
    
    def _calculate_risk_index(self, signals: Dict[str, List[Dict[str, Any]]]) -> float:
        """
        Calculate overall risk index (0-100)
        Higher = more risk
        """
        risk_components = []
        
        # Regulatory violations contribute to risk
        if "regulatory_violations" in signals:
            violation_count = len(signals["regulatory_violations"])
            high_severity = sum(1 for v in signals["regulatory_violations"] 
                              if v.get("severity") == "High")
            reg_risk = min(100, (violation_count * 5) + (high_severity * 10))
            risk_components.append(reg_risk * self.weights["regulatory_violations"])
        
        # Climate disasters contribute to risk
        if "climate_risk" in signals:
            disaster_count = len(signals["climate_risk"])
            climate_risk = min(100, disaster_count * 8)
            risk_components.append(climate_risk * self.weights["climate_risk"])
        
        # ESG litigation contributes to risk
        if "esg_litigation" in signals:
            litigation_count = len(signals["esg_litigation"])
            active_cases = sum(1 for c in signals["esg_litigation"] 
                             if c.get("status") in ["Active", "Discovery", "Pre-trial"])
            lit_risk = min(100, (litigation_count * 6) + (active_cases * 12))
            risk_components.append(lit_risk * self.weights["esg_litigation"])
        
        # Carbon price volatility contributes to risk
        if "carbon_futures" in signals:
            carbon_records = signals["carbon_futures"]
            if carbon_records:
                volatility = statistics.stdev([abs(r.get("change_pct", 0)) 
                                              for r in carbon_records]) if len(carbon_records) > 1 else 0
                carbon_risk = min(100, volatility * 15)
                risk_components.append(carbon_risk * self.weights["carbon_futures"])
        
        # Supply chain issues contribute to risk
        if "supply_chain_signals" in signals:
            supply_records = signals["supply_chain_signals"]
            low_transparency = sum(1 for s in supply_records 
                                  if s.get("transparency_level") in ["Low", "Medium"])
            supply_risk = min(100, low_transparency * 10)
            risk_components.append(supply_risk * self.weights["supply_chain_signals"])
        
        return round(sum(risk_components) if risk_components else 0, 2)
    
    def _calculate_volatility(self, signals: Dict[str, List[Dict[str, Any]]]) -> float:
        """
        Calculate market volatility score (0-100)
        Higher = more volatile
        """
        volatility_indicators = []
        
        # Carbon price volatility
        if "carbon_futures" in signals and signals["carbon_futures"]:
            changes = [abs(r.get("change_pct", 0)) for r in signals["carbon_futures"]]
            if changes:
                carbon_vol = statistics.stdev(changes) if len(changes) > 1 else abs(changes[0])
                volatility_indicators.append(min(100, carbon_vol * 20))
        
        # Regulatory enforcement variance
        if "regulatory_violations" in signals and signals["regulatory_violations"]:
            penalties = [r.get("penalty_usd", 0) or r.get("penalty_eur", 0) 
                        for r in signals["regulatory_violations"]]
            if penalties and len(penalties) > 1:
                penalty_vol = statistics.stdev(penalties) / (statistics.mean(penalties) + 1) * 100
                volatility_indicators.append(min(100, penalty_vol))
        
        return round(statistics.mean(volatility_indicators) if volatility_indicators else 0, 2)
    
    def _calculate_momentum(self, signals: Dict[str, List[Dict[str, Any]]]) -> float:
        """
        Calculate directional momentum score (-100 to +100)
        Positive = improving conditions
        Negative = worsening conditions
        """
        momentum_factors = []
        
        # Carbon price momentum
        if "carbon_futures" in signals and signals["carbon_futures"]:
            avg_change = statistics.mean([r.get("change_pct", 0) 
                                         for r in signals["carbon_futures"]])
            # Rising carbon prices = negative momentum (higher costs)
            momentum_factors.append(-avg_change * 5)
        
        # Supply chain improvement momentum
        if "supply_chain_signals" in signals and signals["supply_chain_signals"]:
            avg_score = statistics.mean([r.get("sustainability_score", 50) 
                                        for r in signals["supply_chain_signals"]])
            # Higher sustainability score = positive momentum
            momentum_factors.append((avg_score - 50) * 2)
        
        # Litigation trend
        if "esg_litigation" in signals:
            active_cases = sum(1 for c in signals["esg_litigation"] 
                             if c.get("status") in ["Active", "Discovery", "Pre-trial"])
            # More active litigation = negative momentum
            momentum_factors.append(-active_cases * 8)
        
        momentum = sum(momentum_factors) if momentum_factors else 0
        return round(max(-100, min(100, momentum)), 2)
    
    def _calculate_forward_pressure(self, signals: Dict[str, List[Dict[str, Any]]]) -> float:
        """
        Calculate forward-looking pressure score (0-100)
        Higher = more pressure to act/change
        """
        pressure_components = []
        
        # Climate disaster pressure
        if "climate_risk" in signals:
            disaster_severity = len(signals["climate_risk"]) * 12
            pressure_components.append(min(100, disaster_severity))
        
        # Regulatory pressure
        if "regulatory_violations" in signals:
            recent_violations = len(signals["regulatory_violations"])
            pressure_components.append(min(100, recent_violations * 15))
        
        # Market pressure (carbon pricing)
        if "carbon_futures" in signals and signals["carbon_futures"]:
            avg_price = statistics.mean([r.get("price_eur", r.get("price_usd", r.get("price_gbp", 0))) 
                                        for r in signals["carbon_futures"]])
            # Higher carbon prices = more pressure
            pressure_components.append(min(100, avg_price / 1.5))
        
        # Litigation pressure
        if "esg_litigation" in signals:
            total_damages = sum(r.get("damages_claimed_usd", 0) for r in signals["esg_litigation"])
            litigation_pressure = min(100, total_damages / 10000000)  # $10M scale
            pressure_components.append(litigation_pressure)
        
        return round(statistics.mean(pressure_components) if pressure_components else 0, 2)
    
    def _cluster_by_sector(self, signals: Dict[str, List[Dict[str, Any]]]) -> Dict[str, int]:
        """Group signals by sector"""
        sectors = {}
        
        for signal_type, records in signals.items():
            for record in records:
                sector = record.get("sector", "Unknown")
                sectors[sector] = sectors.get(sector, 0) + 1
        
        return sectors
    
    def _analyze_geography(self, signals: Dict[str, List[Dict[str, Any]]]) -> Dict[str, int]:
        """Group signals by geographic region"""
        geography = {}
        
        for signal_type, records in signals.items():
            for record in records:
                location = record.get("location") or record.get("country") or record.get("jurisdiction")
                if location:
                    geography[location] = geography.get(location, 0) + 1
        
        return geography
    
    def _detect_trends(self, signals: Dict[str, List[Dict[str, Any]]]) -> Dict[str, str]:
        """Detect overall trends in the signal data"""
        trends = {}
        
        # Carbon pricing trend
        if "carbon_futures" in signals and signals["carbon_futures"]:
            avg_change = statistics.mean([r.get("change_pct", 0) for r in signals["carbon_futures"]])
            trends["carbon_pricing"] = "Rising" if avg_change > 1 else "Falling" if avg_change < -1 else "Stable"
        
        # Regulatory enforcement trend
        if "regulatory_violations" in signals:
            violation_count = len(signals["regulatory_violations"])
            trends["regulatory_enforcement"] = "Increasing" if violation_count > 5 else "Moderate" if violation_count > 2 else "Low"
        
        # Climate risk trend
        if "climate_risk" in signals:
            disaster_count = len(signals["climate_risk"])
            trends["climate_disasters"] = "Escalating" if disaster_count > 3 else "Moderate" if disaster_count > 1 else "Low"
        
        return trends
