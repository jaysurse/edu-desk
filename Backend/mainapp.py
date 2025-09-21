from flask import Flask
from flask_cors import CORS
from config import config
import os
from routes.files import files_bp
from utils.auth import initialize_firebase
from utils.firestore_db import initialize_firestore
from utils.storage import initialize_r2_storage


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config[config_name])  # Use the dictionary

    # Initialize CORS
    CORS(app, origins=app.config["CORS_ORIGINS"])

    # Initialize Firebase Admin SDK
    with app.app_context():
        try:
            initialize_firebase()
            print("✅ Firebase Admin SDK initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize Firebase Admin SDK: {e}")
            print("⚠️  Authentication features will not work!")
            # Uncomment to exit if Firebase is critical
            # import sys
            # sys.exit(1)

    # Initialize Firestore
    with app.app_context():
        try:
            initialize_firestore()
            print("✅ Firestore database initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize Firestore: {e}")
            print("⚠️  Database features will not work!")
            # Uncomment to exit if Firestore is critical
            # import sys
            # sys.exit(1)

    # Initialize Cloudflare R2 Storage
    with app.app_context():
        try:
            initialize_r2_storage()
            print("✅ Cloudflare R2 storage initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize R2 storage: {e}")
            print("⚠️  File upload/download features will not work!")
            # Uncomment to exit if R2 is critical
            # import sys
            # sys.exit(1)

    # Register blueprints
    app.register_blueprint(files_bp, url_prefix="/api/files")

    # Health check endpoint
    @app.route("/health")
    def health_check():
        return {
            "status": "healthy",
            "message": "Notes API is running",
            "services": {
                "firebase": "initialized",
                "firestore": "initialized",
                "r2_storage": "initialized",
            },
        }, 200

    # Enhanced health check with service status
    @app.route("/api/health/detailed")
    def detailed_health_check():
        from utils.auth import get_firebase_app
        from utils.firestore_db import get_firestore_db
        from utils.storage import get_r2_storage

        services = {}
        overall_status = "healthy"

        # Check Firebase
        try:
            firebase_app = get_firebase_app()
            services["firebase"] = "connected" if firebase_app else "disconnected"
        except Exception as e:
            services["firebase"] = f"error: {str(e)}"
            overall_status = "degraded"

        # Check Firestore
        try:
            firestore_db = get_firestore_db()
            # Try a simple operation
            firestore_db.get_all_notes(limit=1)
            services["firestore"] = "connected"
        except Exception as e:
            services["firestore"] = f"error: {str(e)}"
            overall_status = "degraded"

        # Check R2 Storage
        try:
            r2_storage = get_r2_storage()
            services["r2_storage"] = "connected" if r2_storage else "disconnected"
        except Exception as e:
            services["r2_storage"] = f"error: {str(e)}"
            overall_status = "degraded"

        return {
            "status": overall_status,
            "message": f"Notes API is {overall_status}",
            "services": services,
            "timestamp": app.config.get("START_TIME", "unknown"),
        }, (200 if overall_status == "healthy" else 503)

    # Test authentication endpoint
    @app.route("/api/test-auth")
    def test_auth():
        from utils.auth import require_authentication

        @require_authentication
        def _test_auth(current_user):
            return {
                "status": "authenticated",
                "user": {
                    "uid": current_user["uid"],
                    "email": current_user.get("email"),
                    "name": current_user.get(
                        "name", current_user.get("email", "Unknown")
                    ),
                    "email_verified": current_user.get("email_verified", False),
                },
                "message": "Authentication successful",
            }, 200

        return _test_auth()

    # Test Firestore connection
    @app.route("/api/test-firestore")
    def test_firestore():
        try:
            from utils.firestore_db import get_firestore_db

            firestore_db = get_firestore_db()

            # Try to get notes count
            notes = firestore_db.get_all_notes(limit=1)

            return {
                "status": "connected",
                "message": "Firestore connection successful",
                "sample_query": f"Found {len(notes)} notes (limited to 1)",
            }, 200

        except Exception as e:
            return {
                "status": "error",
                "message": "Firestore connection failed",
                "error": str(e),
            }, 500

    # Test R2 storage connection
    @app.route("/api/test-r2")
    def test_r2():
        try:
            from utils.storage import get_r2_storage

            r2_storage = get_r2_storage()

            # Test the connection using the test_connection method
            connection_test = r2_storage.test_connection()

            if connection_test:
                return {
                    "status": "connected",
                    "message": "R2 storage connection successful",
                    "bucket": r2_storage.bucket_name,
                    "endpoint": r2_storage.endpoint_url,
                }, 200
            else:
                return {
                    "status": "error",
                    "message": "R2 storage connection test failed",
                    "bucket": r2_storage.bucket_name,
                }, 503

        except Exception as e:
            return {
                "status": "error",
                "message": "R2 storage connection failed",
                "error": str(e),
            }, 500

    # API information endpoint
    @app.route("/api/info")
    def api_info():
        return {
            "api_name": "Notes Sharing API",
            "version": "2.0",
            "description": "API for uploading, sharing, and managing academic notes",
            "features": [
                "File upload to Cloudflare R2",
                "Firebase authentication",
                "Firestore database",
                "Note sharing and search",
                "User management",
                "Download tracking",
            ],
            "endpoints": {
                "health": "/health",
                "detailed_health": "/api/health/detailed",
                "upload": "/api/files/upload",
                "notes": "/api/files/notes",
                "download": "/api/files/download/<note_id>",
                "my_notes": "/api/files/my-notes",
                "search": "/api/files/search",
                "stats": "/api/files/stats",
                "subjects": "/api/files/subjects",
                "departments": "/api/files/departments",
            },
        }, 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {
            "error": "Endpoint not found",
            "message": "The requested resource does not exist",
            "code": "NOT_FOUND",
        }, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "code": "INTERNAL_ERROR",
        }, 500

    @app.errorhandler(403)
    def forbidden(error):
        return {
            "error": "Access forbidden",
            "message": "You do not have permission to access this resource",
            "code": "FORBIDDEN",
        }, 403

    @app.errorhandler(401)
    def unauthorized(error):
        return {
            "error": "Unauthorized",
            "message": "Authentication required",
            "code": "UNAUTHORIZED",
        }, 401

    # Store start time for health checks
    import datetime

    app.config["START_TIME"] = datetime.datetime.now().isoformat()

    print("🚀 Notes API application created successfully!")
    print("📋 Available endpoints:")
    print("   • GET  /health - Basic health check")
    print("   • GET  /api/health/detailed - Detailed health check")
    print("   • GET  /api/info - API information")
    print("   • POST /api/files/upload - Upload file")
    print("   • GET  /api/files/notes - Get all notes")
    print("   • GET  /api/files/my-notes - Get user's notes")
    print("   • GET  /api/files/download/<id> - Download file")
    print("   • GET  /api/files/search - Search notes")
    print("   • GET  /api/files/stats - Get statistics")

    return app

app = create_app()

if __name__ == "__main__":
    app = create_app()
    print(f"🌐 Starting development server on http://localhost:5000")
    app.run(debug=True, port=5000, host="0.0.0.0")
