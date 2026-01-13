# EDU-DESK v2.0 - Complete API Reference

All endpoints with examples and response formats.

## Base URL
```
Development: http://localhost:10000
Production: https://your-domain.com
```

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <TOKEN>
```

Where TOKEN is obtained from Firebase Authentication.

---

## Community API `/api/community`

### Ratings Endpoints

#### 1. Add/Update Rating
```
POST /api/community/notes/{noteId}/rate
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "rating": 5
}

Response 201:
{
  "message": "Rating added successfully",
  "ratings": {
    "average": 4.5,
    "total_ratings": 8,
    "distribution": {
      "1": 0,
      "2": 1,
      "3": 1,
      "4": 2,
      "5": 4
    }
  }
}
```

#### 2. Get Ratings for Note
```
GET /api/community/notes/{noteId}/ratings

Response 200:
{
  "average": 4.5,
  "total_ratings": 8,
  "distribution": {
    "1": 0,
    "2": 1,
    "3": 1,
    "4": 2,
    "5": 4
  }
}
```

---

### Comments Endpoints

#### 3. Add Comment
```
POST /api/community/notes/{noteId}/comments
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "text": "This is a great note! Very helpful."
}

Response 201:
{
  "message": "Comment added successfully",
  "comment_id": "uuid-12345"
}
```

#### 4. Get Comments for Note
```
GET /api/community/notes/{noteId}/comments?limit=50

Response 200:
{
  "comments": [
    {
      "comment_id": "uuid-12345",
      "note_id": "note-id",
      "user_id": "user-id",
      "user_email": "user@example.com",
      "user_name": "John Doe",
      "text": "Great note!",
      "likes": 3,
      "created_at": "2026-01-13T10:30:00Z",
      "updated_at": "2026-01-13T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### 5. Delete Comment
```
DELETE /api/community/comments/{commentId}
Authorization: Bearer TOKEN

Response 200:
{
  "message": "Comment deleted successfully"
}
```

#### 6. Like Comment
```
POST /api/community/comments/{commentId}/like

Response 200:
{
  "message": "Comment liked"
}
```

---

### User Profile Endpoints

#### 7. Get User Profile
```
GET /api/community/users/{userId}/profile

Response 200:
{
  "user_id": "user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "photo_url": "https://...",
  "bio": "Computer Science Student",
  "total_uploads": 15,
  "total_downloads_received": 450,
  "average_rating": 4.3,
  "badges": ["Top Contributor", "Popular"],
  "joined_at": "2025-09-15T08:22:00Z",
  "recent_notes": [
    {
      "id": "note-id",
      "title": "Advanced Algorithms",
      "subject": "Computer Science",
      "department": "IT",
      "download_count": 45
    }
  ]
}
```

#### 8. Get Current User Profile
```
GET /api/community/users/me/profile
Authorization: Bearer TOKEN

Response 200:
{
  "user_id": "user-id",
  "email": "user@example.com",
  ...
}
```

#### 9. Update Current User Profile
```
PUT /api/community/users/me/profile
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "John Doe",
  "bio": "Passionate about learning",
  "photo_url": "https://..."
}

Response 200:
{
  "user_id": "user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "bio": "Passionate about learning",
  ...
}
```

#### 10. Get Top Uploaders
```
GET /api/community/users/top-uploaders?limit=10

Response 200:
{
  "uploaders": [
    {
      "user_id": "user-1",
      "name": "Top Contributor",
      "email": "top@example.com",
      "total_uploads": 50,
      "total_downloads_received": 2000,
      "average_rating": 4.7,
      "badges": ["Top Contributor", "Popular"]
    }
  ],
  "count": 1
}
```

---

### Favorites Endpoints

#### 11. Add to Favorites
```
POST /api/community/favorites
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "note_id": "note-id"
}

Response 201:
{
  "message": "Added to favorites"
}
```

#### 12. Remove from Favorites
```
DELETE /api/community/favorites/{noteId}
Authorization: Bearer TOKEN

Response 200:
{
  "message": "Removed from favorites"
}
```

#### 13. Get All Favorites
```
GET /api/community/favorites?limit=100
Authorization: Bearer TOKEN

Response 200:
{
  "favorites": [
    {
      "id": "note-id",
      "title": "Advanced Algorithms",
      "subject": "Computer Science",
      "department": "IT",
      "uploader": "John Doe",
      "download_count": 45,
      "created_at": "2025-09-15T08:22:00Z"
    }
  ],
  "count": 1
}
```

#### 14. Check if Note is Favorited
```
GET /api/community/favorites/{noteId}/check
Authorization: Bearer TOKEN

Response 200:
{
  "is_favorited": true
}
```

---

### Collections Endpoints

#### 15. Create Collection
```
POST /api/community/collections
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "My Study Materials",
  "description": "Collection of useful study notes"
}

Response 201:
{
  "message": "Collection created successfully",
  "collection_id": "collection-uuid"
}
```

#### 16. Get User Collections
```
GET /api/community/collections
Authorization: Bearer TOKEN

Response 200:
{
  "collections": [
    {
      "collection_id": "collection-uuid",
      "user_id": "user-id",
      "name": "My Study Materials",
      "description": "Collection of useful study notes",
      "notes": ["note-id-1", "note-id-2"],
      "created_at": "2026-01-10T12:00:00Z",
      "updated_at": "2026-01-13T14:30:00Z"
    }
  ],
  "count": 1
}
```

#### 17. Add Note to Collection
```
POST /api/community/collections/{collectionId}/notes
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "note_id": "note-id"
}

Response 200:
{
  "message": "Note added to collection"
}
```

#### 18. Remove Note from Collection
```
DELETE /api/community/collections/{collectionId}/notes/{noteId}
Authorization: Bearer TOKEN

Response 200:
{
  "message": "Note removed from collection"
}
```

#### 19. Delete Collection
```
DELETE /api/community/collections/{collectionId}
Authorization: Bearer TOKEN

Response 200:
{
  "message": "Collection deleted successfully"
}
```

---

## Analytics API `/api/analytics`

### Public Analytics

#### 20. Get Popular Notes
```
GET /api/analytics/stats/popular?days=7&limit=10

Response 200:
{
  "popular_notes": [
    {
      "id": "note-id",
      "title": "Advanced Algorithms",
      "download_count": 150,
      "uploader": "John Doe"
    }
  ],
  "count": 1,
  "period_days": 7
}
```

#### 21. Get Trending Notes
```
GET /api/analytics/stats/trending?limit=5

Response 200:
{
  "trending_notes": [
    {
      "id": "note-id",
      "title": "Recent Popular Notes",
      "download_count": 50,
      "created_at": "2026-01-13T08:00:00Z"
    }
  ],
  "count": 1
}
```

#### 22. Get Subject Statistics
```
GET /api/analytics/stats/subjects

Response 200:
{
  "subjects": {
    "Computer Science": {
      "count": 45,
      "total_downloads": 1200,
      "avg_rating": 4.2
    },
    "Mathematics": {
      "count": 32,
      "total_downloads": 980,
      "avg_rating": 4.1
    }
  },
  "count": 2
}
```

#### 23. Get Department Statistics
```
GET /api/analytics/stats/departments

Response 200:
{
  "departments": {
    "IT": {
      "count": 50,
      "total_downloads": 1500
    },
    "ECE": {
      "count": 35,
      "total_downloads": 900
    }
  },
  "count": 2
}
```

---

### Admin Analytics

#### 24. Get Admin Dashboard
```
GET /api/analytics/admin/dashboard
Authorization: Bearer TOKEN

Response 200:
{
  "total_notes": 200,
  "total_users": 150,
  "total_downloads": 5000,
  "total_file_size_mb": 512.5,
  "trending_notes": [...],
  "subject_stats": {...},
  "department_stats": {...},
  "usage_stats": {
    "uploads_this_month": 45,
    "downloads_this_month": 1200
  },
  "timestamp": "2026-01-13T14:35:00Z"
}
```

#### 25. Get Users List
```
GET /api/analytics/admin/users
Authorization: Bearer TOKEN

Response 200:
{
  "users": [
    {
      "user_id": "user-id",
      "uploads": 15,
      "downloads": 450,
      "total_file_size": 52428800
    }
  ],
  "count": 1
}
```

#### 26. Get Notes List
```
GET /api/analytics/admin/notes?limit=100&sort_by=downloads
Authorization: Bearer TOKEN

Response 200:
{
  "notes": [
    {
      "id": "note-id",
      "title": "Advanced Algorithms",
      "download_count": 150,
      "file_size": 1048576,
      "uploader": "John Doe",
      "created_at": "2025-09-15T08:22:00Z"
    }
  ],
  "count": 1,
  "sorted_by": "downloads"
}
```

#### 27. Get Flagged Content
```
GET /api/analytics/admin/content-moderation
Authorization: Bearer TOKEN

Response 200:
{
  "flagged_content": [
    {
      "flag_id": "flag-uuid",
      "note_id": "note-id",
      "reason": "Inappropriate content",
      "flagged_at": "2026-01-13T14:00:00Z",
      "status": "pending",
      "note": {
        "id": "note-id",
        "title": "Note Title"
      }
    }
  ],
  "count": 1
}
```

---

### User Analytics

#### 28. Get User Statistics
```
GET /api/analytics/users/{userId}/stats

Response 200:
{
  "user_id": "user-id",
  "total_uploads": 15,
  "total_downloads_received": 450,
  "total_file_size_mb": 51.2,
  "average_rating": 4.3,
  "profile": {
    "user_id": "user-id",
    "name": "John Doe",
    "email": "user@example.com",
    "total_uploads": 15,
    "average_rating": 4.3
  }
}
```

#### 29. Get Note Statistics
```
GET /api/analytics/notes/{noteId}/stats

Response 200:
{
  "note_id": "note-id",
  "downloads": 150,
  "file_size_mb": 10.5,
  "created_at": "2025-09-15T08:22:00Z",
  "ratings": {
    "average": 4.5,
    "total_ratings": 8,
    "distribution": {...}
  },
  "comments_count": 5,
  "subject": "Computer Science",
  "department": "IT"
}
```

---

### Content Moderation

#### 30. Flag Content
```
POST /api/analytics/notes/{noteId}/flag
Content-Type: application/json

{
  "reason": "Contains inappropriate language"
}

Response 201:
{
  "message": "Content flagged for review",
  "flag_id": "flag-uuid"
}
```

---

## Error Responses

### Common Error Formats

#### 400 Bad Request
```json
{
  "error": "Rating must be an integer between 1 and 5",
  "code": "INVALID_RATING"
}
```

#### 404 Not Found
```json
{
  "error": "Note not found",
  "code": "NOTE_NOT_FOUND"
}
```

#### 403 Forbidden
```json
{
  "error": "You can only delete your own comments",
  "code": "UNAUTHORIZED_DELETE"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Too many requests.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to rate note",
  "code": "RATING_ERROR"
}
```

---

## Request/Response Examples

### Complete Example: Add Rating and Comment

```javascript
const noteId = "abc123";
const token = localStorage.getItem("authToken");
const API_BASE = "http://localhost:10000";

// 1. Add rating
const ratingResponse = await fetch(`${API_BASE}/api/community/notes/${noteId}/rate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({ rating: 5 })
});

const ratingData = await ratingResponse.json();
console.log("Rating added:", ratingData);

// 2. Add comment
const commentResponse = await fetch(`${API_BASE}/api/community/notes/${noteId}/comments`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({ text: "Great note! Very helpful." })
});

const commentData = await commentResponse.json();
console.log("Comment added:", commentData);

// 3. Get all comments
const commentsResponse = await fetch(`${API_BASE}/api/community/notes/${noteId}/comments`);
const commentsData = await commentsResponse.json();
console.log("Comments:", commentsData.comments);
```

---

## Rate Limiting

All endpoints are rate limited based on IP address:

- **Default**: 100 requests per hour
- **Download**: 500 requests per hour
- **Comment**: 50 requests per hour

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642084200
```

---

## Pagination

Endpoints supporting pagination accept:
```
?limit=50&offset=0
```

**limit**: Number of results (default: 50, max: 200)
**offset**: Start position (default: 0)

---

## Version Info

- **API Version**: 2.0
- **Last Updated**: January 2026
- **Status**: Production Ready

---

For more help, see `FEATURES_v2.md` and `SETUP_v2.md`
