# Backend/utils/favorites.py
from firebase_admin import firestore
from typing import Dict, List, Optional
from flask import current_app
import logging
import uuid

logger = logging.getLogger(__name__)

class FavoritesDB:
    def __init__(self):
        """Initialize Firestore database client for favorites"""
        try:
            self.db = firestore.client()
            self.favorites_collection = 'favorites'
            self.collections_collection = 'note_collections'
            logger.info("Favorites DB initialized successfully")
        except Exception as e:
            logger.error("Failed to initialize Favorites DB")
            raise

    def add_to_favorites(self, user_id: str, note_id: str) -> bool:
        """
        Add a note to user's favorites
        
        Args:
            user_id: Firebase user ID
            note_id: Document ID of the note
            
        Returns:
            bool: True if successful
        """
        try:
            favorite_id = f"{user_id}_{note_id}"
            favorite_data = {
                'user_id': user_id,
                'note_id': note_id,
                'added_at': firestore.SERVER_TIMESTAMP
            }
            
            self.db.collection(self.favorites_collection).document(favorite_id).set(favorite_data)
            logger.info(f"Note {note_id} added to favorites for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error adding to favorites: {e}")
            return False

    def remove_from_favorites(self, user_id: str, note_id: str) -> bool:
        """Remove a note from user's favorites"""
        try:
            favorite_id = f"{user_id}_{note_id}"
            self.db.collection(self.favorites_collection).document(favorite_id).delete()
            logger.info(f"Note {note_id} removed from favorites for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error removing from favorites: {e}")
            return False

    def is_favorited(self, user_id: str, note_id: str) -> bool:
        """Check if a note is in user's favorites"""
        try:
            favorite_id = f"{user_id}_{note_id}"
            doc = self.db.collection(self.favorites_collection).document(favorite_id).get()
            return doc.exists
        except Exception as e:
            logger.error(f"Error checking favorite status: {e}")
            return False

    def get_user_favorites(self, user_id: str, limit: int = 100) -> List[str]:
        """
        Get all note IDs in user's favorites
        
        Args:
            user_id: Firebase user ID
            limit: Maximum number of favorites to return
            
        Returns:
            list: List of note IDs
        """
        try:
            query = (self.db.collection(self.favorites_collection)
                    .where('user_id', '==', user_id)
                    .order_by('added_at', direction=firestore.Query.DESCENDING)
                    .limit(limit))
            
            favorites = [doc.to_dict()['note_id'] for doc in query.stream()]
            return favorites
        except Exception as e:
            logger.error(f"Error getting user favorites: {e}")
            return []

    def create_collection(self, user_id: str, name: str, description: str = '') -> Optional[str]:
        """
        Create a new notes collection
        
        Args:
            user_id: Firebase user ID
            name: Collection name
            description: Collection description
            
        Returns:
            str: Collection ID if successful
        """
        try:
            collection_id = str(uuid.uuid4())
            collection_data = {
                'collection_id': collection_id,
                'user_id': user_id,
                'name': name,
                'description': description,
                'notes': [],
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            self.db.collection(self.collections_collection).document(collection_id).set(collection_data)
            logger.info(f"Collection {collection_id} created")
            return collection_id
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            return None

    def add_note_to_collection(self, collection_id: str, note_id: str, user_id: str) -> bool:
        """Add a note to a collection"""
        try:
            doc = self.db.collection(self.collections_collection).document(collection_id).get()
            if not doc.exists:
                return False
            
            collection = doc.to_dict()
            if collection['user_id'] != user_id:
                return False
            
            if note_id not in collection.get('notes', []):
                collection['notes'].append(note_id)
                self.db.collection(self.collections_collection).document(collection_id).update({
                    'notes': collection['notes'],
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
            
            return True
        except Exception as e:
            logger.error(f"Error adding note to collection: {e}")
            return False

    def remove_note_from_collection(self, collection_id: str, note_id: str, user_id: str) -> bool:
        """Remove a note from a collection"""
        try:
            doc = self.db.collection(self.collections_collection).document(collection_id).get()
            if not doc.exists:
                return False
            
            collection = doc.to_dict()
            if collection['user_id'] != user_id:
                return False
            
            if note_id in collection.get('notes', []):
                collection['notes'].remove(note_id)
                self.db.collection(self.collections_collection).document(collection_id).update({
                    'notes': collection['notes'],
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
            
            return True
        except Exception as e:
            logger.error(f"Error removing note from collection: {e}")
            return False

    def get_user_collections(self, user_id: str) -> List[Dict]:
        """Get all collections for a user"""
        try:
            query = self.db.collection(self.collections_collection).where('user_id', '==', user_id)
            
            collections = []
            for doc in query.stream():
                collection = doc.to_dict()
                if 'created_at' in collection and collection['created_at']:
                    collection['created_at'] = collection['created_at'].isoformat()
                if 'updated_at' in collection and collection['updated_at']:
                    collection['updated_at'] = collection['updated_at'].isoformat()
                collections.append(collection)
            
            return collections
        except Exception as e:
            logger.error(f"Error getting user collections: {e}")
            return []

    def delete_collection(self, collection_id: str, user_id: str) -> bool:
        """Delete a collection"""
        try:
            doc = self.db.collection(self.collections_collection).document(collection_id).get()
            if not doc.exists:
                return False
            
            collection = doc.to_dict()
            if collection['user_id'] != user_id:
                return False
            
            self.db.collection(self.collections_collection).document(collection_id).delete()
            return True
        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            return False
