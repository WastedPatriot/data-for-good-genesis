"""
Data Normalizer Utility
Converts scraped data to data_submissions schema format
"""

from typing import Dict, Any
import json


def normalize_to_submission_format(raw_data: Dict[str, Any], source: str) -> Dict[str, Any]:
    """
    Normalize scraped data to match data_submissions schema.
    
    Args:
        raw_data: Raw scraped data record
        source: Source identifier (scraper name)
        
    Returns:
        Normalized submission payload matching data_submissions schema
    """
    
    # Base submission structure matching data_submissions table
    submission = {
        "email": None,  # No email for scraped data
        "location": None,
        "age_range": None,
        "interests": [],
        "device_ownership": None,
        "ev_ownership": None,
        "sustainability": None,
        "sensor_data": {
            "scraper_source": source,
            "scrape_timestamp": raw_data.get("timestamp"),
            "raw_data": raw_data
        }
    }
    
    # Source-specific normalization
    if source == "eco_sentiment":
        submission["interests"] = ["Environmental News"]
        submission["sustainability"] = f"Sentiment: {raw_data.get('sentiment')} - {raw_data.get('headline')}"
    
    elif source == "ev_demand":
        submission["location"] = raw_data.get("region")
        submission["ev_ownership"] = "Interested"
        submission["interests"] = ["Automotive", "Technology"]
        submission["sensor_data"]["ev_interest_score"] = raw_data.get("ev_interest_score")
    
    elif source == "sustainability_keywords":
        submission["interests"] = ["Sustainability"]
        submission["sustainability"] = f"Keyword trend: {raw_data.get('keyword')} - {raw_data.get('interest_trend')}"
        submission["sensor_data"]["search_volume"] = raw_data.get("search_volume")
    
    elif source == "carbon_futures":
        submission["interests"] = ["Carbon Markets", "Climate Finance"]
        submission["location"] = raw_data.get("market")
        submission["sensor_data"]["carbon_market_data"] = {
            "price": raw_data.get("price_eur") or raw_data.get("price_usd") or raw_data.get("price_gbp"),
            "volume": raw_data.get("volume"),
            "change_pct": raw_data.get("change_pct")
        }
    
    elif source == "regulatory_violations":
        submission["interests"] = ["Regulatory Compliance", "Environmental Law"]
        submission["location"] = raw_data.get("country", "Unknown")
        submission["sensor_data"]["violation_data"] = {
            "facility": raw_data.get("facility_name"),
            "type": raw_data.get("violation_type"),
            "severity": raw_data.get("severity"),
            "penalty": raw_data.get("penalty_usd") or raw_data.get("penalty_eur")
        }
    
    elif source == "supply_chain_signals":
        submission["interests"] = ["Supply Chain", "Corporate Sustainability"]
        submission["sensor_data"]["supply_chain_metrics"] = {
            "company": raw_data.get("company"),
            "score": raw_data.get("sustainability_score"),
            "transparency": raw_data.get("transparency_level"),
            "renewable_pct": raw_data.get("renewable_energy_pct")
        }
    
    elif source == "climate_risk":
        submission["interests"] = ["Climate Risk", "Disaster Management"]
        submission["location"] = raw_data.get("location")
        submission["sensor_data"]["climate_event"] = {
            "type": raw_data.get("event_type"),
            "severity": raw_data.get("severity"),
            "damage_usd": raw_data.get("damage_usd"),
            "coordinates": {"lat": raw_data.get("latitude"), "lon": raw_data.get("longitude")}
        }
    
    elif source == "esg_litigation":
        submission["interests"] = ["ESG Litigation", "Corporate Accountability"]
        submission["sensor_data"]["litigation_event"] = {
            "case_type": raw_data.get("case_type"),
            "defendant": raw_data.get("defendant"),
            "allegation": raw_data.get("allegation"),
            "status": raw_data.get("status"),
            "damages_claimed": raw_data.get("damages_claimed_usd")
        }
    
    return submission
