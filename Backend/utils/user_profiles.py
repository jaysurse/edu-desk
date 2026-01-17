# Backend/utils/user_profiles.py
from firebase_admin import firestore
from typing import Dict, List, Optional
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class UserProfilesDB:
    def __init__(self):
        """Initialize Firestore database client for user profiles"""
        try:
            self.db = firestore.client()
            self.users_collection = 'users'
            logger.info("User Profiles DB initialized successfully")
        except Exception as e:
            logger.error("Failed to initialize User Profiles DB")
            raise

    def create_or_update_profile(self, user_id: str, user_data: Dict) -> bool:
        """
        Create or update a user profile
        
        Args:
            user_id: Firebase user ID
            user_data: User information (email, name, etc.)
            
        Returns:
            bool: True if successful
        """
        try:
            profile_data = {
                'user_id': user_id,
                'email': user_data.get('email', ''),
                'name': user_data.get('name', user_data.get('email', 'User')),
                'photo_url': user_data.get('photo_url', ''),
                'bio': user_data.get('bio', ''),
                'total_uploads': 0,
                'total_downloads_received': 0,
                'average_rating': 0,
                'badges': [],
                'joined_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            self.db.collection(self.users_collection).document(user_id).set(profile_data, merge=True)
            logger.info(f"User profile created/updated for {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error creating/updating profile: {e}")
            return False

    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile by ID"""
        try:
            doc = self.db.collection(self.users_collection).document(user_id).get()
            if doc.exists:
                profile = doc.to_dict()
                if 'joined_at' in profile and profile['joined_at']:
                    profile['joined_at'] = profile['joined_at'].isoformat()
                if 'updated_at' in profile and profile['updated_at']:
                    profile['updated_at'] = profile['updated_at'].isoformat()
                return profile
            return None
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None

    def increment_user_uploads(self, user_id: str) -> bool:
        """Increment total uploads count"""
        try:
            self.db.collection(self.users_collection).document(user_id).update({
                'total_uploads': firestore.Increment(1),
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            return True
        except Exception as e:
            logger.error(f"Error incrementing uploads: {e}")
            return False

    def increment_downloads_received(self, user_id: str) -> bool:
        """Increment total downloads received"""
        try:
            self.db.collection(self.users_collection).document(user_id).update({
                'total_downloads_received': firestore.Increment(1),
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            return True
        except Exception as e:
            logger.error(f"Error incrementing downloads received: {e}")
            return False

    def update_average_rating(self, user_id: str, average_rating: float) -> bool:
        """Update user's average rating"""
        try:
            self.db.collection(self.users_collection).document(user_id).update({
                'average_rating': round(average_rating, 2),
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            return True
        except Exception as e:
            logger.error(f"Error updating average rating: {e}")
            return False

    def add_badge(self, user_id: str, badge_name: str) -> bool:
        """Add a badge to user profile"""
        try:
            user_doc = self.db.collection(self.users_collection).document(user_id).get()
            if user_doc.exists:
                badges = user_doc.to_dict().get('badges', [])
                if badge_name not in badges:
                    badges.append(badge_name)
                    self.db.collection(self.users_collection).document(user_id).update({
                        'badges': badges,
                        'updated_at': firestore.SERVER_TIMESTAMP
                    })
            return True
        except Exception as e:
            logger.error(f"Error adding badge: {e}")
            return False

    def get_top_uploaders(self, limit: int = 10) -> List[Dict]:
        """Get top uploaders by upload count"""
        try:
            query = (self.db.collection(self.users_collection)
                    .order_by('total_uploads', direction=firestore.Query.DESCENDING)
                    .limit(limit))
            
            uploaders = []
            for doc in query.stream():
                uploader = doc.to_dict()
                uploaders.append(uploader)
            
            return uploaders
        except Exception as e:
            logger.error(f"Error getting top uploaders: {e}")
            return []
