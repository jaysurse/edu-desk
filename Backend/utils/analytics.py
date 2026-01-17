# Backend/utils/analytics.py
from firebase_admin import firestore
from typing import Dict, List
from flask import current_app
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Import cache utilities
try:
    from utils.cache import cache_result
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False
    logger.warning("Cache not available for analytics")

class AnalyticsDB:
    def __init__(self):
        """Initialize Firestore database client for analytics"""
        try:
            self.db = firestore.client()
            self.analytics_collection = 'analytics'
            logger.info("Analytics DB initialized successfully")
        except Exception as e:
            logger.error("Failed to initialize Analytics DB")
            raise

    def track_action(self, action_type: str, user_id: str = None, note_id: str = None, metadata: Dict = None) -> bool:
        """
        Track user actions for analytics
        
        Args:
            action_type: Type of action (download, upload, search, etc.)
            user_id: User ID (optional)
            note_id: Note ID (optional)
            metadata: Additional metadata
            
        Returns:
            bool: True if successful
        """
        try:
            import uuid
            event_id = str(uuid.uuid4())
            # Try to resolve college_id from metadata, note, or user
            college_id = None
            if metadata and 'college_id' in metadata:
                college_id = metadata['college_id']
            elif note_id:
                try:
                    from utils.firestore_db import FirestoreNotesDB
                    note = FirestoreNotesDB().get_note(note_id)
                    if note and 'college_id' in note:
                        college_id = note['college_id']
                except Exception:
                    pass
            elif user_id:
                try:
                    from utils.user_profiles import UserProfilesDB
                    user = UserProfilesDB().get_user_profile(user_id)
                    if user and 'college_id' in user:
                        college_id = user['college_id']
                except Exception:
                    pass
            if not college_id:
                try:
                    from utils.firestore_db import get_default_college_department_subject_ids
                    college_id = get_default_college_department_subject_ids()['college_id']
                except Exception:
                    college_id = None
            event_data = {
                'event_id': event_id,
                'action_type': action_type,
                'user_id': user_id,
                'note_id': note_id,
                'college_id': college_id,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'metadata': metadata or {}
            }
            self.db.collection(self.analytics_collection).document(event_id).set(event_data)
            return True
        except Exception as e:
            logger.error(f"Error tracking action: {e}")
            return False

    def get_popular_notes(self, days: int = 7, limit: int = 10) -> List[Dict]:
        """Get most downloaded notes in the last N days (cached for 10 min)"""
        # Wrap in cache if available
        if CACHE_AVAILABLE:
            try:
                from utils.cache import get_cache
                cache = get_cache()
                cache_key = f"popular_notes:{days}:{limit}"
                cached = cache.get(cache_key)
                if cached:
                    return cached
            except:
                pass
        
        try:
            from_date = datetime.now() - timedelta(days=days)
            
            # This requires getting data from notes collection and sorting by downloads
            # Implementation depends on access to firestore
            query = self.db.collection('notes').order_by('download_count', direction=firestore.Query.DESCENDING).limit(limit)
            
            notes = []
            for doc in query.stream():
                note = doc.to_dict()
                note['id'] = doc.id
                notes.append(note)
            
            # Cache result if available
            if CACHE_AVAILABLE:
                try:
                    cache.set(cache_key, notes, ttl=600)
                except:
                    pass
            
            return notes
        except Exception as e:
            logger.error(f"Error getting popular notes: {e}")
            return []

    def get_subject_statistics(self) -> Dict:
        """Get statistics by subject"""
        try:
            notes = self.db.collection('notes').stream()
            
            subject_stats = {}
            for doc in notes:
                note = doc.to_dict()
                subject = note.get('subject', 'Unknown')
                
                if subject not in subject_stats:
                    subject_stats[subject] = {
                        'count': 0,
                        'total_downloads': 0,
                        'avg_rating': 0
                    }
                
                subject_stats[subject]['count'] += 1
                subject_stats[subject]['total_downloads'] += note.get('download_count', 0)
            
            return subject_stats
        except Exception as e:
            logger.error(f"Error getting subject statistics: {e}")
            return {}

    def get_department_statistics(self) -> Dict:
        """Get statistics by department"""
        try:
            notes = self.db.collection('notes').stream()
            
            dept_stats = {}
            for doc in notes:
                note = doc.to_dict()
                dept = note.get('department', 'Unknown')
                
                if dept not in dept_stats:
                    dept_stats[dept] = {
                        'count': 0,
                        'total_downloads': 0
                    }
                
                dept_stats[dept]['count'] += 1
                dept_stats[dept]['total_downloads'] += note.get('download_count', 0)
            
            return dept_stats
        except Exception as e:
            logger.error(f"Error getting department statistics: {e}")
            return {}

    def get_admin_dashboard_stats(self) -> Dict:
        """Get comprehensive admin dashboard statistics"""
        try:
            notes = list(self.db.collection('notes').stream())
            users = list(self.db.collection('users').stream())
            
            total_notes = len(notes)
            total_downloads = sum(doc.to_dict().get('download_count', 0) for doc in notes)
            total_file_size = sum(doc.to_dict().get('file_size', 0) for doc in notes)
            
            # Get trending notes (most downloaded in last 7 days)
            notes_dict = [doc.to_dict() for doc in notes]
            trending = sorted(notes_dict, key=lambda x: x.get('download_count', 0), reverse=True)[:5]
            
            return {
                'total_notes': total_notes,
                'total_users': len(users),
                'total_downloads': total_downloads,
                'total_file_size_mb': round(total_file_size / (1024 * 1024), 2),
                'trending_notes': trending,
                'subject_stats': self.get_subject_statistics(),
                'department_stats': self.get_department_statistics()
            }
        except Exception as e:
            logger.error(f"Error getting admin dashboard stats: {e}")
            return {}
