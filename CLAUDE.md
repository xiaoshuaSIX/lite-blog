# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lite Blog is a modern, role-based blog system with a Next.js frontend and Go backend. The system features intelligent content preview/masking, article publishing, commenting, and comprehensive permission-based access control. It's designed to support membership-based content monetization with different visibility levels for different user tiers.

## User Roles & Permissions

- **Guest**: Unauthenticated users, can view public articles with content preview based on article visibility settings
- **User**: Registered users, can view content with preview (same as guest) and post comments (requires email verification)
- **Member**: Paid users, can view full content of member-restricted articles
- **Admin**: Backend administrators with full access to all content and management capabilities

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
- `users`: User accounts (id, email, password_hash, email_verified, member_expire_at, status, created_at)
- `roles`: Role definitions (id, code [guest/user/member/admin], name)
- `user_roles`: User-role mappings
- `permissions`: Permission definitions (id, code like "article.manage")
- `role_permissions`: Role-permission mappings
- `articles`: Blog posts (id, title, slug, content, author_id, visibility, preview_percentage, preview_min_chars, preview_smart_paragraph, is_pinned, status, published_at)
- `comments`: Article comments (id, article_id, user_id, parent_id, content, is_deleted)
- `settings`: Site settings (id, key, value)

## Content Access Control Logic

Articles support three visibility levels:
- **hidden**: Only admin can see
- **public_full**: Everyone can see full content
- **member_full**: Members/Admin see full content, others see preview

### Preview Settings (per article)
- `preview_percentage`: Percentage of content to show (default 30%)
- `preview_min_chars`: Minimum characters to show (default 200)
- `preview_smart_paragraph`: Whether to cut at paragraph boundaries (default true)

### Implementation
Backend implements smart content preview in `service/preview.go`:
- Calculates preview length based on percentage and minimum characters
- Optionally cuts at paragraph/sentence boundaries for better readability
- Returns preview status flag for frontend to show "upgrade to member" prompts

## API Structure

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info (requires auth)
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email (requires auth)

### Site Settings (Public)
- `GET /api/settings` - Get public site settings

### Articles (Public)
- `GET /api/articles` - List articles with pagination (optional auth for content preview)
- `GET /api/articles/:slug` - Get article detail (content masked by role, optional auth)

### Articles (Admin)
- `GET /api/admin/articles` - List all articles (admin only)
- `GET /api/admin/articles/:id` - Get article by ID (admin only)
- `POST /api/admin/articles` - Create article (admin only)
- `PUT /api/admin/articles/:id` - Update article (admin only)
- `DELETE /api/admin/articles/:id` - Delete article (admin only)
- `POST /api/admin/articles/:id/publish` - Publish article (admin only)
- `POST /api/admin/articles/:id/unpublish` - Unpublish article (admin only)
- `POST /api/admin/articles/:id/pin` - Pin article (admin only)
- `POST /api/admin/articles/:id/unpin` - Unpin article (admin only)

### Comments
- `GET /api/comments/article/:articleId` - List comments for an article (optional auth)
- `POST /api/comments/article/:articleId` - Create comment (requires auth)
- `DELETE /api/admin/comments/:id` - Delete comment (admin only)

### Users (Admin)
- `GET /api/admin/users` - List all users (admin only)
- `GET /api/admin/users/:id` - Get user by ID (admin only)
- `PUT /api/admin/users/:id/status` - Update user status (admin only)
- `PUT /api/admin/users/:id/membership` - Update user membership (admin only)
- `POST /api/admin/users/:id/roles` - Assign role to user (admin only)
- `DELETE /api/admin/users/:id/roles` - Remove role from user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

### Roles & Permissions (Admin)
- `GET /api/admin/roles` - Get all roles (admin only)

### Site Settings (Admin)
- `GET /api/admin/settings` - Get site settings (admin only)
- `PUT /api/admin/settings` - Update site settings (admin only)

## Backend Structure (Go)

Recommended directory layout:
```
cmd/server/main.go
internal/
  api/handler/
  api/middleware/
  api/router/
  service/
  repository/
  model/
  config/
pkg/
  jwt/
  logger/
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
    settings/           # Site settings management
    users/              # User management
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
