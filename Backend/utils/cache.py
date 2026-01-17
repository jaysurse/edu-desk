"""
Caching utilities for EDU-DESK
Implements Redis caching with fallback to in-memory cache
"""
import os
import json
import logging
from datetime import timedelta
from functools import wraps

logger = logging.getLogger(__name__)

# Try to import Redis, fall back to simple dict cache
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, using in-memory cache")

class CacheManager:
    """
    Cache manager with Redis support and in-memory fallback
    """
    
    def __init__(self):
        self.redis_client = None
        self.memory_cache = {}
        self.cache_enabled = False
        
        if REDIS_AVAILABLE:
            try:
                redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
                self.redis_client = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                self.redis_client.ping()
                self.cache_enabled = True
                logger.info("Redis cache initialized successfully")
            except Exception as e:
                logger.warning(f"Redis connection failed, using memory cache: {e}")
                self.redis_client = None
        
    def get(self, key):
        """Get value from cache"""
        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                return self.memory_cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error for {key}: {e}")
        return None
    
    def set(self, key, value, ttl=300):
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (default 5 minutes)
        """
        try:
            serialized = json.dumps(value)
            
            if self.redis_client:
                self.redis_client.setex(key, ttl, serialized)
            else:
                # Simple memory cache (no TTL implementation)
                self.memory_cache[key] = value
                
            logger.debug(f"Cached {key} with TTL {ttl}s")
            return True
            
        except Exception as e:
            logger.error(f"Cache set error for {key}: {e}")
            return False
    
    def delete(self, key):
        """Delete key from cache"""
        try:
            if self.redis_client:
                self.redis_client.delete(key)
            else:
                self.memory_cache.pop(key, None)
            logger.debug(f"Deleted cache key: {key}")
            return True
        except Exception as e:
            logger.error(f"Cache delete error for {key}: {e}")
            return False
    
    def clear_pattern(self, pattern):
        """Clear all keys matching pattern (Redis only)"""
        try:
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
                logger.info(f"Cleared {len(keys)} keys matching {pattern}")
            else:
                # Clear all for memory cache
                self.memory_cache.clear()
        except Exception as e:
            logger.error(f"Cache clear error for {pattern}: {e}")
    
    def exists(self, key):
        """Check if key exists in cache"""
        try:
            if self.redis_client:
                return self.redis_client.exists(key) > 0
            else:
                return key in self.memory_cache
        except Exception as e:
            logger.error(f"Cache exists error for {key}: {e}")
            return False

# Global cache instance
_cache = None

def get_cache():
    """Get global cache instance"""
    global _cache
    if _cache is None:
        _cache = CacheManager()
    return _cache

def cache_result(key_prefix, ttl=300):
    """
    Decorator to cache function results
    
    Args:
        key_prefix: Prefix for cache key
        ttl: Time to live in seconds
    
    Usage:
        @cache_result('popular_notes', ttl=600)
        def get_popular_notes(limit=10):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache = get_cache()
            
            # Generate cache key from function args
            key_parts = [key_prefix]
            if args:
                key_parts.extend([str(arg) for arg in args])
            if kwargs:
                key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached = cache.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached
            
            # Execute function and cache result
            logger.debug(f"Cache miss: {cache_key}")
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator

def invalidate_cache(pattern):
    """
    Invalidate cache entries matching pattern
    
    Args:
        pattern: Pattern to match (e.g., 'popular_notes:*')
    """
    cache = get_cache()
    cache.clear_pattern(pattern)
