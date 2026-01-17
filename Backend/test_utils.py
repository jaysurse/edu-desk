"""
Unit tests for utility modules
Run with: pytest test_utils.py
"""
import pytest
from Backend.utils.security import ContentValidator, is_valid_email
from Backend.utils.helpers import allowed_file, format_file_size

class TestContentValidator:
    """Test content validation"""
    
    def test_valid_comment(self):
        """Test valid comment validation"""
        valid, msg = ContentValidator.validate_comment("This is a valid comment")
        assert valid is True
        
    def test_empty_comment(self):
        """Test empty comment rejection"""
        valid, msg = ContentValidator.validate_comment("")
        assert valid is False
        assert "empty" in msg.lower()
    
    def test_long_comment(self):
        """Test overly long comment rejection"""
        long_text = "a" * 1000
        valid, msg = ContentValidator.validate_comment(long_text)
        assert valid is False
        assert "500" in msg
    
    def test_spam_detection(self):
        """Test spam pattern detection"""
        spam_text = "Click here: http://spam.com " * 10
        is_spam = ContentValidator.is_spam(spam_text)
        assert is_spam is True

class TestEmailValidation:
    """Test email validation"""
    
    def test_valid_email(self):
        """Test valid email addresses"""
        assert is_valid_email("user@example.com") is True
        assert is_valid_email("test.user@domain.co.uk") is True
    
    def test_invalid_email(self):
        """Test invalid email addresses"""
        assert is_valid_email("invalid") is False
        assert is_valid_email("@example.com") is False
        assert is_valid_email("user@") is False

class TestFileHelpers:
    """Test file utility functions"""
    
    def test_allowed_file(self):
        """Test file extension validation"""
        assert allowed_file("document.pdf") is True
        assert allowed_file("notes.docx") is True
        assert allowed_file("presentation.pptx") is True
        assert allowed_file("script.exe") is False
        assert allowed_file("image.jpg") is False
    
    def test_format_file_size(self):
        """Test file size formatting"""
        assert "1.00 KB" in format_file_size(1024)
        assert "1.00 MB" in format_file_size(1024 * 1024)
        assert "500 B" in format_file_size(500)

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
