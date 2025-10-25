#!/usr/bin/env python3
"""
Market Indicators Scraper
Fetches public market sentiment and economic signals
"""

import requests
from datetime import datetime
from typing import List, Dict, Any


class MarketIndicatorsScraper:
    """Scrape market indicators from public sources"""
    
    def __init__(self, user_agent: str = None):
        self.user_agent = user_agent or "DataForEarth/1.0"
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.user_agent})
    
    def scrape(self) -> List[Dict[str, Any]]:
        """Scrape market indicator signals"""
        results = []
        
        # Yahoo Finance public data
        try:
            results.extend(self._scrape_yahoo_finance())
        except Exception as e:
            print(f"  ⚠ Yahoo Finance failed: {e}")
        
        # Trading Economics public feed
        try:
            results.extend(self._scrape_trading_economics())
        except Exception as e:
            print(f"  ⚠ Trading Economics failed: {e}")
        
        return results
    
    def _scrape_yahoo_finance(self) -> List[Dict[str, Any]]:
        """Scrape public Yahoo Finance data for ESG/clean energy tickers"""
        items = []
        
        # ESG/Clean energy tickers
        tickers = ["ICLN", "TAN", "TSLA", "ENPH"]  # Clean energy ETFs and stocks
        
        for ticker in tickers:
            try:
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=5d"
                resp = self.session.get(url, timeout=10)
                
                if resp.status_code == 200:
                    data = resp.json()
                    
                    chart = data.get('chart', {}).get('result', [{}])[0]
                    meta = chart.get('meta', {})
                    
                    items.append({
                        "source": "yahoo_finance",
                        "domain": "market",
                        "sector": "clean_energy",
                        "region": "US",
                        "signal_type": "price_movement",
                        "ticker": ticker,
                        "current_price": meta.get('regularMarketPrice'),
                        "change_percent": meta.get('regularMarketChangePercent'),
                        "timestamp": datetime.utcnow().isoformat(),
                        "confidence_score": 0.80,
                        "category": "market_sentiment"
                    })
            except Exception as e:
                print(f"  ⚠ Yahoo Finance ticker {ticker} error: {e}")
        
        return items
    
    def _scrape_trading_economics(self) -> List[Dict[str, Any]]:
        """Scrape public Trading Economics calendar (no API key needed for public feed)"""
        items = []
        
        try:
            # Public RSS feed
            url = "https://tradingeconomics.com/rss/calendar.aspx"
            resp = self.session.get(url, timeout=10)
            
            if resp.status_code == 200:
                import xml.etree.ElementTree as ET
                root = ET.fromstring(resp.content)
                
                for item_elem in root.findall('.//item')[:10]:
                    title = item_elem.find('title')
                    description = item_elem.find('description')
                    
                    if title is not None:
                        items.append({
                            "source": "trading_economics_rss",
                            "domain": "macro",
                            "sector": "economics",
                            "region": "global",
                            "signal_type": "economic_event",
                            "event_title": title.text,
                            "description": description.text if description is not None else "",
                            "timestamp": datetime.utcnow().isoformat(),
                            "confidence_score": 0.75,
                            "category": "economic_indicator"
                        })
        except Exception as e:
            print(f"  ⚠ Trading Economics RSS error: {e}")
        
        return items
