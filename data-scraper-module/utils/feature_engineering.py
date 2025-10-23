"""
Feature Engineering for Institutional Signals
Automatic time-series features, anomaly detection, correlation scoring
"""

from typing import List, Dict, Any
import statistics
from datetime import datetime, timedelta


class FeatureEngineer:
    """
    Automatically generates features from raw institutional signals
    """
    
    def engineer_features(self, raw_data: Dict[str, Any], 
                         historical_data: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate engineered features from raw data
        
        Args:
            raw_data: Current raw signal data
            historical_data: Previous data points for time-series analysis
        
        Returns:
            Dict with engineered features
        """
        features = {
            "timestamp": int(datetime.now().timestamp()),
            "time_series_features": {},
            "anomaly_flags": [],
            "correlation_scores": {},
            "derived_metrics": {}
        }
        
        # Time-series features
        if historical_data:
            features["time_series_features"] = self._generate_time_series_features(
                raw_data, historical_data
            )
        
        # Anomaly detection
        features["anomaly_flags"] = self._detect_anomalies(raw_data, historical_data)
        
        # Correlation scoring
        features["correlation_scores"] = self._calculate_correlations(raw_data)
        
        # Derived metrics
        features["derived_metrics"] = self._calculate_derived_metrics(raw_data)
        
        return features
    
    def _generate_time_series_features(self, current: Dict[str, Any], 
                                      historical: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate time-series features"""
        ts_features = {}
        
        # Moving averages
        if "risk_index" in current:
            historical_risk = [h.get("risk_index", 0) for h in historical[-7:]]  # Last 7 points
            if historical_risk:
                ts_features["risk_index_ma7"] = statistics.mean(historical_risk)
                ts_features["risk_index_trend"] = current["risk_index"] - ts_features["risk_index_ma7"]
        
        # Volatility over time
        if "volatility_score" in current:
            historical_vol = [h.get("volatility_score", 0) for h in historical[-7:]]
            if len(historical_vol) > 1:
                ts_features["volatility_stdev"] = statistics.stdev(historical_vol)
        
        # Momentum acceleration
        if "momentum_score" in current and len(historical) >= 2:
            prev_momentum = historical[-1].get("momentum_score", 0)
            ts_features["momentum_acceleration"] = current["momentum_score"] - prev_momentum
        
        # Rate of change
        if "forward_pressure_score" in current and len(historical) >= 1:
            prev_pressure = historical[-1].get("forward_pressure_score", 0)
            ts_features["pressure_rate_of_change"] = (
                (current["forward_pressure_score"] - prev_pressure) / (prev_pressure + 1) * 100
            )
        
        return ts_features
    
    def _detect_anomalies(self, current: Dict[str, Any], 
                         historical: List[Dict[str, Any]] = None) -> List[str]:
        """Detect anomalous signals"""
        anomalies = []
        
        if not historical or len(historical) < 5:
            return anomalies
        
        # Risk index spike detection
        if "risk_index" in current:
            historical_risk = [h.get("risk_index", 0) for h in historical[-30:]]
            if historical_risk:
                mean_risk = statistics.mean(historical_risk)
                std_risk = statistics.stdev(historical_risk) if len(historical_risk) > 1 else 0
                
                # 2-sigma anomaly detection
                if current["risk_index"] > mean_risk + (2 * std_risk):
                    anomalies.append("RISK_INDEX_SPIKE")
                elif current["risk_index"] < mean_risk - (2 * std_risk):
                    anomalies.append("RISK_INDEX_DROP")
        
        # Volatility anomaly
        if "volatility_score" in current:
            historical_vol = [h.get("volatility_score", 0) for h in historical[-30:]]
            if historical_vol and len(historical_vol) > 1:
                mean_vol = statistics.mean(historical_vol)
                std_vol = statistics.stdev(historical_vol)
                
                if current["volatility_score"] > mean_vol + (2 * std_vol):
                    anomalies.append("VOLATILITY_SURGE")
        
        # Momentum reversal
        if "momentum_score" in current and len(historical) >= 3:
            recent_momentum = [h.get("momentum_score", 0) for h in historical[-3:]]
            if recent_momentum:
                avg_recent = statistics.mean(recent_momentum)
                # Check for sign reversal
                if (avg_recent > 10 and current["momentum_score"] < -10) or \
                   (avg_recent < -10 and current["momentum_score"] > 10):
                    anomalies.append("MOMENTUM_REVERSAL")
        
        return anomalies
    
    def _calculate_correlations(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate correlations between metrics"""
        correlations = {}
        
        # Risk-Volatility correlation indicator
        if "risk_index" in data and "volatility_score" in data:
            # Normalized correlation estimate
            correlations["risk_volatility"] = min(1.0, (data["risk_index"] * data["volatility_score"]) / 10000)
        
        # Risk-Pressure correlation
        if "risk_index" in data and "forward_pressure_score" in data:
            correlations["risk_pressure"] = min(1.0, (data["risk_index"] * data["forward_pressure_score"]) / 10000)
        
        # Momentum-Volatility inverse correlation
        if "momentum_score" in data and "volatility_score" in data:
            # High volatility often means uncertain momentum
            correlations["momentum_volatility_inverse"] = -min(1.0, abs(data["momentum_score"]) / (data["volatility_score"] + 1))
        
        return correlations
    
    def _calculate_derived_metrics(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate derived metrics from base features"""
        derived = {}
        
        # Composite risk-reward score
        if "risk_index" in data and "momentum_score" in data:
            # Positive momentum reduces effective risk
            derived["risk_adjusted_score"] = data["risk_index"] * (1 - (data["momentum_score"] / 200))
        
        # Urgency index (combines pressure and volatility)
        if "forward_pressure_score" in data and "volatility_score" in data:
            derived["urgency_index"] = (data["forward_pressure_score"] * 0.7 + data["volatility_score"] * 0.3)
        
        # Stability score (inverse of volatility and risk)
        if "volatility_score" in data and "risk_index" in data:
            derived["stability_score"] = 100 - ((data["volatility_score"] + data["risk_index"]) / 2)
        
        # Market sentiment (momentum normalized)
        if "momentum_score" in data:
            if data["momentum_score"] > 20:
                derived["market_sentiment"] = "Bullish"
            elif data["momentum_score"] < -20:
                derived["market_sentiment"] = "Bearish"
            else:
                derived["market_sentiment"] = "Neutral"
        
        return derived
