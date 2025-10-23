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
    
    return submission
