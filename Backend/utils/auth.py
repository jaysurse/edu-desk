import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps
from flask import request, jsonify, current_app
import os
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK 
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    if not firebase_admin._apps:
        # Try file-based credentials first
        cred_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'firebase-service-account-key.json')
        
        if os.path.exists(cred_path):
            logger.info("Using Firebase credentials from service account file")
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # Alternative: Use environment variables
            logger.info("File-based credentials not found, trying environment variables...")
            
            firebase_env_vars = [
                "FIREBASE_TYPE", "FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY_ID",
                "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL", "FIREBASE_CLIENT_ID",
                "FIREBASE_AUTH_URI", "FIREBASE_TOKEN_URI", 
                "FIREBASE_AUTH_PROVIDER_X509_CERT_URL", "FIREBASE_CLIENT_X509_CERT_URL"
            ]
            
            missing_vars = []
            for var in firebase_env_vars:
                if not os.environ.get(var):
                    missing_vars.append(var)
            
            if missing_vars:
                if current_app and current_app.debug:
                    logger.error(f"Missing environment variables: {missing_vars}")
                else:
                    logger.error("Missing required Firebase environment variables")
                raise ValueError("Missing required Firebase environment variables")
            
            try:
                cred = credentials.Certificate({
                    "type": os.environ.get("FIREBASE_TYPE"),
                    "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
                    "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
                    "private_key": os.environ.get("FIREBASE_PRIVATE_KEY").replace('\\n', '\n') if os.environ.get("FIREBASE_PRIVATE_KEY") else None,
                    "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
                    "auth_uri": os.environ.get("FIREBASE_AUTH_URI"),
                    "token_uri": os.environ.get("FIREBASE_TOKEN_URI"),
                    "auth_provider_x509_cert_url": os.environ.get("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
                    "client_x509_cert_url": os.environ.get("FIREBASE_CLIENT_X509_CERT_URL")
                })
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized successfully with environment variables")
            except Exception as e:
                logger.error("Failed to initialize Firebase Admin SDK")
                if current_app and current_app.debug:
                    logger.error(f"Firebase initialization error: {e}")
                logger.error("Please ensure you have the service account key file or environment variables set up")
                raise
    else:
        logger.info("Firebase Admin SDK already initialized")

def verify_firebase_token(id_token):
    """
    Verify a Firebase ID token and return the decoded token
    """
    try:
        # Check if Firebase is initialized
        if not firebase_admin._apps:
            logger.error("Firebase Admin SDK not initialized!")
            return None
            
        # Verify the ID token
        decoded_token = auth.verify_id_token(id_token)
        logger.debug("Token verified successfully")
        return decoded_token
    except auth.InvalidIdTokenError as e:
        logger.warning("Invalid ID token provided")
        return None
    except auth.ExpiredIdTokenError as e:
        logger.warning("Expired ID token provided")
        return None
    except Exception as e:
        logger.error("Error verifying Firebase token")
        if current_app and current_app.debug:
            logger.error(f"Token verification error: {e}")
        return None

def get_token_from_header():
    """
    Extract the Firebase ID token from the Authorization header
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        logger.debug("No Authorization header found")
        return None
    
    # Expected format: "Bearer <token>"
    try:
        parts = auth_header.split(' ', 1)
        if len(parts) != 2:
            logger.warning("Invalid Authorization header format")
            return None
            
        bearer, token = parts
        if bearer.lower() != 'bearer':
            logger.warning(f"Invalid bearer token format. Expected 'Bearer', got: {bearer}")
            return None
            
        logger.debug("Token extracted successfully")
        return token
    except ValueError as e:
        logger.error("Error parsing Authorization header")
        return None

def require_authentication(f):
    """
    Decorator to require Firebase authentication for a route
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        logger.debug("Performing authentication check")
        id_token = get_token_from_header()
        if not id_token:
            logger.info("Authentication failed: No token provided")
            return jsonify({
                "success": False,
                "data": None,
                "error": "No authentication token provided"
            }), 401
        decoded_token = verify_firebase_token(id_token)
        if not decoded_token:
            logger.info("Authentication failed: Invalid token")
            return jsonify({
                "success": False,
                "data": None,
                "error": "Invalid or expired authentication token"
            }), 401
        logger.debug("Authentication successful")
        return f(current_user=decoded_token, *args, **kwargs)
    return decorated_function

def require_authentication_optional(f):
    """
    Decorator that provides user info if authenticated, but doesn't require it
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from request
        id_token = get_token_from_header()
        current_user = None
        
        if id_token:
            # Try to verify token, but don't fail if it's invalid
            current_user = verify_firebase_token(id_token)
            if current_user:
                logger.debug("Optional authentication successful")
            else:
                logger.debug("Optional authentication failed - continuing without auth")
        
        # Call the original function with current_user (None if not authenticated)
        return f(current_user=current_user, *args, **kwargs)
    
    return decorated_function

def get_user_info(user_id):
    """
    Get additional user information from Firebase Auth
    """
    try:
        user_record = auth.get_user(user_id)
        return {
            'uid': user_record.uid,
            'email': user_record.email,
            'display_name': user_record.display_name,
            'email_verified': user_record.email_verified,
            'disabled': user_record.disabled,
            'created_at': user_record.user_metadata.creation_timestamp,
            'last_sign_in': user_record.user_metadata.last_sign_in_timestamp
        }
    except auth.UserNotFoundError:
        # SECURITY FIX: Don't log user ID in error message
        logger.warning("Requested user not found")
        return None
    except Exception as e:
        logger.error("Error getting user info")
        # SECURITY FIX: Only log detailed error in debug mode
        if current_app and current_app.debug:
            logger.error(f"Get user info error: {e}")
        return None

logger.info("Auth module loaded - call initialize_firebase() from your main app")
