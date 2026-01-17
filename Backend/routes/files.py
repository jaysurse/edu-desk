from flask import Blueprint, request, jsonify, current_app, send_file
from utils.helpers import allowed_file, get_file_size 
from utils.auth import require_authentication, require_authentication_optional
from utils.storage import get_storage 
from utils.firestore_db import get_firestore_db
from utils.usage_db import get_usage_tracker, track_usage
from werkzeug.utils import secure_filename
import zipfile
import io
import logging

logger = logging.getLogger(__name__)

files_bp = Blueprint('files', __name__)

@files_bp.route('/upload', methods=['POST'])
@require_authentication
@track_usage('upload')
def upload_file(current_user):
    """Upload file to Cloudflare R2 and store metadata in Firestore"""
    try:
        required_fields = ['title', 'subject', 'department']
        for field in required_fields:
            if field not in request.form or not request.form[field].strip():
                return jsonify({
                    "success": False,
                    "data": None,
                    "error": f"Missing required field: {field}"
                }), 400

        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "data": None,
                "error": "No file uploaded"
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                "success": False,
                "data": None,
                "error": "No file selected"
            }), 400

        sanitized_filename = secure_filename(file.filename)
        if not sanitized_filename:
            return jsonify({
                "success": False,
                "data": None,
                "error": "Invalid filename"
            }), 400

        # Only allow PDF
        if not allowed_file(sanitized_filename):
            return jsonify({
                "success": False,
                "data": None,
                "error": "File type not allowed. Only PDF files are supported."
            }), 400

        file_size = get_file_size(file)
        max_size = current_app.config.get('MAX_CONTENT_LENGTH', 10 * 1024 * 1024)
        if file_size > max_size:
            return jsonify({
                "success": False,
                "data": None,
                "error": f"File size exceeds {max_size // (1024*1024)}MB limit"
            }), 400

        uploader = request.form.get('uploader', '').strip()
        if not uploader:
            uploader = current_user.get('name') or current_user.get('email', 'Anonymous')

        print(f"📤 Starting upload for: {sanitized_filename}")

        storage = get_storage()
        upload_result = storage.upload_file(file, sanitized_filename)

        note_data = {
            'title': request.form['title'].strip(),
            'subject': request.form['subject'],
            'uploader': uploader,
            'department': request.form['department'],
            'file_name': sanitized_filename,
            'file_key': upload_result['file_key'],
            'file_url': upload_result.get('file_url'),   
            'file_size': upload_result['file_size'],
            'content_type': upload_result['content_type'],
            'uploaded_by': current_user['uid'],       
            'uploader_email': current_user.get('email'),
            'download_count': 0,
            'bucket_name': upload_result.get('bucket_name'),
            'storage_path': upload_result.get('storage_path'),
        }

        firestore_db = get_firestore_db()
        note_id = firestore_db.create_note(note_data)

        note_data['id'] = note_id

        print(f"✅ Upload completed successfully: {note_id}")

        tracker = get_usage_tracker()

        return jsonify({
            "success": True,
            "data": {
                "note": note_data,
                "usage_stats": tracker.get_usage_stats()
            },
            "error": None
        }), 201

    except Exception as e:
        current_app.logger.error(f"Upload error: {str(e)}")
        print(f"❌ Upload error: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Internal server error occurred during upload"
        }), 500

@files_bp.route('/notes', methods=['GET'])
@require_authentication_optional
@track_usage('list')
def get_notes(current_user=None):
    """Get all notes from Firestore with optional filtering"""
    try:
        subject = request.args.get('subject')
        department = request.args.get('department')
        my_notes_only = request.args.get('my_notes') == 'true'
        limit = int(request.args.get('limit', 100))
        
        firestore_db = get_firestore_db()
        
        if my_notes_only and current_user:
            # Get user's own notes
            notes = firestore_db.get_notes_by_user(current_user['uid'], limit)
        elif subject or department:
            # Get filtered notes
            notes = firestore_db.get_notes_by_filters(subject, department, limit)
        else:
            # Get all notes
            notes = firestore_db.get_all_notes(limit)
        
        return jsonify({
            "success": True,
            "data": {
                'notes': notes,
                'count': len(notes),
                'user_authenticated': current_user is not None,
                'user_id': current_user['uid'] if current_user else None
            },
            "error": None
        }), 200
    except Exception as e:
        current_app.logger.error(f"Get notes error: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Failed to retrieve notes"
        }), 500

@files_bp.route('/download/<note_id>', methods=['GET'])
@track_usage('download')
def download_file(note_id):
    """Download file directly from R2 storage"""
    try:
        # Get note metadata from Firestore
        firestore_db = get_firestore_db()
        note = firestore_db.get_note(note_id)
        
        if not note:
            return jsonify({
                "success": False,
                "data": None,
                "error": "Note not found"
            }), 404
        
        # Increment download count
        firestore_db.increment_download_count(note_id)
        
        # Get file content from storage backend
        storage = get_storage()
        file_content = storage.get_file_content(note['file_key'])
        
        if not file_content:
            return jsonify({
                "success": False,
                "data": None,
                "error": "Failed to retrieve file"
            }), 500
        
        from flask import Response
        
        safe_filename = secure_filename(note["file_name"])
        
        response = Response(
            file_content,
            mimetype=note.get('content_type', 'application/octet-stream'),
            headers={
                'Content-Disposition': f'attachment; filename="{safe_filename}"',
                'Content-Length': str(len(file_content))
            }
        )
        
        return response

    except Exception as e:
        current_app.logger.error(f"Download error: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Internal server error during download"
        }), 500

@files_bp.route('/delete/<note_id>', methods=['DELETE'])
@require_authentication
@track_usage('delete')
def delete_note(current_user, note_id):
    """Delete note and associated file from R2"""
    try:
        # Get note metadata from Firestore
        db = get_firestore_db()
        note = db.get_note(note_id)
        
        if not note:
            return jsonify({
                "success": False,
                "data": None,
                "error": "Note not found"
            }), 404
        # Check if the current user is the owner of the note
        if note['uploaded_by'] != current_user['uid']:
            return jsonify({
                "success": False,
                "data": None,
                "error": "You can only delete your own notes"
            }), 403
        
        print(f"🗑️ Deleting note: {note_id}")
        
        # Delete file from storage
        storage = get_storage()
        file_deleted = storage.delete_file(note['file_key'])
        
        if not file_deleted:
            print(f"⚠️ Warning: Could not delete file from R2: {note['file_key']}")
        
        metadata_deleted = db.delete_note(note_id)

        if not metadata_deleted:
            return jsonify({
                'error': 'Failed to delete note metadata',
                'code': 'METADATA_DELETE_ERROR'
            }), 500
        
        print(f"✅ Note deleted successfully: {note_id}")
        
        return jsonify({
            'message': 'Note deleted successfully',
            'file_deleted': file_deleted,
            'metadata_deleted': metadata_deleted
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Delete error: {str(e)}")
        return jsonify({
            'error': 'Failed to delete note',
            'code': 'DELETE_ERROR',
        }), 500

@files_bp.route('/my-notes', methods=['GET'])
@require_authentication
@track_usage('list')
def get_my_notes(current_user):
    """Get current user's uploaded notes"""
    try:
        limit = int(request.args.get('limit', 100))
        
        firestore_db = get_firestore_db()
        notes = firestore_db.get_notes_by_user(current_user['uid'], limit)
        
        return jsonify({
            'notes': notes,
            'count': len(notes)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get my notes error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve your notes',
            'code': 'FETCH_USER_NOTES_ERROR',
        }), 500

@files_bp.route('/stats', methods=['GET'])
@track_usage('get_metadata')
def get_stats():
    """Get basic statistics about notes and usage"""
    try:
        firestore_db = get_firestore_db()
        
        # Get all notes to calculate stats
        all_notes = firestore_db.get_all_notes(1000)  # Get more for accurate stats
        
        # Calculate statistics
        total_notes = len(all_notes)
        total_downloads = sum(note.get('download_count', 0) for note in all_notes)
        
        # Calculate total file size
        total_size = sum(note.get('file_size', 0) for note in all_notes)
        
        # Get top uploaders (if available)
        uploaders = {}
        for note in all_notes:
            uploader = note.get('uploader', 'Unknown')
            uploaders[uploader] = uploaders.get(uploader, 0) + 1
        
        # Sort by count (descending)
        top_uploaders = sorted(uploaders.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Get usage statistics
        tracker = get_usage_tracker()
        usage_stats = tracker.get_usage_stats()
        near_limits = tracker.is_near_limit()
        
        return jsonify({
            'total_notes': total_notes,
            'total_downloads': total_downloads,
            'total_file_size': total_size,
            'total_file_size_mb': round(total_size / (1024 * 1024), 2),
            'uploaders': {
                'distribution': uploaders,
                'top_5': top_uploaders
            },
            'usage_stats': usage_stats,
            'near_limits': near_limits
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get stats error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve statistics',
            'code': 'STATS_ERROR',
        }), 500

@files_bp.route('/search', methods=['GET'])
@require_authentication_optional
@track_usage('search')
def search_notes(current_user=None):
    """Search notes by title, subject, or uploader"""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({
                'error': 'Search query is required',
                'code': 'MISSING_QUERY'
            }), 400
        
        limit = int(request.args.get('limit', 50))
        
        firestore_db = get_firestore_db()
        notes = firestore_db.search_notes(query, limit)
        
        return jsonify({
            'notes': notes,
            'count': len(notes),
            'query': query,
            'user_authenticated': current_user is not None
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Search error: {str(e)}")
        return jsonify({
            'error': 'Failed to search notes',
            'code': 'SEARCH_ERROR',
        }), 500

@files_bp.route('/note/<note_id>', methods=['GET'])
@require_authentication_optional
@track_usage('get_metadata')
def get_note_details(note_id, current_user=None):
    """Get detailed information about a specific note"""
    try:
        firestore_db = get_firestore_db()
        note = firestore_db.get_note(note_id)
        
        if not note:
            return jsonify({
                'error': 'Note not found',
                'code': 'NOTE_NOT_FOUND'
            }), 404
        
        # Add user permissions
        can_delete = False
        if current_user and note.get('uploaded_by') == current_user['uid']:
            can_delete = True
        
        note['can_delete'] = can_delete
        note['user_authenticated'] = current_user is not None
        
        return jsonify({
            'note': note
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get note details error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve note details',
            'code': 'NOTE_DETAILS_ERROR',
        }), 500

# New endpoint for usage statistics
@files_bp.route('/usage', methods=['GET'])
@require_authentication_optional
@track_usage('get_metadata', check_limits=False) 
def get_usage_info(current_user=None):
    """Get current usage statistics for the application"""
    try:
        tracker = get_usage_tracker()
        usage_stats = tracker.get_usage_stats()
        near_limits = tracker.is_near_limit()
        
        return jsonify({
            'usage_stats': usage_stats,
            'near_limits': near_limits,
            'limits': tracker.LIMITS,
            'month': usage_stats['current_month'],
            'last_reset': usage_stats.get('reset_date')
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get usage info error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve usage information',
            'code': 'USAGE_INFO_ERROR',
        }), 500


# ======================== BULK OPERATIONS ========================

@files_bp.route('/bulk/delete', methods=['POST'])
@require_authentication
@track_usage('delete')
def bulk_delete(current_user):
    """Delete multiple notes at once (max 50)"""
    try:
        data = request.get_json()
        note_ids = data.get('note_ids', [])
        
        if not note_ids:
            return jsonify({'error': 'No note IDs provided'}), 400
        
        if len(note_ids) > 50:
            return jsonify({'error': 'Maximum 50 notes per bulk delete'}), 400
        
        db = get_firestore_db()
        storage = get_storage()
        
        deleted = []
        failed = []
        
        for note_id in note_ids:
            try:
                note = db.get_note(note_id)
                
                if not note:
                    failed.append({'id': note_id, 'reason': 'Note not found'})
                    continue
                
                # Verify ownership
                if note.get('uploaded_by') != current_user['uid']:
                    failed.append({'id': note_id, 'reason': 'Not authorized'})
                    continue
                
                # Delete file from storage
                file_key = note.get('file_key')
                if file_key and storage:
                    try:
                        storage.delete_file(file_key)
                    except Exception as e:
                        logger.warning(f"Failed to delete file {file_key}: {e}")
                
                # Delete from Firestore
                if db.delete_note(note_id):
                    deleted.append(note_id)
                else:
                    failed.append({'id': note_id, 'reason': 'Database delete failed'})
                
            except Exception as e:
                logger.error(f"Failed to delete note {note_id}: {e}")
                failed.append({'id': note_id, 'reason': str(e)})
        
        return jsonify({
            'success': True,
            'deleted': deleted,
            'failed': failed,
            'total_deleted': len(deleted),
            'total_failed': len(failed)
        }), 200
        
    except Exception as e:
        logger.error(f"Bulk delete error: {e}")
        return jsonify({'error': str(e)}), 500


@files_bp.route('/bulk/export', methods=['POST'])
@require_authentication
def bulk_export(current_user):
    """Export multiple notes as ZIP (max 20)"""
    try:
        data = request.get_json()
        note_ids = data.get('note_ids', [])
        
        if not note_ids:
            return jsonify({'error': 'No note IDs provided'}), 400
        
        if len(note_ids) > 20:
            return jsonify({'error': 'Maximum 20 notes per bulk export'}), 400
        
        db = get_firestore_db()
        storage = get_storage()
        
        # Create ZIP file in memory
        memory_file = io.BytesIO()
        
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            exported_count = 0
            
            for note_id in note_ids:
                try:
                    note = db.get_note(note_id)
                    
                    if not note:
                        continue
                    
                    file_key = note.get('file_key')
                    
                    if file_key and storage:
                        # Read file content
                        file_data = storage.read_file(file_key)
                        if file_data:
                            # Add to ZIP with original filename
                            filename = note.get('file_name', f'note_{note_id}.pdf')
                            zf.writestr(filename, file_data)
                            exported_count += 1
                    
                except Exception as e:
                    logger.warning(f"Failed to export note {note_id}: {e}")
                    continue
        
        if exported_count == 0:
            return jsonify({'error': 'No files could be exported'}), 404
        
        # Send ZIP file
        memory_file.seek(0)
        
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name='notes_export.zip'
        )
        
    except Exception as e:
        logger.error(f"Bulk export error: {e}")
        return jsonify({'error': str(e)}), 500
