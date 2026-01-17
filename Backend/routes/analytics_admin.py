# Backend/routes/analytics_admin.py
from flask import Blueprint, request, jsonify, current_app
from utils.auth import require_authentication
from utils.analytics import AnalyticsDB
from utils.firestore_db import get_firestore_db
from utils.user_profiles import UserProfilesDB
from utils.usage_db import track_usage, get_usage_tracker
from utils.ratings_comments import RatingsCommentsDB

analytics_bp = Blueprint('analytics', __name__)

def get_analytics_db():
    if not hasattr(current_app, 'analytics_db'):
        current_app.analytics_db = AnalyticsDB()
    return current_app.analytics_db

def get_user_profiles_db():
    if not hasattr(current_app, 'user_profiles_db'):
        current_app.user_profiles_db = UserProfilesDB()
    return current_app.user_profiles_db

def get_ratings_db():
    if not hasattr(current_app, 'ratings_db'):
        current_app.ratings_db = RatingsCommentsDB()
    return current_app.ratings_db

# ======================== PUBLIC ANALYTICS ========================

@analytics_bp.route('/stats/popular', methods=['GET'])
@track_usage('get_metadata')
def get_popular_notes():
    """Get most popular (downloaded) notes"""
    try:
        days = int(request.args.get('days', 7))
        limit = int(request.args.get('limit', 10))
        analytics_db = get_analytics_db()
        popular_notes = analytics_db.get_popular_notes(days, limit)
        return jsonify({
            "success": True,
            "data": {
                'popular_notes': popular_notes,
                'count': len(popular_notes),
                'period_days': days
            },
            "error": None
        }), 200
    except Exception as e:
        current_app.logger.error(f"Get popular notes error: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Failed to retrieve popular notes"
        }), 500

@analytics_bp.route('/stats/trending', methods=['GET'])
@track_usage('get_metadata')
def get_trending_notes():
    """Get trending notes based on recent activity"""
    try:
        limit = int(request.args.get('limit', 5))
        
        firestore_db = get_firestore_db()
        all_notes = firestore_db.get_all_notes(limit=100)
        
        # Sort by download count descending
        trending = sorted(all_notes, key=lambda x: x.get('download_count', 0), reverse=True)[:limit]
        
        return jsonify({
            "success": True,
            "data": {
                'trending_notes': trending,
                'count': len(trending)
            },
            "error": None
        }), 200
    except Exception as e:
        current_app.logger.error(f"Get trending notes error: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Failed to retrieve trending notes"
        }), 500

@analytics_bp.route('/stats/subjects', methods=['GET'])
@track_usage('get_metadata')
def get_subject_stats():
    """Get statistics by subject"""
    try:
        analytics_db = get_analytics_db()
        subject_stats = analytics_db.get_subject_statistics()
        
        return jsonify({
            "success": True,
            "data": {
                'subjects': subject_stats,
                'count': len(subject_stats)
            },
            "error": None
        }), 200
    except Exception as e:
        current_app.logger.error(f"Get subject stats error: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Failed to retrieve subject statistics"
        }), 500

@analytics_bp.route('/stats/departments', methods=['GET'])
@track_usage('get_metadata')
def get_department_stats():
    """Get statistics by department"""
    try:
        analytics_db = get_analytics_db()
        dept_stats = analytics_db.get_department_statistics()
        
        return jsonify({
            "success": True,
            "data": {
                'departments': dept_stats,
                'count': len(dept_stats)
            },
            "error": None
        }), 200
    except Exception as e:
        current_app.logger.error(f"Get department stats error: {str(e)}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Failed to retrieve department statistics"
        }), 500

# ======================== ADMIN DASHBOARD ========================

@analytics_bp.route('/admin/dashboard', methods=['GET'])
@require_authentication
@track_usage('get_metadata')
def get_admin_dashboard(current_user):
    """Get comprehensive admin dashboard statistics"""
    try:
        # Verify user is admin (you can implement admin check here)
        analytics_db = get_analytics_db()
        stats = analytics_db.get_admin_dashboard_stats()
        
        # Add usage limits info
        tracker = get_usage_tracker()
        usage_stats = tracker.get_usage_stats()
        
        stats['usage_stats'] = usage_stats
        stats['timestamp'] = __import__('datetime').datetime.now().isoformat()
        
        return jsonify(stats), 200
        
    except Exception as e:
        current_app.logger.error(f"Get admin dashboard error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve admin dashboard',
            'code': 'ADMIN_ERROR'
        }), 500

@analytics_bp.route('/admin/users', methods=['GET'])
@require_authentication
@track_usage('get_metadata')
def get_users_list(current_user):
    """Get list of users with stats"""
    try:
        from utils.firestore_db import get_firestore_db
        firestore_db = get_firestore_db()
        
        # Get all notes to build user stats
        all_notes = firestore_db.get_all_notes(limit=1000)
        
        user_stats = {}
        for note in all_notes:
            uploader = note.get('uploaded_by')
            if uploader not in user_stats:
                user_stats[uploader] = {
                    'user_id': uploader,
                    'uploads': 0,
                    'downloads': 0,
                    'total_file_size': 0
                }
            
            user_stats[uploader]['uploads'] += 1
            user_stats[uploader]['downloads'] += note.get('download_count', 0)
            user_stats[uploader]['total_file_size'] += note.get('file_size', 0)
        
        users_list = list(user_stats.values())
        
        return jsonify({
            'users': users_list,
            'count': len(users_list)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get users list error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve users list',
            'code': 'USERS_ERROR'
        }), 500

@analytics_bp.route('/admin/notes', methods=['GET'])
@require_authentication
@track_usage('get_metadata')
def get_notes_list(current_user):
    """Get list of all notes with stats"""
    try:
        limit = int(request.args.get('limit', 100))
        sort_by = request.args.get('sort_by', 'created_at')
        
        firestore_db = get_firestore_db()
        all_notes = firestore_db.get_all_notes(limit=limit)
        
        # Sort notes
        if sort_by == 'downloads':
            all_notes.sort(key=lambda x: x.get('download_count', 0), reverse=True)
        elif sort_by == 'size':
            all_notes.sort(key=lambda x: x.get('file_size', 0), reverse=True)
        
        return jsonify({
            'notes': all_notes,
            'count': len(all_notes),
            'sorted_by': sort_by
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get notes list error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve notes list',
            'code': 'NOTES_ERROR'
        }), 500

@analytics_bp.route('/admin/content-moderation', methods=['GET'])
@require_authentication
@track_usage('get_metadata')
def get_flagged_content(current_user):
    """Get flagged content for moderation"""
    try:
        from firebase_admin import firestore
        from utils.firestore_db import get_firestore_db
        
        firestore_db = get_firestore_db()
        db = firestore.client()
        
        # Get flagged notes
        flagged_docs = db.collection('flagged_content').stream()
        flagged = []
        
        for doc in flagged_docs:
            flag_data = doc.to_dict()
            note_id = flag_data.get('note_id')
            note = firestore_db.get_note(note_id)
            if note:
                flag_data['note'] = note
            flagged.append(flag_data)
        
        return jsonify({
            'flagged_content': flagged,
            'count': len(flagged)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get flagged content error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve flagged content',
            'code': 'MODERATION_ERROR'
        }), 500

# ======================== USER ANALYTICS ========================

@analytics_bp.route('/users/<user_id>/stats', methods=['GET'])
@track_usage('get_metadata')
def get_user_stats(user_id):
    """Get statistics for a specific user"""
    try:
        firestore_db = get_firestore_db()
        user_notes = firestore_db.get_notes_by_user(user_id, limit=1000)
        
        total_downloads = sum(note.get('download_count', 0) for note in user_notes)
        total_size = sum(note.get('file_size', 0) for note in user_notes)
        avg_rating = 0
        
        # Calculate average rating for all user's notes
        if user_notes:
            ratings_db = get_ratings_db()
            ratings_list = []
            for note in user_notes:
                rating_stats = ratings_db.get_note_ratings(note['id'])
                if rating_stats['average'] > 0:
                    ratings_list.append(rating_stats['average'])
            
            if ratings_list:
                avg_rating = round(sum(ratings_list) / len(ratings_list), 2)
        
        user_profiles_db = get_user_profiles_db()
        profile = user_profiles_db.get_user_profile(user_id)
        
        return jsonify({
            'user_id': user_id,
            'total_uploads': len(user_notes),
            'total_downloads_received': total_downloads,
            'total_file_size_mb': round(total_size / (1024 * 1024), 2),
            'average_rating': avg_rating,
            'profile': profile
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get user stats error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve user statistics',
            'code': 'USER_STATS_ERROR'
        }), 500

# ======================== NOTE ANALYTICS ========================

@analytics_bp.route('/notes/<note_id>/stats', methods=['GET'])
@track_usage('get_metadata')
def get_note_stats(note_id):
    """Get statistics for a specific note"""
    try:
        firestore_db = get_firestore_db()
        note = firestore_db.get_note(note_id)
        
        if not note:
            return jsonify({
                'error': 'Note not found',
                'code': 'NOTE_NOT_FOUND'
            }), 404
        
        ratings_db = get_ratings_db()
        ratings_stats = ratings_db.get_note_ratings(note_id)
        
        comments = ratings_db.get_note_comments(note_id, limit=1000)
        
        return jsonify({
            'note_id': note_id,
            'downloads': note.get('download_count', 0),
            'file_size_mb': round(note.get('file_size', 0) / (1024 * 1024), 2),
            'created_at': note.get('created_at'),
            'ratings': ratings_stats,
            'comments_count': len(comments),
            'subject': note.get('subject'),
            'department': note.get('department')
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get note stats error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve note statistics',
            'code': 'NOTE_STATS_ERROR'
        }), 500

# ======================== CONTENT FLAGGING ========================

@analytics_bp.route('/notes/<note_id>/flag', methods=['POST'])
@track_usage('flag')
def flag_content(note_id):
    """Flag a note for inappropriate content"""
    try:
        data = request.get_json()
        reason = data.get('reason', '')
        
        if not reason.strip():
            return jsonify({
                'error': 'Reason is required',
                'code': 'MISSING_REASON'
            }), 400
        
        firestore_db = get_firestore_db()
        note = firestore_db.get_note(note_id)
        
        if not note:
            return jsonify({
                'error': 'Note not found',
                'code': 'NOTE_NOT_FOUND'
            }), 404
        
        from firebase_admin import firestore
        db = firestore.client()
        
        flag_id = f"{note_id}_{__import__('uuid').uuid4().hex[:8]}"
        flag_data = {
            'flag_id': flag_id,
            'note_id': note_id,
            'reason': reason,
            'flagged_at': firestore.SERVER_TIMESTAMP,
            'status': 'pending'
        }
        
        db.collection('flagged_content').document(flag_id).set(flag_data)
        
        return jsonify({
            'message': 'Content flagged for review',
            'flag_id': flag_id
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Flag content error: {str(e)}")
        return jsonify({
            'error': 'Failed to flag content',
            'code': 'FLAG_ERROR'
        }), 500
