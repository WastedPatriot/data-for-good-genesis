"""
Real Climate Data Scraper
Fetches actual climate data from public APIs and government sources
"""

import requests
from typing import List, Dict, Any
import time
import random
from datetime import datetime


class RealClimateDataScraper:
    """
    Scraper for real climate data from public sources:
    - NOAA Climate Data API
    - NASA POWER API (solar/temperature)
    - OpenWeatherMap Air Quality API
    - Carbon Monitor CO2 emissions
    """
    
    def __init__(self, user_agent: str):
        self.user_agent = user_agent
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})
    
    def scrape(self) -> List[Dict[str, Any]]:
        """
        Scrape real climate data from multiple public sources.
        
        Returns:
            List of raw scraped climate records
        """
        results = []
        
        # 1. NASA POWER API - Solar radiation and temperature (no API key required)
        results.extend(self._fetch_nasa_power_data())
        
        # 2. NOAA NCDC Climate Data - Public access
        results.extend(self._fetch_noaa_climate_data())
        
        # 3. Carbon Monitor - Real-time CO2 emissions (public API)
        results.extend(self._fetch_carbon_monitor_data())
        
        return results
    
    def _fetch_nasa_power_data(self) -> List[Dict[str, Any]]:
        """
        Fetch solar radiation and temperature data from NASA POWER API.
        Public API, no authentication required.
        https://power.larc.nasa.gov/api/temporal/daily/point
        """
        results = []
        
        # Sample locations (major cities)
        locations = [
            {"name": "New York", "lat": 40.7128, "lon": -74.0060},
            {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437},
            {"name": "London", "lat": 51.5074, "lon": -0.1278},
            {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503},
            {"name": "Sydney", "lat": -33.8688, "lon": 151.2093},
        ]
        
        for location in locations:
            try:
                time.sleep(random.uniform(0.5, 1.5))  # Rate limiting
                
                # NASA POWER API endpoint
                url = "https://power.larc.nasa.gov/api/temporal/daily/point"
                params = {
                    "parameters": "T2M,ALLSKY_SFC_SW_DWN",  # Temperature, solar radiation
                    "community": "RE",
                    "longitude": location["lon"],
                    "latitude": location["lat"],
                    "start": "20250101",
                    "end": "20250107",
                    "format": "JSON"
                }
                
                response = self.session.get(url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                if "properties" in data and "parameter" in data["properties"]:
                    parameters = data["properties"]["parameter"]
                    
                    # Extract latest values
                    temp_data = parameters.get("T2M", {})
                    solar_data = parameters.get("ALLSKY_SFC_SW_DWN", {})
                    
                    if temp_data and solar_data:
                        latest_date = list(temp_data.keys())[-1] if temp_data else None
                        
                        if latest_date:
                            results.append({
                                "source": "NASA_POWER",
                                "location": location["name"],
                                "latitude": location["lat"],
                                "longitude": location["lon"],
                                "date": latest_date,
                                "temperature_c": temp_data[latest_date],
                                "solar_radiation_kwh": solar_data[latest_date],
                                "timestamp": time.time(),
                                "data_quality": "high",
                                "category": "climate"
                            })
                
            except Exception as e:
                print(f"  ⚠ Failed to fetch NASA POWER data for {location['name']}: {e}")
                continue
        
        return results
    
    def _fetch_noaa_climate_data(self) -> List[Dict[str, Any]]:
        """
        Fetch climate data from NOAA Climate Data Online.
        Note: Requires NOAA CDO API token (free registration at https://www.ncdc.noaa.gov/cdo-web/token)
        For production: Add NOAA_API_TOKEN to environment variables
        """
        results = []
        
        # Check for API token
        import os
        api_token = os.getenv("NOAA_API_TOKEN")
        
        if not api_token:
            print("  ⚠ NOAA_API_TOKEN not set. Skipping NOAA data.")
            return results
        
        try:
            time.sleep(random.uniform(0.5, 1.5))
            
            # NOAA CDO API endpoint for global summary data
            url = "https://www.ncei.noaa.gov/cdo-web/api/v2/data"
            headers = {"token": api_token}
            params = {
                "datasetid": "GHCND",  # Global Historical Climatology Network Daily
                "datatypeid": "TAVG",  # Average temperature
                "limit": 10,
                "startdate": "2025-01-01",
                "enddate": "2025-01-07"
            }
            
            response = self.session.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if "results" in data:
                for record in data["results"]:
                    results.append({
                        "source": "NOAA_CDO",
                        "station": record.get("station"),
                        "date": record.get("date"),
                        "datatype": record.get("datatype"),
                        "value": record.get("value"),
                        "timestamp": time.time(),
                        "data_quality": "high",
                        "category": "climate"
                    })
        
        except Exception as e:
            print(f"  ⚠ Failed to fetch NOAA climate data: {e}")
        
        return results
    
    def _fetch_carbon_monitor_data(self) -> List[Dict[str, Any]]:
        """
        Fetch real-time CO2 emissions data from Carbon Monitor.
        Public API: https://carbonmonitor.org/
        """
        results = []
        
        try:
            time.sleep(random.uniform(0.5, 1.5))
            
            # Carbon Monitor API endpoint (near-real-time CO2 emissions)
            # Note: Check https://carbonmonitor.org/ for latest API documentation
            # This is a simplified example - actual implementation depends on current API
            
            url = "https://api.carbonmonitor.org/v1/emissions/latest"
            
            response = self.session.get(url, timeout=30)
            
            # If API returns 404, it may require registration or have changed
            if response.status_code == 404:
                print("  ⚠ Carbon Monitor API endpoint may have changed. Check documentation.")
                return results
            
            response.raise_for_status()
            data = response.json()
            
            # Parse based on actual API structure
            if isinstance(data, list):
                for record in data:
                    results.append({
                        "source": "CARBON_MONITOR",
                        "country": record.get("country"),
                        "sector": record.get("sector"),
                        "emissions_mt_co2": record.get("emissions"),
                        "date": record.get("date"),
                        "timestamp": time.time(),
                        "data_quality": "high",
                        "category": "emissions"
                    })
            elif isinstance(data, dict):
                results.append({
                    "source": "CARBON_MONITOR",
                    "data": data,
                    "timestamp": time.time(),
                    "data_quality": "high",
                    "category": "emissions"
                })
        
        except Exception as e:
            print(f"  ⚠ Failed to fetch Carbon Monitor data: {e}")
        
        return results
