"""
Rate Limiter Utility
Implements polite rate limiting with jitter for anti-bot measures
"""

import time
import random


class RateLimiter:
    """
    Rate limiter with random jitter to avoid bot detection patterns.
    """
    
    def __init__(self, min_delay: float = 2.0, jitter: float = 0.5):
        """
        Initialize rate limiter.
        
        Args:
            min_delay: Minimum delay between requests (seconds)
            jitter: Random variance to add to delay (seconds)
        """
        self.min_delay = min_delay
        self.jitter = jitter
        self.last_request_time = 0
    
    def wait_if_needed(self):
        """
        Wait if needed to maintain rate limit with jitter.
        """
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        # Calculate delay with jitter
        delay_needed = self.min_delay + random.uniform(-self.jitter, self.jitter)
        
        if time_since_last < delay_needed:
            wait_time = delay_needed - time_since_last
            time.sleep(wait_time)
        
        self.last_request_time = time.time()
