# Helper to resolve default college/department/subject IDs
def get_default_college_department_subject_ids():
    college_db = FirestoreCollegeDB()
    college = college_db.get_or_create_default_college()
    dept_db = FirestoreDepartmentDB()
    dept = dept_db.get_or_create_default_department(college['id'])
    subj_db = FirestoreSubjectDB()
    subj = subj_db.get_or_create_default_subject(dept['id'])
    return {
        'college_id': college['id'],
        'department_id': dept['id'],
        'subject_id': subj['id']
    }
class FirestoreCollegeDB:
    def __init__(self):
        self.db = firestore.client()
        self.colleges_collection = 'colleges'
    def get_or_create_default_college(self):
        default_code = 'DEFAULT_COLLEGE'
        default_name = 'Default College'
        colleges = self.db.collection(self.colleges_collection).where('code', '==', default_code).stream()
        for doc in colleges:
            college = doc.to_dict()
            college['id'] = doc.id
            return college
        # Not found, create
        doc_ref = self.db.collection(self.colleges_collection).document()
        college_data = {
            'name': default_name,
            'code': default_code,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(college_data)
        college_data['id'] = doc_ref.id
        return college_data

class FirestoreDepartmentDB:
    def __init__(self):
        self.db = firestore.client()
        self.departments_collection = 'departments'
    def get_or_create_default_department(self, college_id):
        default_code = 'DEFAULT_DEPT'
        default_name = 'Default Department'
        depts = self.db.collection(self.departments_collection).where('code', '==', default_code).where('college_id', '==', college_id).stream()
        for doc in depts:
            dept = doc.to_dict()
            dept['id'] = doc.id
            return dept
        # Not found, create
        doc_ref = self.db.collection(self.departments_collection).document()
        dept_data = {
            'college_id': college_id,
            'name': default_name,
            'code': default_code
        }
        doc_ref.set(dept_data)
        dept_data['id'] = doc_ref.id
        return dept_data

class FirestoreSubjectDB:
    def __init__(self):
        self.db = firestore.client()
        self.subjects_collection = 'subjects'
    def get_or_create_default_subject(self, department_id):
        default_code = 'DEFAULT_SUBJECT'
        default_name = 'Default Subject'
        subjects = self.db.collection(self.subjects_collection).where('code', '==', default_code).where('department_id', '==', department_id).stream()
        for doc in subjects:
            subj = doc.to_dict()
            subj['id'] = doc.id
            return subj
        # Not found, create
        doc_ref = self.db.collection(self.subjects_collection).document()
        subj_data = {
            'department_id': department_id,
            'name': default_name,
            'code': default_code,
            'semester': 1
        }
        doc_ref.set(subj_data)
        subj_data['id'] = doc_ref.id
        return subj_data
# Backend/utils/firestore_db.py
from firebase_admin import firestore
from typing import Dict, List, Optional
from flask import current_app
import logging
import os
import json
import uuid
from pathlib import Path


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
            from utils.firestore_db import get_default_college_department_subject_ids
            ids = get_default_college_department_subject_ids()
            doc_data = note_data.copy()
            # Attach default college/department/subject if missing
            doc_data['college_id'] = note_data.get('college_id', ids['college_id'])
            doc_data['department_id'] = note_data.get('department_id', ids['department_id'])
            doc_data['subject_id'] = note_data.get('subject_id', ids['subject_id'])
            # Add lifecycle/integrity fields with defaults
            doc_data['status'] = note_data.get('status', 'published')
            doc_data['is_deleted'] = note_data.get('is_deleted', False)
            doc_data['version'] = note_data.get('version', 1)
            doc_data['created_at'] = firestore.SERVER_TIMESTAMP
            doc_data['updated_at'] = firestore.SERVER_TIMESTAMP
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
            # Increment version
            doc_ref = self.db.collection(self.notes_collection).document(note_id)
            doc = doc_ref.get()
            current_version = 1
            if doc.exists:
                doc_data = doc.to_dict()
                current_version = doc_data.get('version', 1)
            update_data['version'] = current_version + 1
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
        Soft delete a note: set is_deleted = True and update updated_at
        Args:
            note_id: Document ID of the note
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            doc_ref = self.db.collection(self.notes_collection).document(note_id)
            doc_ref.update({
                'is_deleted': True,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            logger.info("Note soft-deleted (is_deleted=True)")
            return True
        except Exception as e:
            logger.error("Error soft-deleting note from Firestore")
            if current_app and current_app.debug:
                logger.error(f"Soft delete note error: {e}")
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
                # Only include published and not deleted
                if note_data.get('status', 'published') != 'published' or note_data.get('is_deleted', False):
                    continue
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
    
class LocalNotesDB:
    """Filesystem-backed notes store for local/non-production environments."""

    def __init__(self):
        base_path = os.environ.get("FILE_STORAGE_PATH") or os.path.abspath("uploads")
        Path(base_path).mkdir(parents=True, exist_ok=True)
        self.notes_file = Path(base_path) / "notes.json"
        if not self.notes_file.exists():
            self.notes_file.write_text(json.dumps([]))

    def _load(self) -> List[Dict]:
        try:
            return json.loads(self.notes_file.read_text())
        except Exception:
            return []

    def _save(self, notes: List[Dict]):
        self.notes_file.write_text(json.dumps(notes, default=str))

    def create_note(self, note_data: Dict) -> str:
        notes = self._load()
        note_id = str(uuid.uuid4())
        note_copy = note_data.copy()
        note_copy['id'] = note_id
        notes.append(note_copy)
        self._save(notes)
        return note_id

    def get_note(self, note_id: str) -> Optional[Dict]:
        for n in self._load():
            if n.get('id') == note_id:
                return n
        return None

    def get_all_notes(self, limit: int = 100) -> List[Dict]:
        return list(self._load())[:limit]

    def get_notes_by_user(self, user_id: str, limit: int = 100) -> List[Dict]:
        return [n for n in self._load() if n.get('uploaded_by') == user_id][:limit]

    def get_notes_by_filters(self, subject: str = None, department: str = None, limit: int = 100) -> List[Dict]:
        notes = self._load()
        if subject:
            notes = [n for n in notes if n.get('subject') == subject]
        if department:
            notes = [n for n in notes if n.get('department') == department]
        return notes[:limit]

    def increment_download_count(self, note_id: str):
        notes = self._load()
        for n in notes:
            if n.get('id') == note_id:
                n['download_count'] = n.get('download_count', 0) + 1
                break
        self._save(notes)

    def delete_note(self, note_id: str) -> bool:
        notes = self._load()
        new_notes = [n for n in notes if n.get('id') != note_id]
        deleted = len(new_notes) != len(notes)
        if deleted:
            self._save(new_notes)
        return deleted

    def get_unique_subjects(self) -> List[str]:
        return list({n.get('subject') for n in self._load() if n.get('subject')})

    def get_unique_departments(self) -> List[str]:
        return list({n.get('department') for n in self._load() if n.get('department')})


_firestore_db_instance = None


def get_firestore_db():
    """Get or create database instance (Firestore in production, local JSON otherwise)."""
    global _firestore_db_instance
    if _firestore_db_instance is None:
        env = os.getenv("ENV", "local").lower()
        if env == "production":
            _firestore_db_instance = FirestoreNotesDB()
        else:
            logger.info("Using LocalNotesDB (filesystem) for non-production environment")
            _firestore_db_instance = LocalNotesDB()
    return _firestore_db_instance


def initialize_firestore():
    """Initialize database connection (Firestore in production, local JSON otherwise)."""
    global firestore_db
    env = os.getenv("ENV", "local").lower()
    try:
        if env == "production":
            firestore_db = FirestoreNotesDB()
        else:
            logger.info("Initializing LocalNotesDB (filesystem) for non-production")
            firestore_db = LocalNotesDB()
        return firestore_db
    except Exception as e:
        logger.error("Failed to initialize Firestore/local store")
        if current_app and current_app.debug:
            logger.error(f"Firestore initialization error: {e}")
        raise