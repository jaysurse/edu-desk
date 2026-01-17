# Backend/utils/security.py
from flask import request
from functools import wraps
import logging
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, max_requests: int = 100, window_seconds: int = 3600):
        """
        Initialize rate limiter
        
        Args:
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, identifier: str) -> bool:
        """
        Check if a request is allowed for the given identifier
        
        Args:
            identifier: IP address or user ID
            
        Returns:
            bool: True if request is allowed
        """
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.window_seconds)
        
        # Remove old requests outside the window
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if req_time > cutoff
        ]
        
        if len(self.requests[identifier]) < self.max_requests:
            self.requests[identifier].append(now)
            return True
        
        return False

class SecurityUtils:
    @staticmethod
    def get_client_ip() -> str:
        """Get client IP address from request"""
        if request.environ.get('HTTP_X_FORWARDED_FOR'):
            return request.environ.get('HTTP_X_FORWARDED_FOR').split(',')[0]
        return request.remote_addr

def rate_limit(max_requests: int = 100, window_seconds: int = 3600):
    """
    Rate limiting decorator
    
    Args:
        max_requests: Maximum requests allowed
        window_seconds: Time window in seconds
    """
    limiter = RateLimiter(max_requests, window_seconds)
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = SecurityUtils.get_client_ip()
            
            if not limiter.is_allowed(client_ip):
                from flask import jsonify
                return jsonify({
                    'error': 'Rate limit exceeded. Too many requests.',
                    'code': 'RATE_LIMIT_EXCEEDED'
                }), 429
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

class EmailValidator:
    @staticmethod
    def is_valid_email(email: str) -> bool:
        """Simple email validation"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

class ContentValidator:
    @staticmethod
    def validate_comment(text: str, max_length: int = 500) -> tuple:
        """
        Validate comment text
        
        Returns:
            tuple: (is_valid, error_message)
        """
        if not text or not text.strip():
            return False, "Comment cannot be empty"
        
        if len(text) > max_length:
            return False, f"Comment exceeds maximum length of {max_length} characters"
        
        # Check for spam patterns
        if ContentValidator._is_spam(text):
            return False, "Comment contains spam or inappropriate content"
        
        return True, None

    @staticmethod
    def _is_spam(text: str) -> bool:
        """Check if text contains spam patterns"""
        spam_patterns = [
            r'http[s]?://',  # URLs
            r'\b[A-Z]{5,}\b',  # All caps words (repeated)
        ]
        
        import re
        for pattern in spam_patterns:
            if len(re.findall(pattern, text)) > 3:
                return True
        
        return False
