# Contributing

Thanks for your interest in Lite Blog! This document covers local development, configuration, and useful references.

## Tech Stack
- Frontend: Next.js 16 (App Router), TailwindCSS + shadcn/ui, next-themes
- Backend: Go + Gin, GORM, SQLite (default), JWT + HttpOnly cookies

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

## Local Development

### Backend
```bash
cd backend
# Prepare config (edit secrets/JWT/email as needed)
cp configs/config.yaml configs/config.local.yaml  # optional copy for local overrides
go run cmd/server/main.go
# Server: http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend: http://localhost:3000
```

## Configuration Reference

### Backend (config.yaml)
```yaml
server:
  port: 8080
  mode: debug
database:
  path: ./blog.db
jwt:
  secret: your-secret-key
  expire_hours: 168
email:
  provider: ses
  from: noreply@yourdomain.com
  aws:
    region: us-east-1
cors:
  allowed_origins:
    - http://localhost:3000
```

### Frontend env
Create `frontend/.env.local` if you need an absolute API URL; otherwise the app will use relative `/api` when behind the Go proxy.
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Admin Account
After registering a user, you can promote it via SQL:
```sql
-- Get admin role ID
SELECT id FROM roles WHERE code = 'admin';
-- Add admin role to user (replace user_id)
INSERT INTO user_roles (user_id, role_id) VALUES (1, 4);
```
