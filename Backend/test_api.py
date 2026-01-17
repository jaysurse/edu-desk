"""
Basic API tests for EDU-DESK backend
Run with: pytest test_api.py
"""
import pytest
import json
from Backend.mainapp import create_app

@pytest.fixture
def client():
    """Create test client"""
    app = create_app('testing')
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'

def test_api_info(client):
    """Test API info endpoint"""
    response = client.get('/api/info')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'version' in data
    assert data['version'] == '2.0'

def test_get_notes_unauthenticated(client):
    """Test getting notes without authentication"""
    response = client.get('/api/files/notes')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'files' in data or 'notes' in data

def test_upload_without_auth(client):
    """Test upload endpoint requires authentication"""
    response = client.post('/api/files/upload')
    assert response.status_code in [400, 401]

def test_popular_notes(client):
    """Test popular notes analytics"""
    response = client.get('/api/analytics/stats/popular')
    assert response.status_code == 200

def test_trending_notes(client):
    """Test trending notes analytics"""
    response = client.get('/api/analytics/stats/trending')
    assert response.status_code == 200

def test_subject_stats(client):
    """Test subject statistics"""
    response = client.get('/api/analytics/stats/subjects')
    assert response.status_code == 200

def test_department_stats(client):
    """Test department statistics"""
    response = client.get('/api/analytics/stats/departments')
    assert response.status_code == 200

def test_invalid_endpoint(client):
    """Test 404 for invalid endpoint"""
    response = client.get('/api/invalid/endpoint')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'error' in data

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
