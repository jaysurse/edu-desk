# EDU-DESK v2.0 - Quick Start Guide

Get EDU-DESK v2.0 running in 5 minutes!

## Prerequisites
- Python 3.8+
- Node.js 16+
- Firebase account configured
- Git

## Installation (5 minutes)

### 1. Backend Setup (2 minutes)
```bash
cd Backend
pip install -r requirements.txt
```

### 2. Frontend Setup (1 minute)
```bash
npm install
```

### 3. Start Development Servers (2 minutes)

**Terminal 1 - Backend:**
```bash
cd Backend
python mainapp.py
# Runs on http://localhost:10000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:5173
```

---

## Try New Features Immediately

### Feature 1: Rate & Comment on Notes
1. Open http://localhost:5173
2. Upload or find a note
3. Scroll to bottom
4. Add a 5-star rating
5. Write a comment

### Feature 2: Create Collections
1. Go to Favorites section
2. Click "Create New Collection"
3. Name it "My Study Materials"
4. Add notes to it

### Feature 3: View User Profile
1. Click on any uploader name
2. See their stats:
   - Total uploads
   - Downloads received
   - Average rating
   - Badges earned

### Feature 4: Check Analytics
1. Go to Analytics section
2. View:
   - Most downloaded notes
   - Trending notes
   - Subject popularity
   - Department stats

### Feature 5: Your Dashboard
1. Log in to your account
2. Click your profile
3. View dashboard:
   - My uploads
   - My favorites
   - Recent activity

---

## Key Endpoints to Test

### Test Comments
```bash
curl -X POST http://localhost:10000/api/community/notes/NOTE_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Great note!"}'
```

### Test Ratings
```bash
curl -X POST http://localhost:10000/api/community/notes/NOTE_ID/rate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
```

### Test Analytics
```bash
curl http://localhost:10000/api/analytics/stats/popular
curl http://localhost:10000/api/analytics/stats/trending
```

---

## What's New in v2.0?

### Community Features
- ⭐ 5-star rating system
- 💬 Comments with likes
- ❤️ Favorites/bookmarks
- 📚 Collections/playlists

### User Profiles
- 👤 User profiles with stats
- 🏆 Reputation system
- 🎖️ Badges for contributors
- 📊 Upload/download metrics

### Analytics
- 📈 Popular notes tracking
- 🔥 Trending analysis
- 📊 Subject statistics
- 🏢 Department breakdown
- 👥 Top uploaders
- 📉 Admin dashboard

### Security
- 🔒 Rate limiting
- ✅ Content validation
- 🚫 Spam detection
- 🚨 Content flagging

---

## File Changes Summary

### New Files (5 new component files)
```
src/components/
├── RatingsComments.jsx          - Ratings & comments
├── FavoritesCollections.jsx     - Favorites & collections
├── UserProfile.jsx              - User profiles
├── UserDashboard.jsx            - Personal dashboard
└── AnalyticsDashboard.jsx       - Analytics visualization
```

### New Backend Files (5 new utility + 2 new route files)
```
Backend/
├── utils/
│   ├── ratings_comments.py      - Ratings & comments DB
│   ├── user_profiles.py         - User profiles DB
│   ├── favorites.py             - Favorites & collections DB
│   ├── analytics.py             - Analytics tracking
│   └── security.py              - Rate limiting & validation
├── routes/
│   ├── community.py             - 19 community endpoints
│   └── analytics_admin.py        - 11 analytics endpoints
```

### Updated Files
```
Backend/
├── mainapp.py                   - Blueprint registration
├── requirements.txt             - New dependencies
└── package.json                 - Frontend dependencies
```

### Documentation
```
Root/
├── FEATURES_v2.md               - Complete feature guide (300+ lines)
├── SETUP_v2.md                  - Setup instructions (400+ lines)
├── API_REFERENCE.md             - All endpoints (500+ lines)
└── IMPLEMENTATION_SUMMARY.md    - What was added
```

---

## Quick Configuration

### Backend `.env`
```env
FLASK_ENV=development
ENV=local
CORS_ORIGINS=http://localhost:5173
```

### Firebase Rules (Firestore)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    // Allow public reads
    match /notes/{document=**} {
      allow read;
    }
  }
}
```

---

## Common Tasks

### Add a Rating
```javascript
const response = await fetch(`/api/community/notes/${noteId}/rate`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ rating: 5 })
});
```

### Add to Favorites
```javascript
const response = await fetch(`/api/community/favorites`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ note_id: "NOTE_ID" })
});
```

### Create Collection
```javascript
const response = await fetch(`/api/community/collections`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "My Study Materials",
    description: "Physics notes"
  })
});
```

### Get Analytics
```javascript
// Popular notes
const popular = await fetch(`/api/analytics/stats/popular`);

// Trending
const trending = await fetch(`/api/analytics/stats/trending`);

// Subject stats
const subjects = await fetch(`/api/analytics/stats/subjects`);

// Admin dashboard
const admin = await fetch(`/api/analytics/admin/dashboard`, {
  headers: { "Authorization": `Bearer ${token}` }
});
```

---

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.8+

# Clear cache
find . -type d -name __pycache__ -exec rm -r {} +

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend build fails
```bash
# Clear node modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
npm run dev
```

### No data showing
1. Verify Firebase is initialized
2. Check Firestore collections exist
3. Review browser console for errors
4. Check network tab in DevTools

### Rate limiting blocking me
1. Change RATE_LIMIT_REQUESTS in config
2. Or wait for window to reset (1 hour)
3. Restart Flask for immediate reset

---

## Next Steps

1. **Explore Features**
   - Try all new components
   - Test all endpoints
   - Review analytics

2. **Customize**
   - Modify styling in components
   - Adjust rate limits
   - Add your branding

3. **Deploy**
   - Build frontend: `npm run build`
   - Deploy backend to server
   - Set production URLs

4. **Extend**
   - Add email notifications
   - Implement file preview
   - Set up caching
   - Add bulk operations

---

## Documentation

- **Complete Features**: `FEATURES_v2.md`
- **Setup Guide**: `SETUP_v2.md`
- **API Reference**: `API_REFERENCE.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`

---

## Version Info

- **Version**: 2.0
- **Status**: Production Ready ✅
- **Lines Added**: 2500+
- **New Components**: 5
- **New Endpoints**: 30
- **New Collections**: 7

---

## Get Help

1. Check documentation files
2. Review component examples
3. Check API_REFERENCE.md for endpoint details
4. Review source code comments
5. Check Flask server logs

---

## That's It! 🎉

You now have all v2.0 features running locally!

**Start with**: http://localhost:5173

Enjoy the enhanced EDU-DESK platform!

---

**Need More Help?**
- See `FEATURES_v2.md` for detailed feature docs
- See `SETUP_v2.md` for configuration
- See `API_REFERENCE.md` for endpoint details
- Review component code in `src/components/`
