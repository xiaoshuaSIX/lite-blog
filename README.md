# Lite Blog

A role-based blog system with member content preview, built with Next.js and Go.

[English](README.md) | [中文](README.zh-CN.md)

## Features

- **Role-Based Access Control (RBAC)**: Guest, User, Member, and Admin roles with different permissions
- **Content Preview**: Non-members see a preview of member-only content with smart paragraph truncation
- **Authentication**: JWT-based authentication with email verification
- **Multi-language Support**: Chinese and English interface
- **Dark Mode**: System-aware theme switching
- **Admin Dashboard**: Manage articles, users, and site settings
- **Customizable Site Settings**: Configure site name, description, homepage content, and more

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **Theme**: next-themes
- **i18n**: Custom implementation with React Context

### Backend
- **Language**: Go
- **Framework**: Gin
- **ORM**: GORM
- **Database**: SQLite (easily migratable to PostgreSQL/MySQL)
- **Authentication**: JWT with HttpOnly cookies

## Quick Start

### Prerequisites

- Go 1.21+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Copy config file
cp configs/config.example.yaml configs/config.yaml

# Edit config.yaml with your settings (JWT secret, email config, etc.)

# Run the server
go run cmd/server/main.go

# Server runs at http://localhost:8080
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Server runs at http://localhost:3000
```

## Project Structure

```
lite-blog-2.0/
├── backend/
│   ├── cmd/server/          # Application entry point
│   ├── internal/
│   │   ├── api/             # HTTP handlers, middleware, router
│   │   ├── config/          # Configuration
│   │   ├── model/           # Database models
│   │   ├── repository/      # Data access layer
│   │   └── service/         # Business logic
│   ├── pkg/                 # Shared packages
│   └── configs/             # Configuration files
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API clients
│   ├── providers/           # React Context providers
│   └── hooks/               # Custom hooks
└── docs/                    # Documentation
```

## User Roles

| Role | Code | Permissions |
|------|------|-------------|
| Guest | guest | View article previews |
| User | user | View previews, post comments |
| Member | member | View full articles, post comments |
| Admin | admin | Full access |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email

### Articles
- `GET /api/articles` - List published articles
- `GET /api/articles/:slug` - Get article by slug

### Comments
- `GET /api/comments/article/:articleId` - Get article comments
- `POST /api/comments/article/:articleId` - Post comment (requires login)

### Settings
- `GET /api/settings` - Get site settings

### Admin
- `GET /api/admin/articles` - List all articles
- `GET /api/admin/articles/:id` - Get article by ID
- `POST /api/admin/articles` - Create article
- `PUT /api/admin/articles/:id` - Update article
- `DELETE /api/admin/articles/:id` - Delete article
- `POST /api/admin/articles/:id/publish` - Publish article
- `POST /api/admin/articles/:id/unpublish` - Unpublish article
- `DELETE /api/admin/comments/:id` - Delete comment
- `GET /api/admin/settings` - Get site settings
- `PUT /api/admin/settings` - Update site settings

## Configuration

### Backend Configuration (config.yaml)

```yaml
server:
  port: 8080
  mode: debug

database:
  driver: sqlite
  dsn: blog.db

jwt:
  secret: your-secret-key
  expire_hours: 168

email:
  provider: ses
  from: noreply@yourdomain.com
  region: us-east-1

cors:
  allowed_origins:
    - http://localhost:3000
```

### Frontend Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Creating Admin User

After registering a user, manually add the admin role in the database:

```sql
-- Get admin role ID
SELECT id FROM roles WHERE code = 'admin';

-- Add admin role to user (replace user_id with actual ID)
INSERT INTO user_roles (user_id, role_id) VALUES (1, 4);
```

## Development

### Backend Development

```bash
cd backend
go run cmd/server/main.go
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Build for Production

Backend:
```bash
cd backend
go build -o bin/server cmd/server/main.go
```

Frontend:
```bash
cd frontend
npm run build
npm start
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
