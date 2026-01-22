# API Documentation

Complete API reference for Lite Blog backend.

## Base URL

```
Development: http://localhost:8080/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require JWT authentication via HttpOnly cookies or Authorization header.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Cookie-based Authentication (Recommended)

The API sets an HttpOnly cookie named `token` upon successful login. This cookie is automatically sent with subsequent requests.

## Common Response Formats

### Success Response
```json
{
  "data": { /* response data */ },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Paginated Response
```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

## Authentication Endpoints

### Register

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "email_verified": false,
    "status": 0,
    "created_at": "2024-01-20T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400`: Invalid email or password format
- `409`: Email already registered

---

### Login

Authenticate user and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "email_verified": true,
    "roles": ["user"],
    "status": 0,
    "created_at": "2024-01-20T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400`: Invalid credentials
- `401`: Incorrect email or password
- `403`: Account disabled

---

### Logout

Clear authentication token.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Not required

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User

Retrieve authenticated user information.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "email_verified": true,
  "member_expire_at": "2025-01-20T10:30:00Z",
  "status": 0,
  "roles": [
    {
      "id": 2,
      "code": "user",
      "name": "User"
    },
    {
      "id": 3,
      "code": "member",
      "name": "Member"
    }
  ],
  "created_at": "2024-01-20T10:30:00Z"
}
```

**Errors:**
- `401`: Unauthorized (no valid token)

---

### Verify Email

Verify user email with verification token.

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification-token-here"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully"
}
```

**Errors:**
- `400`: Invalid or expired token

---

### Resend Verification Email

Resend email verification link.

**Endpoint:** `POST /api/auth/resend-verification`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Verification email sent"
}
```

**Errors:**
- `400`: Email already verified
- `429`: Too many requests (rate limited)

---

## Article Endpoints (Public)

### List Articles

Get paginated list of published articles.

**Endpoint:** `GET /api/articles`

**Authentication:** Optional (affects content preview)

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `page_size` (integer, default: 20, max: 100): Items per page
- `pinned` (boolean): Filter pinned articles only

**Response:** `200 OK`
```json
{
  "articles": [
    {
      "id": 1,
      "title": "Introduction to Go",
      "slug": "introduction-to-go",
      "content": "Full or preview content...",
      "author": {
        "id": 1,
        "email": "admin@example.com"
      },
      "visibility": "member_full",
      "is_preview": true,
      "is_pinned": false,
      "status": 1,
      "published_at": "2024-01-20T10:00:00Z",
      "created_at": "2024-01-20T09:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

**Notes:**
- `is_preview` indicates if content is truncated for non-members
- Content length depends on user role and article visibility settings

---

### Get Article by Slug

Retrieve single article by its slug.

**Endpoint:** `GET /api/articles/:slug`

**Authentication:** Optional (affects content visibility)

**Path Parameters:**
- `slug` (string): Article slug

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Introduction to Go",
  "slug": "introduction-to-go",
  "content": "Full article content or preview...",
  "author": {
    "id": 1,
    "email": "admin@example.com"
  },
  "visibility": "member_full",
  "preview_percentage": 30,
  "preview_min_chars": 200,
  "preview_smart_paragraph": true,
  "is_preview": true,
  "is_pinned": false,
  "status": 1,
  "published_at": "2024-01-20T10:00:00Z",
  "created_at": "2024-01-20T09:00:00Z",
  "updated_at": "2024-01-20T09:30:00Z"
}
```

**Errors:**
- `404`: Article not found
- `403`: Article is hidden and user is not admin

---

## Comment Endpoints

### List Comments

Get comments for an article.

**Endpoint:** `GET /api/comments/article/:articleId`

**Authentication:** Optional

**Path Parameters:**
- `articleId` (integer): Article ID

**Query Parameters:**
- `page` (integer, default: 1)
- `page_size` (integer, default: 50)

**Response:** `200 OK`
```json
{
  "comments": [
    {
      "id": 1,
      "article_id": 1,
      "user": {
        "id": 2,
        "email": "commenter@example.com"
      },
      "parent_id": null,
      "content": "Great article!",
      "is_deleted": false,
      "created_at": "2024-01-20T11:00:00Z"
    }
  ],
  "total": 15
}
```

**Notes:**
- Deleted comments show `is_deleted: true` and placeholder content
- Nested comments reference `parent_id`

---

### Create Comment

Post a comment on an article.

**Endpoint:** `POST /api/comments/article/:articleId`

**Authentication:** Required (email must be verified)

**Path Parameters:**
- `articleId` (integer): Article ID

**Request Body:**
```json
{
  "content": "This is my comment",
  "parent_id": null
}
```

**Response:** `201 Created`
```json
{
  "id": 10,
  "article_id": 1,
  "user_id": 2,
  "parent_id": null,
  "content": "This is my comment",
  "is_deleted": false,
  "created_at": "2024-01-20T12:00:00Z"
}
```

**Errors:**
- `400`: Invalid request (missing content)
- `401`: Unauthorized
- `403`: Email not verified
- `404`: Article not found

---

## Site Settings Endpoints

### Get Site Settings

Retrieve public site settings.

**Endpoint:** `GET /api/settings`

**Authentication:** Not required

**Response:** `200 OK`
```json
{
  "site_name": "My Blog",
  "site_description": "A blog about technology",
  "site_keywords": "blog, tech, programming",
  "site_url": "https://myblog.com",
  "home_title": "Welcome to My Blog",
  "home_subtitle": "Sharing knowledge and insights",
  "home_custom_content": "About section content...",
  "footer_text": "© 2024 My Blog. All rights reserved.",
  "logo_url": "https://myblog.com/logo.png"
}
```

---

## Admin Endpoints

All admin endpoints require authentication and admin role.

### Articles Management

#### List All Articles (Admin)

**Endpoint:** `GET /api/admin/articles`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (integer, default: 1)
- `page_size` (integer, default: 20)
- `status` (string): Filter by status ("draft" or "published")

**Response:** `200 OK`
```json
{
  "articles": [
    {
      "id": 1,
      "title": "Article Title",
      "slug": "article-slug",
      "author": {
        "id": 1,
        "email": "admin@example.com"
      },
      "visibility": "member_full",
      "is_pinned": false,
      "status": 1,
      "published_at": "2024-01-20T10:00:00Z",
      "created_at": "2024-01-20T09:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

---

#### Get Article by ID (Admin)

**Endpoint:** `GET /api/admin/articles/:id`

**Authentication:** Required (Admin only)

**Response:** `200 OK` (same structure as public article detail, but always full content)

---

#### Create Article

**Endpoint:** `POST /api/admin/articles`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "title": "New Article Title",
  "slug": "new-article-slug",
  "content": "Full article content in markdown...",
  "visibility": "member_full",
  "preview_percentage": 30,
  "preview_min_chars": 200,
  "preview_smart_paragraph": true
}
```

**Response:** `201 Created`
```json
{
  "id": 5,
  "title": "New Article Title",
  "slug": "new-article-slug",
  "content": "Full article content...",
  "author_id": 1,
  "visibility": "member_full",
  "status": 0,
  "created_at": "2024-01-20T14:00:00Z"
}
```

**Errors:**
- `400`: Invalid input (missing title, duplicate slug, etc.)
- `401`: Unauthorized
- `403`: Forbidden (not admin)

---

#### Update Article

**Endpoint:** `PUT /api/admin/articles/:id`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "visibility": "public_full",
  "preview_percentage": 40
}
```

**Response:** `200 OK` (updated article object)

---

#### Delete Article

**Endpoint:** `DELETE /api/admin/articles/:id`

**Authentication:** Required (Admin only)

**Response:** `200 OK`
```json
{
  "message": "Article deleted successfully"
}
```

---

#### Publish Article

**Endpoint:** `POST /api/admin/articles/:id/publish`

**Authentication:** Required (Admin only)

**Response:** `200 OK`
```json
{
  "message": "Article published successfully",
  "published_at": "2024-01-20T15:00:00Z"
}
```

---

#### Unpublish Article

**Endpoint:** `POST /api/admin/articles/:id/unpublish`

**Authentication:** Required (Admin only)

**Response:** `200 OK`

---

#### Pin Article

**Endpoint:** `POST /api/admin/articles/:id/pin`

**Authentication:** Required (Admin only)

**Response:** `200 OK`

---

#### Unpin Article

**Endpoint:** `POST /api/admin/articles/:id/unpin`

**Authentication:** Required (Admin only)

**Response:** `200 OK`

---

### User Management

#### List Users

**Endpoint:** `GET /api/admin/users`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (integer)
- `page_size` (integer)
- `status` (integer): Filter by status

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 2,
      "email": "user@example.com",
      "email_verified": true,
      "member_expire_at": null,
      "status": 0,
      "roles": ["user"],
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

---

#### Get User by ID

**Endpoint:** `GET /api/admin/users/:id`

**Authentication:** Required (Admin only)

**Response:** `200 OK` (detailed user object with roles)

---

#### Update User Status

**Endpoint:** `PUT /api/admin/users/:id/status`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "status": 1
}
```

**Response:** `200 OK`

**Status Values:**
- `0`: Active
- `1`: Disabled

---

#### Update User Membership

**Endpoint:** `PUT /api/admin/users/:id/membership`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "member_expire_at": "2025-01-20T00:00:00Z"
}
```

**Response:** `200 OK`

**Notes:**
- Set to `null` to remove membership
- ISO 8601 datetime format

---

#### Assign Role to User

**Endpoint:** `POST /api/admin/users/:id/roles`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "role_code": "member"
}
```

**Response:** `200 OK`

---

#### Remove Role from User

**Endpoint:** `DELETE /api/admin/users/:id/roles`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "role_code": "member"
}
```

**Response:** `200 OK`

---

#### Delete User

**Endpoint:** `DELETE /api/admin/users/:id`

**Authentication:** Required (Admin only)

**Response:** `200 OK`

**Notes:**
- Soft delete (user data retained but marked as deleted)

---

### Comment Management

#### Delete Comment

**Endpoint:** `DELETE /api/admin/comments/:id`

**Authentication:** Required (Admin only)

**Response:** `200 OK`

**Notes:**
- Soft delete: Comment marked as deleted but retained in database
- Content replaced with "[This comment has been deleted]"

---

### Roles Management

#### Get All Roles

**Endpoint:** `GET /api/admin/roles`

**Authentication:** Required (Admin only)

**Response:** `200 OK`
```json
{
  "roles": [
    {
      "id": 1,
      "code": "guest",
      "name": "Guest",
      "permissions": []
    },
    {
      "id": 2,
      "code": "user",
      "name": "User",
      "permissions": []
    },
    {
      "id": 3,
      "code": "member",
      "name": "Member",
      "permissions": []
    },
    {
      "id": 4,
      "code": "admin",
      "name": "Admin",
      "permissions": [
        {
          "id": 1,
          "code": "article.manage",
          "name": "Manage Articles"
        }
      ]
    }
  ]
}
```

---

### Site Settings Management

#### Update Site Settings

**Endpoint:** `PUT /api/admin/settings`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "site_name": "Updated Blog Name",
  "site_description": "New description",
  "home_title": "New home title",
  "logo_url": "https://example.com/new-logo.png"
}
```

**Response:** `200 OK`

**Notes:**
- Only provided fields are updated
- All fields are optional

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request or validation error |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

- Email verification resend: Max 3 requests per hour per user
- Comment creation: Max 10 comments per minute per user
- Login attempts: Max 5 failed attempts per 15 minutes per IP

## Changelog

### v2.0.0 (Current)
- Added email verification endpoints
- Added article pinning functionality
- Added smart content preview with configurable settings
- Added comprehensive user management endpoints
- Improved role-based access control
