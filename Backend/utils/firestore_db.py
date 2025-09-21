# Backend/utils/firestore_db.py
from firebase_admin import firestore
from typing import Dict, List, Optional
from flask import current_app
import logging


logger = logging.getLogger(__name__)

class FirestoreNotesDB:
    def __init__(self):
        """Initialize Firestore database client"""
        try:
            self.db = firestore.client()
            self.notes_collection = 'notes'
            logger.info("Firestore client initialized successfully")
        except Exception as e:
            logger.error("Failed to initialize Firestore client")
            if current_app and current_app.debug:
                logger.error(f"Firestore initialization error: {e}")
            raise
    
    def create_note(self, note_data: Dict) -> str:
        """
        Create a new note document in Firestore
        
        Args:
            note_data: Dictionary containing note information
            
        Returns:
            str: Document ID of the created note
        """
        try:
            # Create a copy of the data to avoid modifying the original
            doc_data = note_data.copy()
            
            # Add server timestamp to the copy only
            doc_data['created_at'] = firestore.SERVER_TIMESTAMP
            doc_data['updated_at'] = firestore.SERVER_TIMESTAMP
            
            # Create document with auto-generated ID
            doc_ref = self.db.collection(self.notes_collection).document()
            doc_ref.set(doc_data)
            
            logger.info("Note created successfully")
            return doc_ref.id
            
        except Exception as e:
            logger.error("Error creating note in Firestore")
            if current_app and current_app.debug:
                logger.error(f"Create note error: {e}")
            raise Exception("Failed to save note metadata")    
        
        
    def get_note(self, note_id: str) -> Optional[Dict]:
        """
        Get a specific note by ID
        
        Args:
            note_id: Document ID of the note
            
        Returns:
            dict: Note data with ID included, or None if not found
        """
        try:
            doc_ref = self.db.collection(self.notes_collection).document(note_id)
            doc = doc_ref.get()
            
            if doc.exists:
                note_data = doc.to_dict()
                note_data['id'] = doc.id
                # Convert timestamps for JSON serialization
                if 'created_at' in note_data and note_data['created_at']:
                    note_data['created_at'] = note_data['created_at'].isoformat()
                if 'updated_at' in note_data and note_data['updated_at']:
                    note_data['updated_at'] = note_data['updated_at'].isoformat()
                if 'last_downloaded' in note_data and note_data['last_downloaded']:
                    note_data['last_downloaded'] = note_data['last_downloaded'].isoformat()
                return note_data
            else:
                return None
                
        except Exception as e:
            logger.error("Error getting note from Firestore")
            if current_app and current_app.debug:
                logger.error(f"Get note error: {e}")
            return None
    
    def get_all_notes(self, limit: int = 100) -> List[Dict]:
        """
        Get all notes, ordered by creation date (newest first)
        
        Args:
            limit: Maximum number of notes to return
            
        Returns:
            list: List of note dictionaries with IDs included
        """
        try:
            notes_ref = self.db.collection(self.notes_collection)
            query = notes_ref.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
            docs = query.stream()
            
            notes = []
            for doc in docs:
                note_data = doc.to_dict()
                note_data['id'] = doc.id
                # Convert Firestore timestamps to ISO strings for JSON serialization
                if 'created_at' in note_data and note_data['created_at']:
                    note_data['created_at'] = note_data['created_at'].isoformat()
                if 'updated_at' in note_data and note_data['updated_at']:
                    note_data['updated_at'] = note_data['updated_at'].isoformat()
                if 'last_downloaded' in note_data and note_data['last_downloaded']:
                    note_data['last_downloaded'] = note_data['last_downloaded'].isoformat()
                notes.append(note_data)
            
            return notes
            
        except Exception as e:
            logger.error("Error getting notes from Firestore")
            if current_app and current_app.debug:
                logger.error(f"Get all notes error: {e}")
            return []
    
    def get_notes_by_user(self, user_id: str, limit: int = 100) -> List[Dict]:
        """
        Get notes uploaded by a specific user
        
        Args:
            user_id: Firebase user ID
            limit: Maximum number of notes to return
            
        Returns:
            list: List of note dictionaries
        """
        try:
            notes_ref = self.db.collection(self.notes_collection)
            query = (notes_ref
                    .where('uploaded_by', '==', user_id)
                    .order_by('created_at', direction=firestore.Query.DESCENDING)
                    .limit(limit))
            docs = query.stream()
            
            notes = []
            for doc in docs:
                note_data = doc.to_dict()
                note_data['id'] = doc.id
                if 'created_at' in note_data and note_data['created_at']:
                    note_data['created_at'] = note_data['created_at'].isoformat()
                if 'updated_at' in note_data and note_data['updated_at']:
                    note_data['updated_at'] = note_data['updated_at'].isoformat()
                if 'last_downloaded' in note_data and note_data['last_downloaded']:
                    note_data['last_downloaded'] = note_data['last_downloaded'].isoformat()
                notes.append(note_data)
            
            return notes
            
        except Exception as e:
            logger.error("Error getting user notes from Firestore")
            if current_app and current_app.debug:
                logger.error(f"Get user notes error: {e}")
            return []
    
    def get_notes_by_filters(self, subject: str = None, department: str = None, limit: int = 100) -> List[Dict]:
        """
        Get notes with optional filtering
        
        Args:
            subject: Filter by subject
            department: Filter by department
            limit: Maximum number of notes to return
            
        Returns:
            list: List of filtered note dictionaries
        """
        try:
            notes_ref = self.db.collection(self.notes_collection)
            query = notes_ref
            
            # Apply filters
            if subject:
                query = query.where('subject', '==', subject)
            if department:
                query = query.where('department', '==', department)
            
            # Order and limit
            query = query.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
            docs = query.stream()
            
            notes = []
            for doc in docs:
                note_data = doc.to_dict()
                note_data['id'] = doc.id
                if 'created_at' in note_data and note_data['created_at']:
                    note_data['created_at'] = note_data['created_at'].isoformat()
                if 'updated_at' in note_data and note_data['updated_at']:
                    note_data['updated_at'] = note_data['updated_at'].isoformat()
                if 'last_downloaded' in note_data and note_data['last_downloaded']:
                    note_data['last_downloaded'] = note_data['last_downloaded'].isoformat()
                notes.append(note_data)
            
            return notes
            
        except Exception as e:
            logger.error("Error filtering notes from Firestore")
            if current_app and current_app.debug:
                logger.error(f"Filter notes error: {e}")
            return []
    
    def update_note(self, note_id: str, update_data: Dict) -> bool:
        """
        Update a note document
        
        Args:
            note_id: Document ID of the note
            update_data: Dictionary containing fields to update
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Add updated timestamp
            update_data['updated_at'] = firestore.SERVER_TIMESTAMP
            
            doc_ref = self.db.collection(self.notes_collection).document(note_id)
            doc_ref.update(update_data)
            
            logger.info("Note updated successfully")
            return True
            
        except Exception as e:
            logger.error("Error updating note in Firestore")
            if current_app and current_app.debug:
                logger.error(f"Update note error: {e}")
            return False
    
    def delete_note(self, note_id: str) -> bool:
        """
        Delete a note document
        
        Args:
            note_id: Document ID of the note
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            doc_ref = self.db.collection(self.notes_collection).document(note_id)
            doc_ref.delete()
            
            logger.info("Note deleted successfully")
            return True
            
        except Exception as e:
            logger.error("Error deleting note from Firestore")
            if current_app and current_app.debug:
                logger.error(f"Delete note error: {e}")
            return False
    
    def increment_download_count(self, note_id: str) -> bool:
        """
        Increment the download count for a note
        
        Args:
            note_id: Document ID of the note
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            doc_ref = self.db.collection(self.notes_collection).document(note_id)
            doc_ref.update({
                'download_count': firestore.Increment(1),
                'last_downloaded': firestore.SERVER_TIMESTAMP
            })
            
            logger.debug("Download count incremented")
            return True
            
        except Exception as e:
            logger.error("Error incrementing download count")
            if current_app and current_app.debug:
                logger.error(f"Increment download count error: {e}")
            return False
    
    def search_notes(self, query: str, limit: int = 50) -> List[Dict]:
        """
        Search notes by title, subject, or uploader
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
            
        Returns:
            list: List of matching note dictionaries
        """
        try:
            notes_ref = self.db.collection(self.notes_collection)
            all_docs = notes_ref.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit * 3).stream()
            
            query_lower = query.lower()
            matching_notes = []
            
            for doc in all_docs:
                if len(matching_notes) >= limit:
                    break
                    
                note_data = doc.to_dict()
                note_data['id'] = doc.id
                
                # Search in title, subject, and uploader fields
                searchable_fields = [
                    note_data.get('title', '').lower(),
                    note_data.get('subject', '').lower(),
                    note_data.get('uploader', '').lower(),
                    note_data.get('department', '').lower(),
                    note_data.get('file_name', '').lower()
                ]
                
                if any(query_lower in field for field in searchable_fields):
                    # Convert timestamps for JSON serialization
                    if 'created_at' in note_data and note_data['created_at']:
                        note_data['created_at'] = note_data['created_at'].isoformat()
                    if 'updated_at' in note_data and note_data['updated_at']:
                        note_data['updated_at'] = note_data['updated_at'].isoformat()
                    if 'last_downloaded' in note_data and note_data['last_downloaded']:
                        note_data['last_downloaded'] = note_data['last_downloaded'].isoformat()
                    matching_notes.append(note_data)
            
            logger.info(f"Search completed: found {len(matching_notes)} matching notes")
            return matching_notes
            
        except Exception as e:
            logger.error("Error searching notes")
            
            if current_app and current_app.debug:
                logger.error(f"Search notes error: {e}")
            return []
    
    def get_unique_subjects(self) -> List[str]:
        """
        Get list of all unique subjects
        
        Returns:
            list: List of unique subject names
        """
        try:
            notes_ref = self.db.collection(self.notes_collection)
            docs = notes_ref.stream()
            
            subjects = set()
            for doc in docs:
                data = doc.to_dict()
                subject = data.get('subject')
                if subject and subject.strip():
                    subjects.add(subject.strip())
            
            return list(subjects)
            
        except Exception as e:
            logger.error("Error getting unique subjects")
            if current_app and current_app.debug:
                logger.error(f"Get unique subjects error: {e}")
            return []
    
    def get_unique_departments(self) -> List[str]:
        """
        Get list of all unique departments
        
        Returns:
            list: List of unique department names
        """
        try:
            notes_ref = self.db.collection(self.notes_collection)
            docs = notes_ref.stream()
            
            departments = set()
            for doc in docs:
                data = doc.to_dict()
                department = data.get('department')
                if department and department.strip():
                    departments.add(department.strip())
            
            return list(departments)
            
        except Exception as e:
            logger.error("Error getting unique departments")
            if current_app and current_app.debug:
                logger.error(f"Get unique departments error: {e}")
            return []
        
    def increment(self, value=1):
        """Helper method for Firestore increment operations"""
        return firestore.Increment(value)
    
_firestore_db_instance = None

def get_firestore_db():
    """Get or create Firestore database instance"""
    global _firestore_db_instance
    if _firestore_db_instance is None:
        _firestore_db_instance = FirestoreNotesDB()
    return _firestore_db_instance


def initialize_firestore():
    """Initialize Firestore database connection"""
    global firestore_db
    try:
        firestore_db = FirestoreNotesDB()
        return firestore_db
    except Exception as e:
        logger.error("Failed to initialize Firestore")
        if current_app and current_app.debug:
            logger.error(f"Firestore initialization error: {e}")
        raise