# EDU-DESK v2.0 - Installation & Setup Guide

This guide walks you through setting up all new v2.0 features.

## Prerequisites

- Python 3.8+
- Node.js 16+
- Firebase Admin SDK configured
- Firestore database access

## Backend Setup

### 1. Install New Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

New packages added:
- `redis` - For caching and rate limiting
- `python-ratelimit` - Enhanced rate limiting utilities

### 2. Create New Database Indexes (Firestore)

Log into Firebase Console and create these composite indexes:

**Collection: `notes`**
- Index 1: `created_at` (Descending), `uploaded_by` (Ascending)
- Index 2: `download_count` (Descending), `created_at` (Descending)
- Index 3: `subject` (Ascending), `created_at` (Descending)
- Index 4: `department` (Ascending), `created_at` (Descending)

**Collection: `ratings`**
- Index 1: `note_id` (Ascending), `created_at` (Descending)

**Collection: `comments`**
- Index 1: `note_id` (Ascending), `created_at` (Descending)

**Collection: `users`**
- Index 1: `total_uploads` (Descending), `joined_at` (Ascending)

**Collection: `favorites`**
- Index 1: `user_id` (Ascending), `added_at` (Descending)

**Collection: `note_collections`**
- Index 1: `user_id` (Ascending), `created_at` (Descending)

### 3. Update Flask App Configuration

Ensure `mainapp.py` has new blueprint registrations:

```python
from routes.community import community_bp
from routes.analytics_admin import analytics_bp

app.register_blueprint(community_bp, url_prefix="/api/community")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
```

### 4. (Optional) Set Up Redis for Caching

```bash
# Install Redis (Windows - using WSL or Docker)
# On Ubuntu/WSL:
sudo apt-get install redis-server

# Start Redis
redis-server

# Or use Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

### 5. Run Backend

```bash
# Development
python mainapp.py

# Production
gunicorn -w 4 -b 0.0.0.0:5000 mainapp:create_app()
```

---

## Frontend Setup

### 1. Install New Dependencies

```bash
npm install
```

New packages:
- `axios` - HTTP client (optional, fetch is used)
- `date-fns` - Date formatting utilities

### 2. Update API Base Configuration

Ensure your `App.jsx` has the correct API base:

```javascript
const API_BASE = import.meta.env.DEV 
  ? "http://localhost:10000" 
  : "https://your-production-url.com";
```

### 3. Add New Components to App

In your main routing section, add:

```jsx
import RatingsComments from "./components/RatingsComments";
import FavoritesCollections from "./components/FavoritesCollections";
import UserProfile from "./components/UserProfile";
import UserDashboard from "./components/UserDashboard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

// Use them in your routing:
<RatingsComments noteId={noteId} userId={userId} API_BASE={API_BASE} />
<FavoritesCollections userId={userId} API_BASE={API_BASE} />
<UserProfile userId={userId} API_BASE={API_BASE} />
<UserDashboard userId={userId} API_BASE={API_BASE} />
<AnalyticsDashboard API_BASE={API_BASE} isAdmin={isAdmin} />
```

### 4. Run Frontend

```bash
npm run dev
```

---

## Configuration Files

### Backend `.env` Example

```env
# Flask Configuration
FLASK_ENV=development
DEBUG=False

# Environment
ENV=local
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Firebase (same as before)
FIREBASE_ADMIN_SDK_PATH=./config/firebase-service-account-key.json

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Security
CONTENT_MAX_LENGTH=500
MAX_COMMENT_LENGTH=500
```

### Frontend Environment Setup

No new `.env` variables needed - uses existing setup.

---

## Database Migration (if upgrading from v1)

If you're upgrading from v1, existing data is preserved. New collections are created automatically.

### Recommended Data Migration Steps

```python
# Backend/migration_script.py
from utils.firestore_db import get_firestore_db
from utils.user_profiles import UserProfilesDB
from firebase_admin import firestore

def migrate_user_profiles():
    """Create user profile entries for existing users"""
    db = get_firestore_db()
    user_profiles_db = UserProfilesDB()
    
    all_notes = db.get_all_notes(limit=10000)
    unique_users = set()
    
    for note in all_notes:
        user_id = note.get('uploaded_by')
        if user_id and user_id not in unique_users:
            user_profiles_db.create_or_update_profile(user_id, {
                'email': note.get('uploader_email'),
                'name': note.get('uploader')
            })
            unique_users.add(user_id)
    
    print(f"Migrated {len(unique_users)} user profiles")

if __name__ == "__main__":
    migrate_user_profiles()
```

Run migration:
```bash
cd Backend
python migration_script.py
```

---

## Feature Enablement Checklist

- [ ] Backend Dependencies Installed
- [ ] Firestore Indexes Created
- [ ] Blueprint Routes Registered
- [ ] Frontend Components Installed
- [ ] API Base URLs Configured
- [ ] Firebase Permissions Updated
- [ ] Redis Setup (Optional)
- [ ] Database Migrated
- [ ] Rate Limiting Configured
- [ ] Content Validation Enabled

---

## Testing New Features

### 1. Test Ratings System

```bash
# Add rating
curl -X POST http://localhost:10000/api/community/notes/NOTE_ID/rate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'

# Get ratings
curl http://localhost:10000/api/community/notes/NOTE_ID/ratings
```

### 2. Test Comments

```bash
# Add comment
curl -X POST http://localhost:10000/api/community/notes/NOTE_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Great note!"}'
```

### 3. Test Favorites

```bash
# Add to favorites
curl -X POST http://localhost:10000/api/community/favorites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note_id": "NOTE_ID"}'

# Get favorites
curl http://localhost:10000/api/community/favorites \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test Analytics

```bash
# Get popular notes
curl http://localhost:10000/api/analytics/stats/popular

# Get trending notes
curl http://localhost:10000/api/analytics/stats/trending

# Admin dashboard
curl http://localhost:10000/api/analytics/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Firestore Indexes Not Created

**Error**: `FAILED_PRECONDITION: Index does not exist`

**Solution**:
1. Go to Firebase Console > Firestore
2. Click "Create Index"
3. Follow the exact field names from the setup guide
4. Wait for index to build (can take 5-10 minutes)

### Rate Limiting Not Working

**Error**: All requests return 429

**Solution**:
1. Check `RATE_LIMIT_ENABLED` in `.env`
2. Verify window time is reasonable (3600 seconds = 1 hour)
3. Clear rate limiter state: Restart Flask server

### Comments Not Saving

**Error**: 400 Bad Request on comment POST

**Solution**:
1. Check comment length < 500 characters
2. Verify user is authenticated
3. Ensure note ID is valid
4. Check content validation not flagging as spam

### User Profiles Not Showing

**Error**: 404 on user profile endpoint

**Solution**:
1. Ensure user has uploaded at least one note
2. Run migration script: `python migration_script.py`
3. Check Firestore `users` collection exists

---

## Performance Tuning

### Database Queries

For large datasets, use pagination:

```python
# Limit query results
notes = firestore_db.get_all_notes(limit=50)

# Use pagination in API
GET /api/community/notes?limit=50&offset=0
```

### Caching Recommendations

```python
# Cache popular notes (5 minute TTL)
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@app.route('/stats/popular')
@cache.cached(timeout=300)
def get_popular_notes():
    ...
```

### Rate Limiting Tuning

Adjust based on usage patterns:

```env
# Conservative (development)
RATE_LIMIT_REQUESTS=50
RATE_LIMIT_WINDOW=600

# Standard (production)
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# Aggressive (high traffic)
RATE_LIMIT_REQUESTS=200
RATE_LIMIT_WINDOW=3600
```

---

## Deployment

### Heroku Deployment

```bash
# Add Redis add-on
heroku addons:create heroku-redis:premium-0

# Deploy
git push heroku main
```

### Self-Hosted Deployment

```bash
# Build frontend
npm run build

# Serve static files from Flask
# Copy dist/ to Backend/static/

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 mainapp:create_app()
```

---

## Monitoring

### Check Feature Health

```python
# Backend health check includes new services
curl http://localhost:10000/api/health/detailed
```

Response includes:
```json
{
  "ratings": "✅ initialized",
  "comments": "✅ initialized",
  "user_profiles": "✅ initialized",
  "favorites": "✅ initialized",
  "analytics": "✅ initialized"
}
```

---

## Support

For issues or questions:
1. Check `FEATURES_v2.md` for feature documentation
2. Review API endpoints in `Backend/routes/`
3. Check component examples in `src/components/`
4. Review error logs in Flask output

---

**Version**: 2.0  
**Last Updated**: January 2026  
**Status**: Production Ready
