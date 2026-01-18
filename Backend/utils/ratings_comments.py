# Backend/utils/ratings_comments.py
from firebase_admin import firestore
from typing import Dict, List, Optional
from flask import current_app
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class RatingsCommentsDB:
    def __init__(self):
        """Initialize Firestore database client for ratings and comments"""
        try:
            self.db = firestore.client()
            self.ratings_collection = 'ratings'
            self.comments_collection = 'comments'
            logger.info("Ratings and Comments DB initialized successfully")
        except Exception as e:
            logger.error("Failed to initialize Ratings and Comments DB")
            raise

    def add_rating(self, note_id: str, user_id: str, rating: int, user_email: str) -> bool:
        """
        Add or update a rating for a note
        
        Args:
            note_id: Document ID of the note
            user_id: Firebase user ID
            rating: Rating value (1-5)
            user_email: User email for reference
            
        Returns:
            bool: True if successful
        """
        try:
            if not 1 <= rating <= 5:
                raise ValueError("Rating must be between 1 and 5")
            
            rating_id = f"{note_id}_{user_id}"
            rating_data = {
                'note_id': note_id,
                'user_id': user_id,
                'user_email': user_email,
                'rating': rating,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            self.db.collection(self.ratings_collection).document(rating_id).set(rating_data)
            logger.info(f"Rating added for note {note_id}")
            return True
        except Exception as e:
            logger.error(f"Error adding rating: {e}")
            return False

    def get_note_ratings(self, note_id: str) -> Dict:
        """
        Get all ratings for a note with statistics
        
        Args:
            note_id: Document ID of the note
            
        Returns:
            dict: Ratings statistics
        """
        try:
            query = self.db.collection(self.ratings_collection).where('note_id', '==', note_id)
            ratings = [doc.to_dict() for doc in query.stream()]
            
            if not ratings:
                return {
                    'average': 0,
                    'total_ratings': 0,
                    'distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
                }
            
            distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            total = 0
            
            for rating in ratings:
                r = rating['rating']
                distribution[r] += 1
                total += r
            
            return {
                'average': round(total / len(ratings), 2),
                'total_ratings': len(ratings),
                'distribution': distribution
            }
        except Exception as e:
            logger.error(f"Error getting ratings: {e}")
            return {'average': 0, 'total_ratings': 0, 'distribution': {}}

    def get_user_rating(self, note_id: str, user_id: str) -> Optional[int]:
        """Get a specific user's rating for a note"""
        try:
            rating_id = f"{note_id}_{user_id}"
            doc = self.db.collection(self.ratings_collection).document(rating_id).get()
            if doc.exists:
                return doc.to_dict().get('rating')
            return None
        except Exception as e:
            logger.error(f"Error getting user rating: {e}")
            return None

    def add_comment(self, note_id: str, user_id: str, user_email: str, user_name: str, text: str) -> Optional[str]:
        """
        Add a comment to a note
        
        Args:
            note_id: Document ID of the note
            user_id: Firebase user ID
            user_email: User email
            user_name: User display name
            text: Comment text
            
        Returns:
            str: Comment ID if successful, None otherwise
        """
        try:
            if not text.strip():
                raise ValueError("Comment cannot be empty")
            
            comment_id = str(uuid.uuid4())
            comment_data = {
                'comment_id': comment_id,
                'note_id': note_id,
                'user_id': user_id,
                'user_email': user_email,
                'user_name': user_name,
                'text': text.strip(),
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'likes': 0
            }
            
            self.db.collection(self.comments_collection).document(comment_id).set(comment_data)
            logger.info(f"Comment added to note {note_id}")
            return comment_id
        except Exception as e:
            logger.error(f"Error adding comment: {e}")
            return None

    def get_note_comments(self, note_id: str, limit: int = 50) -> List[Dict]:
        """
        Get all comments for a note
        
        Args:
            note_id: Document ID of the note
            limit: Maximum number of comments to return
            
        Returns:
            list: List of comments
        """
        try:
            query = (self.db.collection(self.comments_collection)
                    .where('note_id', '==', note_id)
                    .order_by('created_at', direction=firestore.Query.DESCENDING)
                    .limit(limit))
            
            comments = []
            for doc in query.stream():
                comment = doc.to_dict()
                if 'created_at' in comment and comment['created_at']:
                    comment['created_at'] = comment['created_at'].isoformat()
                if 'updated_at' in comment and comment['updated_at']:
                    comment['updated_at'] = comment['updated_at'].isoformat()
                comments.append(comment)
            
            return comments
        except Exception as e:
            logger.error(f"Error getting comments: {e}")
            return []

    def delete_comment(self, comment_id: str, user_id: str) -> bool:
        """Delete a comment (only by author)"""
        try:
            doc = self.db.collection(self.comments_collection).document(comment_id).get()
            if not doc.exists:
                return False
            
            comment = doc.to_dict()
            if comment['user_id'] != user_id:
                return False
            
            self.db.collection(self.comments_collection).document(comment_id).delete()
            logger.info(f"Comment {comment_id} deleted")
            return True
        except Exception as e:
            logger.error(f"Error deleting comment: {e}")
            return False

    def like_comment(self, comment_id: str) -> bool:
        """Increment like count for a comment"""
        try:
            doc_ref = self.db.collection(self.comments_collection).document(comment_id)
            doc_ref.update({'likes': firestore.Increment(1)})
            return True
        except Exception as e:
            logger.error(f"Error liking comment: {e}")
            return False
