#!/usr/bin/env python3
"""
Data for Earth - Ethical Data Scraper Module
Main entry point for scraping public data sources

Usage:
    python scraper.py --site <site_name> --output <output_path>
    python scraper.py --all --output <output_path>
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Import site-specific scrapers
from sites.eco_sentiment import EcoSentimentScraper
from sites.ev_demand import EVDemandScraper
from sites.sustainability_keywords import SustainabilityKeywordsScraper
from sites.carbon_futures import CarbonFuturesScraper
from sites.regulatory_violations import RegulatoryViolationsScraper
from sites.supply_chain_signals import SupplyChainSignalsScraper
from sites.climate_risk import ClimateRiskScraper
from sites.esg_litigation import ESGLitigationScraper

# Import utilities
from utils.user_agents import get_random_user_agent
from utils.rate_limiter import RateLimiter
from utils.normalizer import normalize_to_submission_format
from utils.signal_fusion import SignalFusionEngine
from utils.feature_engineering import FeatureEngineer

# Available scrapers registry
SCRAPERS = {
    "eco_sentiment": EcoSentimentScraper,
    "ev_demand": EVDemandScraper,
    "sustainability_keywords": SustainabilityKeywordsScraper,
    "carbon_futures": CarbonFuturesScraper,
    "regulatory_violations": RegulatoryViolationsScraper,
    "supply_chain_signals": SupplyChainSignalsScraper,
    "climate_risk": ClimateRiskScraper,
    "esg_litigation": ESGLitigationScraper,
}


def scrape_site(site_name: str, rate_limiter: RateLimiter) -> List[Dict[str, Any]]:
    """
    Scrape a specific site and return normalized data submissions.
    
    Args:
        site_name: Name of the site scraper to use
        rate_limiter: Rate limiter instance for anti-bot measures
        
    Returns:
        List of normalized data submission payloads
    """
    if site_name not in SCRAPERS:
        raise ValueError(f"Unknown scraper: {site_name}. Available: {list(SCRAPERS.keys())}")
    
    print(f"[{datetime.now()}] Starting scraper: {site_name}")
    
    # Initialize scraper with random user agent
    scraper_class = SCRAPERS[site_name]
    user_agent = get_random_user_agent()
    scraper = scraper_class(user_agent=user_agent)
    
    # Apply rate limiting
    rate_limiter.wait_if_needed()
    
    # Scrape raw data
    print(f"  → Fetching data from {site_name}...")
    raw_data = scraper.scrape()
    print(f"  → Fetched {len(raw_data)} records")
    
    # Normalize to data_submissions format
    print(f"  → Normalizing to data_submissions schema...")
    normalized = []
    for item in raw_data:
        try:
            submission = normalize_to_submission_format(item, source=site_name)
            normalized.append(submission)
        except Exception as e:
            print(f"  ⚠ Failed to normalize record: {e}")
            continue
    
    print(f"  ✓ Normalized {len(normalized)} valid submissions")
    return normalized


def main():
    parser = argparse.ArgumentParser(description="Data for Earth - Ethical Data Scraper")
    parser.add_argument(
        "--site",
        type=str,
        choices=list(SCRAPERS.keys()) + ["all"],
        help="Scraper site to run (or 'all' for all sites)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="output/scraped_data.json",
        help="Output JSON file path"
    )
    parser.add_argument(
        "--rate-limit",
        type=float,
        default=2.0,
        help="Minimum seconds between requests (default: 2.0)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print results without saving to file"
    )
    
    args = parser.parse_args()
    
    if not args.site:
        parser.print_help()
        sys.exit(1)
    
    # Initialize rate limiter
    rate_limiter = RateLimiter(min_delay=args.rate_limit, jitter=0.5)
    
    # Determine which scrapers to run
    sites_to_scrape = list(SCRAPERS.keys()) if args.site == "all" else [args.site]
    
    # Run scrapers
    all_submissions = []
    for site in sites_to_scrape:
        try:
            submissions = scrape_site(site, rate_limiter)
            all_submissions.extend(submissions)
        except Exception as e:
            print(f"[ERROR] Failed to scrape {site}: {e}")
            continue
    
    print(f"\n{'='*60}")
    print(f"Total submissions collected: {len(all_submissions)}")
    print(f"{'='*60}\n")
    
    # Output results
    if args.dry_run:
        print(json.dumps(all_submissions, indent=2))
    else:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w") as f:
            json.dump({
                "scrape_timestamp": datetime.now().isoformat(),
                "total_records": len(all_submissions),
                "sources": sites_to_scrape,
                "submissions": all_submissions
            }, f, indent=2)
        
        print(f"✓ Saved {len(all_submissions)} submissions to: {output_path}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
