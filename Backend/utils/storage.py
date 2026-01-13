# Backend/utils/storage.py
import boto3
import os
import uuid
from botocore.exceptions import ClientError, NoCredentialsError
from werkzeug.utils import secure_filename
import mimetypes
from datetime import datetime, timedelta
from flask import current_app
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class LocalFileStorage:
    """Simple filesystem storage (used for local/dev and Render disk)."""

    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Local storage initialized at {self.base_path}")

    def generate_unique_key(self, original_filename: str) -> str:
        safe_name = secure_filename(original_filename)
        unique_suffix = uuid.uuid4().hex
        return f"{unique_suffix}_{safe_name}"

    def upload_file(self, file_obj, original_filename: str) -> dict:
        file_key = self.generate_unique_key(original_filename)
        target_path = self.base_path / file_key
        logger.info(f"Saving file to: {target_path}")
        file_obj.save(target_path)

        file_size = target_path.stat().st_size
        content_type = mimetypes.guess_type(original_filename)[0] or "application/octet-stream"

        return {
            "file_key": file_key,
            "file_url": str(target_path.resolve()),
            "file_size": file_size,
            "content_type": content_type,
            "bucket_name": None,
            "storage_path": str(target_path.resolve()),
        }

    def delete_file(self, file_key: str) -> bool:
        target_path = self.base_path / file_key
        if not target_path.exists():
            logger.warning("File not found for deletion: %s", target_path)
            return False
        target_path.unlink()
        return True

    def get_file_content(self, file_key: str):
        target_path = self.base_path / file_key
        if not target_path.exists():
            logger.error("File not found: %s", target_path)
            return None
        return target_path.read_bytes()

    def get_file_metadata(self, file_key: str):
        target_path = self.base_path / file_key
        if not target_path.exists():
            return None
        stat = target_path.stat()
        return {
            "file_key": file_key,
            "file_size": stat.st_size,
            "content_type": mimetypes.guess_type(target_path.name)[0] or "application/octet-stream",
            "last_modified": stat.st_mtime,
            "metadata": {},
        }

    def generate_presigned_url(self, file_key: str, expiration: int = 3600):
        # For local storage we don't generate presigned URLs; return direct path
        target_path = self.base_path / file_key
        if target_path.exists():
            return str(target_path.resolve())
        return None

class CloudflareR2Storage:
    def __init__(self):
        """Initialize Cloudflare R2 storage client"""
        self.access_key_id = os.environ.get('R2_ACCESS_KEY_ID')
        self.secret_access_key = os.environ.get('R2_SECRET_ACCESS_KEY')
        self.endpoint_url = os.environ.get('R2_ENDPOINT_URL') 
        self.bucket_name = os.environ.get('R2_BUCKET_NAME')
        
        if not all([self.access_key_id, self.secret_access_key, self.endpoint_url, self.bucket_name]):
            logger.error("Missing required R2 environment variables")
            raise ValueError("Missing required R2 environment variables: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT_URL, R2_BUCKET_NAME")
        
        # Initialize boto3 client for R2
        try:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key_id,
                aws_secret_access_key=self.secret_access_key,
                region_name='auto'  # R2 uses 'auto' for region
            )
            logger.info("Cloudflare R2 client initialized successfully")
        except Exception as e:
            logger.error("Failed to initialize Cloudflare R2 client")
            if current_app and current_app.debug:
                logger.error(f"R2 client initialization error: {e}")
            raise
    
    def test_connection(self):
        """Test the R2 connection by listing buckets or checking bucket access"""
        try:
            # Try to check if our bucket exists and is accessible
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                logger.error("R2 bucket not found")
            elif error_code == '403':
                logger.error("Access denied to R2 bucket")
            else:
                logger.error("Error accessing R2 bucket")
                if current_app and current_app.debug:
                    logger.error(f"R2 bucket access error: {e}")
            return False
        except Exception as e:
            logger.error("Unexpected error testing R2 connection")
            if current_app and current_app.debug:
                logger.error(f"R2 connection test error: {e}")
            return False
    
    def generate_unique_key(self, original_filename):
        """Generate a unique key for the file in R2"""
        try:
            if not original_filename or not isinstance(original_filename, str):
                logger.warning("Invalid filename provided to generate_unique_key")
                return None
                
            # Get file extension
            file_extension = os.path.splitext(original_filename)[1].lower()
            # Generate UUID and combine with original filename (secured)
            secure_name = secure_filename(os.path.splitext(original_filename)[0])
            
            if not secure_name:
                secure_name = "file"
                
            unique_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create a structured key: year/month/unique_id_filename.ext
            date_prefix = datetime.now().strftime('%Y/%m')
            unique_key = f"{date_prefix}/{unique_id}_{secure_name}_{timestamp}{file_extension}"
            
            return unique_key
            
        except Exception as e:
            logger.error("Error generating unique key for file")
            if current_app and current_app.debug:
                logger.error(f"Unique key generation error: {e}")
            return None
    
    def upload_file(self, file, original_filename):
        """
        Upload file to Cloudflare R2
        
        Args:
            file: File object from Flask request
            original_filename: Original filename
            
        Returns:
            dict: Contains file_key, file_url, file_size, and other metadata
        """
        try:
            if not file or not original_filename:
                raise ValueError("File and filename are required")
                
            # Generate unique key for the file
            file_key = self.generate_unique_key(original_filename)
            if not file_key:
                raise Exception("Failed to generate unique file key")
            
            # Get file size
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to beginning
            
            if file_size == 0:
                raise ValueError("Cannot upload empty file")
            
            # Determine content type
            content_type, _ = mimetypes.guess_type(original_filename)
            if not content_type:
                content_type = 'application/octet-stream'
            
            # Upload to R2
            self.s3_client.upload_fileobj(
                file,
                self.bucket_name,
                file_key,
                ExtraArgs={
                    'ContentType': content_type,
                    'Metadata': {
                        'original_filename': secure_filename(original_filename),  
                        'upload_timestamp': datetime.now().isoformat()
                    }
                }
            )
            
            # Generate public URL (if your bucket allows public access)
            file_url = f"{self.endpoint_url.replace('.r2.cloudflarestorage.com', '.r2.dev')}/{file_key}"
            
            logger.info("File uploaded successfully to R2")
            
            return {
                'file_key': file_key,
                'file_url': file_url,
                'file_size': file_size,
                'content_type': content_type,
                'bucket_name': self.bucket_name
            }
            
        except ClientError as e:
            logger.error("ClientError uploading to R2")
            if current_app and current_app.debug:
                logger.error(f"R2 upload client error: {e}")
            raise Exception("Failed to upload file to cloud storage")
        except NoCredentialsError:
            logger.error("No R2 credentials found")
            raise Exception("Cloud storage credentials not configured")
        except Exception as e:
            logger.error("Unexpected error uploading to R2")
            if current_app and current_app.debug:
                logger.error(f"R2 upload error: {e}")
            raise Exception("Unexpected error during file upload")
    
    def delete_file(self, file_key):
        """
        Delete file from Cloudflare R2
        
        Args:
            file_key: The key/path of the file in R2
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not file_key:
                logger.warning("No file key provided for deletion")
                return False
                
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            logger.info("File deleted successfully from R2")
            return True
            
        except ClientError as e:
            logger.error("Error deleting file from R2")
            if current_app and current_app.debug:
                logger.error(f"R2 delete client error: {e}")
            return False
        except Exception as e:
            logger.error("Unexpected error deleting file")
            if current_app and current_app.debug:
                logger.error(f"R2 delete error: {e}")
            return False
    
    def generate_presigned_url(self, file_key, expiration=3600):
        """
        Generate a presigned URL for file download
        
        Args:
            file_key: The key/path of the file in R2
            expiration: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            str: Presigned URL or None if error
        """
        try:
            if not file_key:
                logger.warning("No file key provided for presigned URL generation")
                return None
                
            max_expiration = 24 * 3600  # 24 hours max
            if expiration > max_expiration:
                expiration = max_expiration
                logger.warning(f"Expiration time limited to {max_expiration} seconds")
            
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expiration
            )
            
            logger.debug("Presigned URL generated successfully")
            return presigned_url
            
        except ClientError as e:
            logger.error("Error generating presigned URL")
            if current_app and current_app.debug:
                logger.error(f"Presigned URL generation error: {e}")
            return None
    
    def get_file_metadata(self, file_key):
        """
        Get metadata about a file in R2
        
        Args:
            file_key: The key/path of the file in R2
            
        Returns:
            dict: File metadata or None if error
        """
        try:
            if not file_key:
                logger.warning("No file key provided for metadata retrieval")
                return None
                
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            
            return {
                'file_key': file_key,
                'file_size': response.get('ContentLength', 0),
                'content_type': response.get('ContentType', 'unknown'),
                'last_modified': response.get('LastModified'),
                'metadata': response.get('Metadata', {})
            }
            
        except ClientError as e:
            logger.error("Error getting file metadata")
            if current_app and current_app.debug:
                logger.error(f"File metadata retrieval error: {e}")
            return None
        
    
    def get_file_content(self, file_key):
        """Retrieve file content from R2 storage"""
        try:
            if not file_key:
                logger.warning("No file key provided for content retrieval")
                return None
                
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            return response['Body'].read()
            
        except ClientError as e:
            logger.error("Error retrieving file content from R2")
            if current_app and current_app.debug:
                logger.error(f"File content retrieval error: {e}")
            return None
        except Exception as e:
            logger.error("Unexpected error retrieving file from R2")
            if current_app and current_app.debug:
                logger.error(f"File retrieval error: {e}")
            return None

# Create a global storage instance (local by default)
storage_backend = None
storage_base_path = None


def initialize_storage(base_path: str):
    """Initialize storage based on environment (local filesystem by default)."""
    global storage_backend, storage_base_path
    # Avoid loading any cloud credentials in non-production usage
    storage_base_path = base_path
    storage_backend = LocalFileStorage(base_path)
    return storage_backend


def get_storage():
    global storage_backend, storage_base_path
    if storage_backend is None:
        # Lazy-init to a safe local path if not already set
        default_path = storage_base_path or "./uploads"
        storage_base_path = default_path
        storage_backend = LocalFileStorage(default_path)
    return storage_backend