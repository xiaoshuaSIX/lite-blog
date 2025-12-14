# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a role-based blog system with frontend (Next.js) and backend (Go). The system supports article publishing, reading, and permission-based content access control. Different user roles have different content visibility levels.

## User Roles & Permissions

- **Guest**: Unauthenticated users, can only view first 50% of article content
- **User**: Registered users, can view first 50% of content and post comments
- **Member**: Paid users, can view full article content
- **Admin**: Backend administrators with full access and management capabilities

## Architecture

```
[Next.js Frontend] — HTTP/JSON — [Go API Server] — SQLite Database
```

### Tech Stack
- **Frontend**: Next.js + React + TailwindCSS + shadcn/ui
- **Backend**: Go
- **Database**: SQLite (designed to be migratable to PostgreSQL/MySQL)

### Key Modules
- **Frontend**: Article list, article detail, comments, login/register, user center
- **Backend Admin**: Article management, role management, permission management, comment management
- **Shared**: Authentication (JWT + HttpOnly Cookie), RBAC, logging, database abstraction

## Database Schema

### Core Tables
- `users`: User accounts (id, username, email, password_hash, status, created_at)
- `roles`: Role definitions (id, code [guest/user/member/admin], name)
- `user_roles`: User-role mappings
- `permissions`: Permission definitions (id, code like "article.read_full")
- `role_permissions`: Role-permission mappings
- `articles`: Blog posts (id, title, slug, content, author_id, status, published_at)
- `comments`: Article comments (id, article_id, user_id, parent_id, content, is_deleted)
- `memberships`: Membership status (user_id, level, expire_at)

## Content Access Control Logic

Articles are served with content masking based on user role:
- **Guest/User**: Only first 50% of content is visible
- **Member/Admin**: Full content is visible

Backend should implement content masking logic similar to:
```go
func maskArticleContent(content string, role Role) (string, bool) {
    if role == Member || role == Admin {
        return content, true
    }
    runes := []rune(content)
    half := len(runes) / 2
    return string(runes[:half]), false
}
```

## API Structure

### Authentication
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Articles (Public)
- `GET /api/articles` - List articles with pagination
- `GET /api/articles/:slug` - Get article detail (content masked by role)

### Articles (Admin)
- `POST /api/admin/articles` - Create article
- `PUT /api/admin/articles/:id` - Update article
- `DELETE /api/admin/articles/:id` - Delete article

### Comments
- `GET /api/articles/:id/comments` - List comments
- `POST /api/articles/:id/comments` - Create comment (requires login)
- `DELETE /api/admin/comments/:id` - Delete comment (admin only)

### Roles & Permissions (Admin)
- `GET /api/admin/roles`
- `PUT /api/admin/roles/:id/permissions`

## Backend Structure (Go)

Recommended directory layout:
```
cmd/server/main.go
internal/
  api/handler/
  api/middleware/
  service/
  repository/
  model/
  config/
  auth/
pkg/logger/
```

### Middleware
- **AuthMiddleware**: Parse JWT, load user roles
- **RBACMiddleware**: Validate permissions by code
- **CORS/Logger/Recover**: Standard HTTP middleware

### Business Services
- **Auth**: Login, logout, user info
- **Article**: CRUD + content masking logic
- **Comment**: List, create, delete comments
- **Admin**: Manage articles, comments, roles, permissions
- **Membership**: Check if user is a member

## Frontend Structure (Next.js)

Recommended directory layout:
```
app/
  page.tsx              # Article list page
  login/                # Login page
  posts/[slug]/         # Article detail page
  admin/                # Admin dashboard
    articles/           # Article management
    comments/           # Comment management
    roles/              # Role management
```

### Data Fetching
- Use React Server Components (RSC) + fetch for SSR
- Use SWR or React Query for client-side data
- Authentication state via Cookie + `/api/me` endpoint

### Key Pages
- **Article List**: Display article summaries with pagination
- **Article Detail**: Show content based on user role, display "upgrade to member" prompt for non-members
- **Comments Section**: Allow logged-in users to post comments
- **Admin Pages**: Protected by admin role check

## Security Requirements

- Use bcrypt for password hashing
- JWT authentication with HttpOnly cookies
- All admin endpoints require admin role verification
- RBAC (Role-Based Access Control) for all protected resources

## Development Guidelines

- Use ORM (GORM/Ent/sqlc) for database layer to enable future migration
- RESTful API design principles
- Add indexes on: slug, article_id for performance
- Implement pagination for all list endpoints
- Support comment soft-deletion (is_deleted flag)
