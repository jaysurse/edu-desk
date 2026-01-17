import os
from dotenv import load_dotenv

# Load environment variables from .env file (only for local development)
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(24)

    # File upload settings (PDF only, max size from env)
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_UPLOAD_SIZE_MB', 10)) * 1024 * 1024  # Default 10MB
    ALLOWED_EXTENSIONS = {os.environ.get('ALLOWED_UPLOAD_TYPE', 'application/pdf').split('/')[-1]}  # Only 'pdf' by default

    # Firebase settings
    FIREBASE_CREDENTIALS_PATH = os.environ.get('FIREBASE_CREDENTIALS_PATH')
    FIREBASE_CREDENTIALS_JSON = os.environ.get('FIREBASE_CREDENTIALS_JSON')

    # R2 Storage settings
    R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
    R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
    R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
    R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
    R2_ENDPOINT_URL = os.environ.get('R2_ENDPOINT_URL')

    # Firestore settings
    FIRESTORE_PROJECT_ID = os.environ.get('FIRESTORE_PROJECT_ID')

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'
    CORS_ORIGINS = [
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ]

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'
    
    # Parse CORS origins from environment variable
    _cors_origins = os.environ.get('CORS_ORIGINS', '')
    if _cors_origins:
        CORS_ORIGINS = [origin.strip() for origin in _cors_origins.split(',')]
    else:
        CORS_ORIGINS = "*"

    
    # Ensure we have a strong secret key in production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set in production")

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    FLASK_ENV = 'testing'
    CORS_ORIGINS = ["http://localhost:3000"]

# Config dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
