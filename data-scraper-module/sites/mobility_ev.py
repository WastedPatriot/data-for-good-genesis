#!/usr/bin/env python3
"""
Mobility & EV Scraper
Fetches electric vehicle adoption and charging infrastructure data
"""

import requests
from datetime import datetime
from typing import List, Dict, Any


class MobilityEVScraper:
    """Scrape mobility and EV adoption signals"""
    
    def __init__(self, user_agent: str = None):
        self.user_agent = user_agent or "DataForEarth/1.0"
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.user_agent})
    
    def scrape(self) -> List[Dict[str, Any]]:
        """Scrape EV and mobility signals"""
        results = []
        
        # OpenChargeMap API (public)
        try:
            results.extend(self._scrape_open_charge_map())
        except Exception as e:
            print(f"  ⚠ OpenChargeMap failed: {e}")
        
        # Alternative Fuels Data Center (US DOE - public)
        try:
            results.extend(self._scrape_afdc())
        except Exception as e:
            print(f"  ⚠ AFDC failed: {e}")
        
        return results
    
    def _scrape_open_charge_map(self) -> List[Dict[str, Any]]:
        """Scrape EV charging station data from OpenChargeMap"""
        items = []
        
        # Public API endpoint
        url = "https://api.openchargemap.io/v3/poi/?output=json&countrycode=US&maxresults=50&compact=true&verbose=false"
        
        try:
            resp = self.session.get(url, timeout=15)
            
            if resp.status_code == 200:
                stations = resp.json()
                
                for station in stations[:20]:  # Sample 20 stations
                    items.append({
                        "source": "open_charge_map",
                        "domain": "mobility",
                        "sector": "ev_infrastructure",
                        "region": "US",
                        "signal_type": "charging_station",
                        "station_id": station.get('ID'),
                        "address": station.get('AddressInfo', {}).get('AddressLine1'),
                        "city": station.get('AddressInfo', {}).get('Town'),
                        "state": station.get('AddressInfo', {}).get('StateOrProvince'),
                        "num_points": station.get('NumberOfPoints'),
                        "status": station.get('StatusType', {}).get('Title'),
                        "timestamp": datetime.utcnow().isoformat(),
                        "confidence_score": 0.85,
                        "category": "infrastructure"
                    })
        except Exception as e:
            print(f"  ⚠ OpenChargeMap API error: {e}")
        
        return items
    
    def _scrape_afdc(self) -> List[Dict[str, Any]]:
        """Scrape Alternative Fuels Data Center (US DOE public data)"""
        items = []
        
        # AFDC public API (no key required for basic queries)
        try:
            url = "https://developer.nrel.gov/api/alt-fuel-stations/v1.json?fuel_type=ELEC&state=CA&limit=20"
            resp = self.session.get(url, timeout=15)
            
            if resp.status_code == 200:
                data = resp.json()
                stations = data.get('fuel_stations', [])
                
                for station in stations:
                    items.append({
                        "source": "afdc_nrel",
                        "domain": "mobility",
                        "sector": "ev_infrastructure",
                        "region": "US",
                        "signal_type": "alt_fuel_station",
                        "station_name": station.get('station_name'),
                        "city": station.get('city'),
                        "state": station.get('state'),
                        "fuel_type": station.get('fuel_type_code'),
                        "access_code": station.get('access_code'),
                        "ev_network": station.get('ev_network'),
                        "timestamp": datetime.utcnow().isoformat(),
                        "confidence_score": 0.90,
                        "category": "infrastructure"
                    })
        except Exception as e:
            print(f"  ⚠ AFDC API error: {e}")
        
        return items
