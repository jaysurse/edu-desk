from datetime import datetime, timezone
from typing import Dict, Optional, Tuple
from utils.firestore_db import get_firestore_db
import os
import logging
from firebase_admin import firestore

logger = logging.getLogger(__name__)

class UsageTracker:
    def __init__(self):
        self.env = os.getenv("ENV", "local").lower()
        self.disabled = self.env != "production"
        self.db = None if self.disabled else get_firestore_db()
        self.collection_name = 'usage_tracking'
        
        # Cloudflare R2 Free Tier Limits
        self.LIMITS = {
            'storage_bytes': 10 * 1024 * 1024 * 1024,  # 10 GB in bytes (cumulative, never resets)
            'class_a_operations': 1_000_000,  # 1 million per month (resets monthly)
            'class_b_operations': 10_000_000,  # 10 million per month (resets monthly)
        }
    
    def get_current_month_key(self) -> str:
        """Generate a key for the current month (YYYY-MM format)"""
        now = datetime.now(timezone.utc)
        return f"{now.year}-{now.month:02d}"
    
    def get_usage_document_id(self) -> str:
        """Get the document ID for current month's usage"""
        return f"usage_{self.get_current_month_key()}"
    
    def get_storage_document_id(self) -> str:
        """Get the document ID for cumulative storage tracking"""
        return "storage_cumulative"
    
    def initialize_monthly_usage(self) -> Dict:
        """Initialize usage document for the current month (operations only)"""
        doc_id = self.get_usage_document_id()
        now = datetime.now(timezone.utc)
        
        initial_data = {
            'month_key': self.get_current_month_key(),
            'created_at': now,
            'last_updated': now,
            'class_a_operations': 0,
            'class_b_operations': 0,
            'reset_date': datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        }
        
        try:
            # Use Firestore's set method with merge=True to avoid overwriting existing data
            self.db.db.collection(self.collection_name).document(doc_id).set(initial_data, merge=True)
            logger.info(f"Initialized monthly operations tracking for {self.get_current_month_key()}")
            return initial_data
        except Exception as e:
            logger.error(f"Failed to initialize monthly usage: {e}")
            raise
    
    def initialize_storage_tracking(self) -> Dict:
        """Initialize cumulative storage tracking (never resets)"""
        if self.disabled:
            return 0

        doc_id = self.get_storage_document_id()
        now = datetime.now(timezone.utc)
        
        initial_data = {
            'created_at': now,
            'last_updated': now,
            'storage_bytes': 0,
        }
        
        try:
            self.db.db.collection(self.collection_name).document(doc_id).set(initial_data, merge=True)
            logger.info("Initialized cumulative storage tracking")
            return initial_data
        except Exception as e:
            logger.error(f"Failed to initialize storage tracking: {e}")
            raise
    
    def get_current_storage(self) -> int:
        """Get current cumulative storage usage"""
        doc_id = self.get_storage_document_id()
        
        try:
            doc = self.db.db.collection(self.collection_name).document(doc_id).get()
            
            if doc.exists:
                data = doc.to_dict()
                return data.get('storage_bytes', 0)
            else:
                logger.info("No storage document found, initializing new one")
                storage_data = self.initialize_storage_tracking()
                return storage_data['storage_bytes']
                
        except Exception as e:
            logger.error(f"Failed to get current storage: {e}")
            # Return 0 if database is unavailable (safer than initializing)
            return 0
    
    def get_current_operations(self) -> Dict:
        """Get current month's operations statistics"""
        if self.disabled:
            now = datetime.now(timezone.utc)
            return {
                'month_key': self.get_current_month_key(),
                'created_at': now,
                'last_updated': now,
                'class_a_operations': 0,
                'class_b_operations': 0,
                'reset_date': datetime(now.year, now.month, 1, tzinfo=timezone.utc)
            }

        doc_id = self.get_usage_document_id()
        
        try:
            doc = self.db.db.collection(self.collection_name).document(doc_id).get()
            
            if doc.exists:
                data = doc.to_dict()
                # Check if we need to reset for a new month
                current_month_key = self.get_current_month_key()
                if data.get('month_key') != current_month_key:
                    logger.info(f"New month detected, resetting operations from {data.get('month_key')} to {current_month_key}")
                    return self.initialize_monthly_usage()
                return data
            else:
                logger.info("No operations document found, initializing new one")
                return self.initialize_monthly_usage()
                
        except Exception as e:
            logger.error(f"Failed to get current operations: {e}")
            # Return safe defaults if database is unavailable
            return self.initialize_monthly_usage()
    
    def get_current_usage(self) -> Dict:
        """Get combined current usage (storage + operations)"""
        if self.disabled:
            return {
                'month_key': self.get_current_month_key(),
                'storage_bytes': 0,
                'class_a_operations': 0,
                'class_b_operations': 0,
            }

        storage_bytes = self.get_current_storage()
        operations = self.get_current_operations()
        
        return {
            'month_key': operations.get('month_key', self.get_current_month_key()),
            'created_at': operations.get('created_at'),
            'last_updated': operations.get('last_updated'),
            'storage_bytes': storage_bytes,
            'class_a_operations': operations.get('class_a_operations', 0),
            'class_b_operations': operations.get('class_b_operations', 0),
            'reset_date': operations.get('reset_date')
        }
    
    def check_limits_before_operation(self, operation_type: str, additional_storage: int = 0) -> Tuple[bool, str, Dict]:
        """
        Check if operation would exceed limits
        
        Args:
            operation_type: 'upload', 'download', 'list', 'delete', 'get_metadata'
            additional_storage: Additional storage bytes for upload operations
            
        Returns:
            Tuple of (can_proceed, error_message, current_usage)
        """
        current_usage = self.get_current_usage()
        
        # Define operation types
        class_a_ops = {'upload', 'delete', 'list'}  # PUT, DELETE, LIST operations
        class_b_ops = {'download', 'get_metadata', 'get'}  # GET operations
        
        # Check storage limit for uploads
        if operation_type == 'upload' and additional_storage > 0:
            new_storage = current_usage['storage_bytes'] + additional_storage
            if new_storage > self.LIMITS['storage_bytes']:
                storage_limit_gb = self.LIMITS['storage_bytes'] / (1024 * 1024 * 1024)
                current_storage_mb = current_usage['storage_bytes'] / (1024 * 1024)
                additional_mb = additional_storage / (1024 * 1024)
                
                return False, (
                    f"Storage limit exceeded. "
                    f"Current: {current_storage_mb:.2f}MB, "
                    f"Additional: {additional_mb:.2f}MB, "
                    f"Limit: {storage_limit_gb}GB"
                ), current_usage
        
        # Check Class A operations
        if operation_type in class_a_ops:
            if current_usage['class_a_operations'] >= self.LIMITS['class_a_operations']:
                return False, (
                    f"Class A operations limit exceeded. "
                    f"Current: {current_usage['class_a_operations']:,}, "
                    f"Limit: {self.LIMITS['class_a_operations']:,}"
                ), current_usage
        
        # Check Class B operations
        if operation_type in class_b_ops:
            if current_usage['class_b_operations'] >= self.LIMITS['class_b_operations']:
                return False, (
                    f"Class B operations limit exceeded. "
                    f"Current: {current_usage['class_b_operations']:,}, "
                    f"Limit: {self.LIMITS['class_b_operations']:,}"
                ), current_usage
        
        return True, "", current_usage
    
    def record_operation(self, operation_type: str, storage_delta: int = 0) -> bool:
        """
        Record an operation and update usage counters
        
        Args:
            operation_type: Type of operation performed
            storage_delta: Change in storage (positive for upload, negative for delete)
            
        Returns:
            bool: Success status
        """
        now = datetime.now(timezone.utc)
        
        try:
            # Define operation types
            class_a_ops = {'upload', 'delete', 'list'}
            class_b_ops = {'download', 'get_metadata', 'get', 'search'}
            
            # Update storage if there's a change
            if storage_delta != 0:
                storage_doc_id = self.get_storage_document_id()
                storage_doc_ref = self.db.db.collection(self.collection_name).document(storage_doc_id)
                
                # For storage updates, we need to ensure we don't go below 0
                if storage_delta < 0:  # Deletion
                    current_storage = self.get_current_storage()
                    new_storage = max(0, current_storage + storage_delta)
                    
                    storage_doc_ref.set({
                        'storage_bytes': new_storage,
                        'last_updated': now
                    }, merge=True)
                    
                    logger.info(f"Updated storage: {current_storage} -> {new_storage} (delta: {storage_delta})")
                else:  # Upload - use increment for atomic update
                    storage_doc_ref.update({
                        'storage_bytes': firestore.Increment(storage_delta),
                        'last_updated': now
                    })
                    
                    logger.info(f"Incremented storage by {storage_delta} bytes")
            
            # Update operation counters
            operations_doc_id = self.get_usage_document_id()
            operations_doc_ref = self.db.db.collection(self.collection_name).document(operations_doc_id)
            
            update_data = {'last_updated': now}
            
            if operation_type in class_a_ops:
                # Increment Class A operations
                operations_doc_ref.update({
                    'class_a_operations': firestore.Increment(1),
                    **update_data
                })
                logger.info(f"Incremented Class A operations for {operation_type}")
                
            elif operation_type in class_b_ops:
                # Increment Class B operations
                operations_doc_ref.update({
                    'class_b_operations': firestore.Increment(1),
                    **update_data
                })
                logger.info(f"Incremented Class B operations for {operation_type}")
            
            logger.info(f"Recorded {operation_type} operation with storage_delta={storage_delta}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to record operation {operation_type}: {e}")
            return False
    
    def get_usage_stats(self) -> Dict:
        """Get detailed usage statistics with percentages and limits"""
        current_usage = self.get_current_usage()
        
        stats = {
            'current_month': self.get_current_month_key(),
            'last_updated': current_usage.get('last_updated'),
            'reset_date': current_usage.get('reset_date'),
            'storage': {
                'used_bytes': current_usage['storage_bytes'],
                'used_mb': round(current_usage['storage_bytes'] / (1024 * 1024), 2),
                'used_gb': round(current_usage['storage_bytes'] / (1024 * 1024 * 1024), 3),
                'limit_bytes': self.LIMITS['storage_bytes'],
                'limit_gb': self.LIMITS['storage_bytes'] / (1024 * 1024 * 1024),
                'percentage_used': round((current_usage['storage_bytes'] / self.LIMITS['storage_bytes']) * 100, 2),
                'remaining_bytes': self.LIMITS['storage_bytes'] - current_usage['storage_bytes'],
                'remaining_mb': round((self.LIMITS['storage_bytes'] - current_usage['storage_bytes']) / (1024 * 1024), 2),
                'note': 'Storage is cumulative and never resets'
            },
            'class_a_operations': {
                'used': current_usage['class_a_operations'],
                'limit': self.LIMITS['class_a_operations'],
                'percentage_used': round((current_usage['class_a_operations'] / self.LIMITS['class_a_operations']) * 100, 2),
                'remaining': self.LIMITS['class_a_operations'] - current_usage['class_a_operations'],
                'note': 'Resets monthly on the 1st'
            },
            'class_b_operations': {
                'used': current_usage['class_b_operations'],
                'limit': self.LIMITS['class_b_operations'],
                'percentage_used': round((current_usage['class_b_operations'] / self.LIMITS['class_b_operations']) * 100, 2),
                'remaining': self.LIMITS['class_b_operations'] - current_usage['class_b_operations'],
                'note': 'Resets monthly on the 1st'
            }
        }
        
        return stats
    
    def is_near_limit(self, threshold_percentage: float = 80.0) -> Dict[str, bool]:
        """Check if any usage metric is near its limit"""
        stats = self.get_usage_stats()
        
        return {
            'storage': stats['storage']['percentage_used'] >= threshold_percentage,
            'class_a': stats['class_a_operations']['percentage_used'] >= threshold_percentage,
            'class_b': stats['class_b_operations']['percentage_used'] >= threshold_percentage,
            'any_near_limit': any([
                stats['storage']['percentage_used'] >= threshold_percentage,
                stats['class_a_operations']['percentage_used'] >= threshold_percentage,
                stats['class_b_operations']['percentage_used'] >= threshold_percentage,
            ])
        }
    
    def reset_monthly_operations(self, target_month: Optional[str] = None) -> bool:
        """
        Reset operations for a specific month (mainly for testing or manual reset)
        DOES NOT reset storage as that should be cumulative
        
        Args:
            target_month: Month to reset in YYYY-MM format, defaults to current month
        """
        if target_month:
            doc_id = f"usage_{target_month}"
            month_key = target_month
        else:
            doc_id = self.get_usage_document_id()
            month_key = self.get_current_month_key()
        
        try:
            reset_data = {
                'month_key': month_key,
                'last_updated': datetime.now(timezone.utc),
                'class_a_operations': 0,
                'class_b_operations': 0,
                'reset_date': datetime.now(timezone.utc),
                'manually_reset': target_month is not None
            }
            
            self.db.db.collection(self.collection_name).document(doc_id).set(reset_data)
            logger.info(f"Reset operations for month: {month_key} (storage unchanged)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reset monthly operations: {e}")
            return False
    
    def manual_storage_reset(self, new_storage_value: int = 0) -> bool:
        """
        Manually set storage tracking to match actual bucket usage
        Use this to sync with actual bucket contents if tracking gets out of sync
        
        Args:
            new_storage_value: The actual storage bytes currently in your bucket
        """
        doc_id = self.get_storage_document_id()
        
        try:
            reset_data = {
                'storage_bytes': new_storage_value,
                'last_updated': datetime.now(timezone.utc),
                'manually_reset': True,
                'reset_reason': 'Manual storage sync to match actual bucket usage'
            }
            
            self.db.db.collection(self.collection_name).document(doc_id).set(reset_data, merge=True)
            logger.info(f"Manually set storage to: {new_storage_value} bytes")
            return True
            
        except Exception as e:
            logger.error(f"Failed to manually set storage: {e}")
            return False

# Global instance
_usage_tracker = None

def get_usage_tracker() -> UsageTracker:
    """Get global usage tracker instance"""
    global _usage_tracker
    if _usage_tracker is None:
        _usage_tracker = UsageTracker()
    return _usage_tracker

# Decorator for automatic usage tracking
def track_usage(operation_type: str, check_limits: bool = True):
    """
    Decorator to automatically track usage for API endpoints
    
    Args:
        operation_type: The type of operation being performed
        check_limits: Whether to check limits before allowing operation
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            tracker = get_usage_tracker()

            if tracker.disabled:
                return func(*args, **kwargs)
            
            # For upload operations, we need to check the file size
            additional_storage = 0
            if operation_type == 'upload' and check_limits:
                # Try to extract file size from request
                from flask import request
                if 'file' in request.files:
                    file = request.files['file']
                    # Get file size by seeking to end
                    file.seek(0, 2)  # Seek to end
                    additional_storage = file.tell()
                    file.seek(0)  # Reset to beginning
            
            # For delete operations, get file size BEFORE deletion
            storage_delta = 0
            if operation_type == 'delete':
                try:
                    # Extract note_id from the function arguments
                    note_id = None
                    
                    # Method 1: Check if note_id is in kwargs
                    if 'note_id' in kwargs:
                        note_id = kwargs['note_id']
                    
                    # Method 2: Check if it's in args (positional arguments)
                    elif len(args) >= 2:
                        note_id = args[-1]  # Get the last argument
                    
                    # Method 3: Extract from Flask request path
                    if not note_id:
                        from flask import request
                        path_parts = request.path.split('/')
                        if 'delete' in path_parts:
                            delete_index = path_parts.index('delete')
                            if delete_index + 1 < len(path_parts):
                                note_id = path_parts[delete_index + 1]
                    
                    # Get file size BEFORE the deletion happens
                    if note_id:
                        from utils.firestore_db import get_firestore_db
                        firestore_db = get_firestore_db()
                        note = firestore_db.get_note(note_id)
                        if note and 'file_size' in note:
                            storage_delta = -note['file_size']  # Negative for deletion
                            print(f"📊 Will reduce storage by {note['file_size']} bytes for note {note_id}")
                        else:
                            print(f"⚠️ Could not find note or file_size for note_id: {note_id}")
                
                except Exception as e:
                    print(f"❌ Error getting file size before delete: {e}")
            
            # Check limits before operation
            if check_limits:
                can_proceed, error_msg, current_usage = tracker.check_limits_before_operation(
                    operation_type, additional_storage
                )
                
                if not can_proceed:
                    from flask import jsonify
                    return jsonify({
                        'error': f'Usage limit exceeded: {error_msg}',
                        'code': 'USAGE_LIMIT_EXCEEDED',
                        'usage_stats': tracker.get_usage_stats()
                    }), 429  # Too Many Requests
            
            # Execute the original function
            result = func(*args, **kwargs)
            
            # Determine if operation was successful
            status_code = 200
            if hasattr(result, 'status_code'):
                status_code = result.status_code
            elif isinstance(result, tuple) and len(result) > 1:
                # Flask returns (response, status_code) tuples
                status_code = result[1]
                
            # Only record operation if successful (status code < 400)
            if status_code < 400:
                final_storage_delta = 0
                
                # Handle different operation types
                if operation_type == 'upload':
                    final_storage_delta = additional_storage
                elif operation_type == 'delete':
                    final_storage_delta = storage_delta  # Already calculated above
                
                # Record the operation with appropriate storage delta
                tracker.record_operation(operation_type, final_storage_delta)
                print(f"✅ Recorded {operation_type} operation with storage delta: {final_storage_delta}")
            
            return result
        
        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper
    return decorator