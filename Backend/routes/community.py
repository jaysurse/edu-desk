# Backend/routes/community.py
from flask import Blueprint, request, jsonify, current_app
from utils.auth import require_authentication, require_authentication_optional
from utils.ratings_comments import RatingsCommentsDB
from utils.user_profiles import UserProfilesDB
from utils.favorites import FavoritesDB
from utils.firestore_db import get_firestore_db
from utils.analytics import AnalyticsDB
from utils.usage_db import track_usage
from utils.security import ContentValidator, rate_limit

community_bp = Blueprint('community', __name__)

# Initialize database instances
def get_ratings_db():
    if not hasattr(current_app, 'ratings_db'):
        current_app.ratings_db = RatingsCommentsDB()
    return current_app.ratings_db

def get_user_profiles_db():
    if not hasattr(current_app, 'user_profiles_db'):
        current_app.user_profiles_db = UserProfilesDB()
    return current_app.user_profiles_db

def get_favorites_db():
    if not hasattr(current_app, 'favorites_db'):
        current_app.favorites_db = FavoritesDB()
    return current_app.favorites_db

def get_analytics_db():
    if not hasattr(current_app, 'analytics_db'):
        current_app.analytics_db = AnalyticsDB()
    return current_app.analytics_db

# ======================== RATINGS ========================

@community_bp.route('/notes/<note_id>/rate', methods=['POST'])
@require_authentication
@track_usage('rate')
def rate_note(current_user, note_id):
    """Add or update rating for a note"""
    try:
        data = request.get_json()
        rating = data.get('rating')
        
        if not isinstance(rating, int) or not 1 <= rating <= 5:
            return jsonify({
                'error': 'Rating must be an integer between 1 and 5',
                'code': 'INVALID_RATING'
            }), 400
        
        # Check if note exists
        firestore_db = get_firestore_db()
        note = firestore_db.get_note(note_id)
        if not note:
            return jsonify({
                'error': 'Note not found',
                'code': 'NOTE_NOT_FOUND'
            }), 404
        
        ratings_db = get_ratings_db()
        ratings_db.add_rating(note_id, current_user['uid'], rating, current_user.get('email'))
        
        # Update analytics
        analytics_db = get_analytics_db()
        analytics_db.track_action('rate', current_user['uid'], note_id, {'rating': rating})
        
        # Get updated ratings
        ratings_stats = ratings_db.get_note_ratings(note_id)
        
        return jsonify({
            'message': 'Rating added successfully',
            'ratings': ratings_stats
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Rate note error: {str(e)}")
        return jsonify({
            'error': 'Failed to rate note',
            'code': 'RATING_ERROR'
        }), 500

@community_bp.route('/notes/<note_id>/ratings', methods=['GET'])
@track_usage('get_metadata')
def get_note_ratings(note_id):
    """Get ratings statistics for a note"""
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
        
        return jsonify(ratings_stats), 200
        
    except Exception as e:
        current_app.logger.error(f"Get ratings error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve ratings',
            'code': 'RATINGS_ERROR'
        }), 500

# ======================== COMMENTS ========================

@community_bp.route('/notes/<note_id>/comments', methods=['POST'])
@require_authentication
@rate_limit(max_requests=50, window_seconds=3600)
@track_usage('comment')
def add_comment(current_user, note_id):
    """Add a comment to a note"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        # Validate comment
        is_valid, error_msg = ContentValidator.validate_comment(text)
        if not is_valid:
            return jsonify({
                'error': error_msg,
                'code': 'INVALID_COMMENT'
            }), 400
        
        # Check if note exists
        firestore_db = get_firestore_db()
        note = firestore_db.get_note(note_id)
        if not note:
            return jsonify({
                'error': 'Note not found',
                'code': 'NOTE_NOT_FOUND'
            }), 404
        
        ratings_db = get_ratings_db()
        comment_id = ratings_db.add_comment(
            note_id,
            current_user['uid'],
            current_user.get('email'),
            current_user.get('name', 'Anonymous'),
            text
        )
        
        if not comment_id:
            return jsonify({
                'error': 'Failed to add comment',
                'code': 'COMMENT_ERROR'
            }), 500
        
        return jsonify({
            'message': 'Comment added successfully',
            'comment_id': comment_id
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Add comment error: {str(e)}")
        return jsonify({
            'error': 'Failed to add comment',
            'code': 'COMMENT_ERROR'
        }), 500

@community_bp.route('/notes/<note_id>/comments', methods=['GET'])
@track_usage('get_metadata')
def get_comments(note_id):
    """Get all comments for a note"""
    try:
        limit = int(request.args.get('limit', 50))
        
        firestore_db = get_firestore_db()
        note = firestore_db.get_note(note_id)
        if not note:
            return jsonify({
                'error': 'Note not found',
                'code': 'NOTE_NOT_FOUND'
            }), 404
        
        ratings_db = get_ratings_db()
        comments = ratings_db.get_note_comments(note_id, limit)
        
        return jsonify({
            'comments': comments,
            'count': len(comments)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get comments error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve comments',
            'code': 'COMMENTS_ERROR'
        }), 500

@community_bp.route('/comments/<comment_id>', methods=['DELETE'])
@require_authentication
@track_usage('delete')
def delete_comment(current_user, comment_id):
    """Delete a comment"""
    try:
        ratings_db = get_ratings_db()
        success = ratings_db.delete_comment(comment_id, current_user['uid'])
        
        if not success:
            return jsonify({
                'error': 'Comment not found or unauthorized',
                'code': 'UNAUTHORIZED_DELETE'
            }), 403
        
        return jsonify({'message': 'Comment deleted successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Delete comment error: {str(e)}")
        return jsonify({
            'error': 'Failed to delete comment',
            'code': 'DELETE_ERROR'
        }), 500

@community_bp.route('/comments/<comment_id>/like', methods=['POST'])
@track_usage('like')
def like_comment(comment_id):
    """Like a comment"""
    try:
        ratings_db = get_ratings_db()
        success = ratings_db.like_comment(comment_id)
        
        if not success:
            return jsonify({
                'error': 'Failed to like comment',
                'code': 'LIKE_ERROR'
            }), 500
        
        return jsonify({'message': 'Comment liked'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Like comment error: {str(e)}")
        return jsonify({
            'error': 'Failed to like comment',
            'code': 'LIKE_ERROR'
        }), 500

# ======================== USER PROFILES ========================

@community_bp.route('/users/<user_id>/profile', methods=['GET'])
@track_usage('get_metadata')
def get_user_profile(user_id):
    """Get user profile"""
    try:
        user_profiles_db = get_user_profiles_db()
        profile = user_profiles_db.get_user_profile(user_id)
        
        if not profile:
            return jsonify({
                'error': 'User profile not found',
                'code': 'USER_NOT_FOUND'
            }), 404
        
        # Get user's notes
        firestore_db = get_firestore_db()
        user_notes = firestore_db.get_notes_by_user(user_id, limit=10)
        profile['recent_notes'] = user_notes
        
        return jsonify(profile), 200
        
    except Exception as e:
        current_app.logger.error(f"Get user profile error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve user profile',
            'code': 'PROFILE_ERROR'
        }), 500

@community_bp.route('/users/me/profile', methods=['GET'])
@require_authentication
@track_usage('get_metadata')
def get_current_user_profile(current_user):
    """Get current user's profile"""
    return get_user_profile(current_user['uid'])

@community_bp.route('/users/me/profile', methods=['PUT'])
@require_authentication
@track_usage('update')
def update_user_profile(current_user):
    """Update current user's profile"""
    try:
        data = request.get_json()
        
        user_profiles_db = get_user_profiles_db()
        user_profiles_db.create_or_update_profile(current_user['uid'], {
            'email': current_user.get('email'),
            'name': data.get('name', current_user.get('name', '')),
            'photo_url': data.get('photo_url', ''),
            'bio': data.get('bio', '')
        })
        
        profile = user_profiles_db.get_user_profile(current_user['uid'])
        return jsonify(profile), 200
        
    except Exception as e:
        current_app.logger.error(f"Update profile error: {str(e)}")
        return jsonify({
            'error': 'Failed to update profile',
            'code': 'UPDATE_ERROR'
        }), 500

@community_bp.route('/users/top-uploaders', methods=['GET'])
@track_usage('get_metadata')
def get_top_uploaders():
    """Get top uploaders"""
    try:
        limit = int(request.args.get('limit', 10))
        
        user_profiles_db = get_user_profiles_db()
        uploaders = user_profiles_db.get_top_uploaders(limit)
        
        return jsonify({
            'uploaders': uploaders,
            'count': len(uploaders)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get top uploaders error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve top uploaders',
            'code': 'UPLOADERS_ERROR'
        }), 500

# ======================== FAVORITES ========================

@community_bp.route('/favorites', methods=['POST'])
@require_authentication
@track_usage('favorite')
def add_to_favorites(current_user):
    """Add note to favorites"""
    try:
        data = request.get_json()
        note_id = data.get('note_id')
        
        if not note_id:
            return jsonify({
                'error': 'Note ID is required',
                'code': 'MISSING_NOTE_ID'
            }), 400
        
        # Check if note exists
        firestore_db = get_firestore_db()
        note = firestore_db.get_note(note_id)
        if not note:
            return jsonify({
                'error': 'Note not found',
                'code': 'NOTE_NOT_FOUND'
            }), 404
        
        favorites_db = get_favorites_db()
        favorites_db.add_to_favorites(current_user['uid'], note_id)
        
        return jsonify({'message': 'Added to favorites'}), 201
        
    except Exception as e:
        current_app.logger.error(f"Add to favorites error: {str(e)}")
        return jsonify({
            'error': 'Failed to add to favorites',
            'code': 'FAVORITE_ERROR'
        }), 500

@community_bp.route('/favorites/<note_id>', methods=['DELETE'])
@require_authentication
@track_usage('unfavorite')
def remove_from_favorites(current_user, note_id):
    """Remove note from favorites"""
    try:
        favorites_db = get_favorites_db()
        favorites_db.remove_from_favorites(current_user['uid'], note_id)
        
        return jsonify({'message': 'Removed from favorites'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Remove from favorites error: {str(e)}")
        return jsonify({
            'error': 'Failed to remove from favorites',
            'code': 'FAVORITE_ERROR'
        }), 500

@community_bp.route('/favorites', methods=['GET'])
@require_authentication
@track_usage('get_metadata')
def get_favorites(current_user):
    """Get user's favorite notes"""
    try:
        limit = int(request.args.get('limit', 100))
        
        favorites_db = get_favorites_db()
        favorite_note_ids = favorites_db.get_user_favorites(current_user['uid'], limit)
        
        # Get full note details
        firestore_db = get_firestore_db()
        favorites = []
        for note_id in favorite_note_ids:
            note = firestore_db.get_note(note_id)
            if note:
                favorites.append(note)
        
        return jsonify({
            'favorites': favorites,
            'count': len(favorites)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get favorites error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve favorites',
            'code': 'FAVORITES_ERROR'
        }), 500

@community_bp.route('/favorites/<note_id>/check', methods=['GET'])
@require_authentication
def check_favorite(current_user, note_id):
    """Check if note is favorited"""
    try:
        favorites_db = get_favorites_db()
        is_favorited = favorites_db.is_favorited(current_user['uid'], note_id)
        
        return jsonify({'is_favorited': is_favorited}), 200
        
    except Exception as e:
        current_app.logger.error(f"Check favorite error: {str(e)}")
        return jsonify({
            'error': 'Failed to check favorite status',
            'code': 'FAVORITE_ERROR'
        }), 500

# ======================== COLLECTIONS ========================

@community_bp.route('/collections', methods=['POST'])
@require_authentication
@track_usage('create_collection')
def create_collection(current_user):
    """Create a new collection"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '')
        
        if not name:
            return jsonify({
                'error': 'Collection name is required',
                'code': 'MISSING_NAME'
            }), 400
        
        favorites_db = get_favorites_db()
        collection_id = favorites_db.create_collection(current_user['uid'], name, description)
        
        if not collection_id:
            return jsonify({
                'error': 'Failed to create collection',
                'code': 'CREATION_ERROR'
            }), 500
        
        return jsonify({
            'message': 'Collection created successfully',
            'collection_id': collection_id
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Create collection error: {str(e)}")
        return jsonify({
            'error': 'Failed to create collection',
            'code': 'COLLECTION_ERROR'
        }), 500

@community_bp.route('/collections', methods=['GET'])
@require_authentication
@track_usage('get_metadata')
def get_user_collections(current_user):
    """Get user's collections"""
    try:
        favorites_db = get_favorites_db()
        collections = favorites_db.get_user_collections(current_user['uid'])
        
        return jsonify({
            'collections': collections,
            'count': len(collections)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get collections error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve collections',
            'code': 'COLLECTIONS_ERROR'
        }), 500

@community_bp.route('/collections/<collection_id>/notes', methods=['POST'])
@require_authentication
@track_usage('add_to_collection')
def add_note_to_collection(current_user, collection_id):
    """Add note to collection"""
    try:
        data = request.get_json()
        note_id = data.get('note_id')
        
        if not note_id:
            return jsonify({
                'error': 'Note ID is required',
                'code': 'MISSING_NOTE_ID'
            }), 400
        
        favorites_db = get_favorites_db()
        success = favorites_db.add_note_to_collection(collection_id, note_id, current_user['uid'])
        
        if not success:
            return jsonify({
                'error': 'Failed to add note to collection',
                'code': 'ADD_ERROR'
            }), 400
        
        return jsonify({'message': 'Note added to collection'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Add note to collection error: {str(e)}")
        return jsonify({
            'error': 'Failed to add note to collection',
            'code': 'COLLECTION_ERROR'
        }), 500

@community_bp.route('/collections/<collection_id>/notes/<note_id>', methods=['DELETE'])
@require_authentication
@track_usage('remove_from_collection')
def remove_note_from_collection(current_user, collection_id, note_id):
    """Remove note from collection"""
    try:
        favorites_db = get_favorites_db()
        success = favorites_db.remove_note_from_collection(collection_id, note_id, current_user['uid'])
        
        if not success:
            return jsonify({
                'error': 'Failed to remove note from collection',
                'code': 'REMOVE_ERROR'
            }), 400
        
        return jsonify({'message': 'Note removed from collection'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Remove note from collection error: {str(e)}")
        return jsonify({
            'error': 'Failed to remove note from collection',
            'code': 'COLLECTION_ERROR'
        }), 500

@community_bp.route('/collections/<collection_id>', methods=['DELETE'])
@require_authentication
@track_usage('delete_collection')
def delete_collection(current_user, collection_id):
    """Delete a collection"""
    try:
        favorites_db = get_favorites_db()
        success = favorites_db.delete_collection(collection_id, current_user['uid'])
        
        if not success:
            return jsonify({
                'error': 'Collection not found or unauthorized',
                'code': 'NOT_FOUND'
            }), 404
        
        return jsonify({'message': 'Collection deleted successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Delete collection error: {str(e)}")
        return jsonify({
            'error': 'Failed to delete collection',
            'code': 'DELETE_ERROR'
        }), 500
