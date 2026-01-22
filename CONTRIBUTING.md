# Contributing to Lite Blog

Thanks for your interest in contributing to Lite Blog! This document covers local development setup, configuration, and contribution guidelines.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Additional Resources](#additional-resources)

## Getting Started

### Prerequisites
- **Go**: 1.24.0 or higher
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **SQLite**: Built-in (no separate installation needed)
- **Git**: For version control

## Development Setup

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS 4 + shadcn/ui, next-themes
- **Backend**: Go 1.24 + Gin, GORM, SQLite (default), JWT + HttpOnly cookies
- **Database**: SQLite (development), PostgreSQL/MySQL compatible (production)

### Clone the Repository
```bash
git clone https://github.com/yourusername/lite-blog-2.0.git
cd lite-blog-2.0
```
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

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Go dependencies:
```bash
go mod download
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings (see Configuration section below)
```

4. Run the server:
```bash
go run cmd/server/main.go
# Server will start on http://localhost:8080
# Database migrations run automatically
```

Alternatively, use the Makefile:
```bash
make run    # Run server
make build  # Build binary
make test   # Run tests
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional):
```bash
# Create .env.local if you need custom API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
```

4. Run development server:
```bash
npm run dev
# Frontend will start on http://localhost:3000
```

Other commands:
```bash
npm run build  # Build for production
npm run start  # Start production server
npm run lint   # Run ESLint
```

### Full Stack Development

Run both backend and frontend simultaneously in separate terminal windows for full development experience.

## Project Structure

```
lite-blog-2.0/
├── backend/
│   ├── cmd/server/          # Application entry point
│   ├── internal/
│   │   ├── api/             # HTTP handlers, middleware, router
│   │   │   ├── handler/     # Request handlers
│   │   │   ├── middleware/  # HTTP middleware
│   │   │   └── router/      # Route definitions
│   │   ├── config/          # Configuration management
│   │   ├── model/           # Database models
│   │   ├── repository/      # Data access layer
│   │   └── service/         # Business logic
│   ├── pkg/                 # Shared packages
│   │   ├── jwt/             # JWT utilities
│   │   └── logger/          # Logging utilities
│   ├── configs/             # Configuration files
│   ├── go.mod               # Go dependencies
│   └── Makefile             # Build automation
├── frontend/
│   ├── app/                 # Next.js pages (App Router)
│   │   ├── (auth)/          # Auth-related pages
│   │   ├── admin/           # Admin dashboard
│   │   ├── posts/           # Article pages
│   │   └── api/             # API routes (if any)
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components
│   │   ├── auth/            # Auth components
│   │   └── comments/        # Comment components
│   ├── lib/                 # Utilities and API clients
│   ├── providers/           # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── public/              # Static assets
├── docs/                    # Documentation
│   ├── API_REFERENCE.md     # API documentation
│   ├── DEVELOPMENT_GUIDE.md # Development guide
│   └── *.md                 # Other documentation
├── CLAUDE.md                # AI assistant context
├── CONTRIBUTING.md          # This file
└── README.md                # Project overview
```

## Configuration

### Backend Configuration

The backend can be configured via environment variables or a YAML config file.

#### Environment Variables (.env)
```env
# Server
SERVER_PORT=8080
SERVER_MODE=debug                    # debug or release
FRONTEND_PROXY=http://localhost:3000 # Next.js dev server

# Database
DATABASE_PATH=./blog.db              # SQLite database file

# JWT
JWT_SECRET=your-super-secret-key     # CHANGE THIS!
JWT_EXPIRE_HOURS=168                 # 7 days

# Email (AWS SES)
EMAIL_PROVIDER=ses
EMAIL_FROM=noreply@yourdomain.com
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Admin (optional, for first-time setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
```

#### Config File (configs/config.yaml)
```yaml
server:
  port: 8080
  mode: debug
  frontend_proxy: http://localhost:3000

database:
  path: ./blog.db

jwt:
  secret: your-super-secret-key
  expire_hours: 168

email:
  provider: ses
  from: noreply@yourdomain.com
  aws:
    region: us-east-1
    access_key_id: ${AWS_ACCESS_KEY_ID}
    secret_access_key: ${AWS_SECRET_ACCESS_KEY}

cors:
  allowed_origins:
    - http://localhost:3000
    - https://yourdomain.com
```

**Note:** Environment variables take precedence over config file values.

### Frontend Configuration

#### Environment Variables (.env.local)
```env
# API Base URL (optional)
# If not set, API calls use relative paths (works with backend proxy)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Testing

### Backend Tests

Run Go tests:
```bash
cd backend
go test ./...                    # Run all tests
go test -v ./internal/service/... # Run service tests with verbose output
go test -cover ./...             # Run tests with coverage
```

### Frontend Tests

Run frontend tests (when implemented):
```bash
cd frontend
npm test                         # Run tests
npm test -- --coverage           # Run with coverage
```

## Submitting Changes

### Code Style

- **Go**: Follow [Effective Go](https://golang.org/doc/effective_go) guidelines
  - Use `gofmt` for formatting
  - Use `golint` for linting
  - Follow standard Go project layout

- **TypeScript/React**: Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
  - Use ESLint for linting
  - Use Prettier for formatting (integrated with ESLint)
  - Follow React best practices

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add article pinning functionality
fix(auth): resolve JWT expiration bug
docs(readme): update installation instructions
refactor(service): simplify preview calculation logic
```

### Pull Request Process

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following code style guidelines

3. **Test your changes** thoroughly
   - Add tests for new features
   - Ensure all existing tests pass
   - Test manually in browser

4. **Update documentation** if needed
   - Update README.md for user-facing changes
   - Update API_REFERENCE.md for API changes
   - Update CLAUDE.md for architectural changes

5. **Commit your changes** using conventional commit format
   ```bash
   git commit -m "feat(articles): add search functionality"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - Testing steps

8. **Address review feedback** and update PR as needed

### Creating an Admin Account (Development)

After first registration, promote a user to admin via SQL:

```sql
-- Find the user ID
SELECT id, email FROM users WHERE email = 'your@email.com';

-- Find the admin role ID
SELECT id FROM roles WHERE code = 'admin';

-- Assign admin role to user (replace 1 with actual user_id and 4 with admin role_id)
INSERT INTO user_roles (user_id, role_id) VALUES (1, 4);
```

Or use the environment variables on first startup:
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
```

## Additional Resources

### Documentation
- [API Reference](docs/API_REFERENCE.md) - Complete API documentation
- [Development Guide](docs/DEVELOPMENT_GUIDE.md) - Detailed development guide
- [Project Requirements](docs/blog_prd_v2.md) - Product requirements (Chinese)
- [TDD Documentation](docs/blog_tdd_v2.md) - Technical design (Chinese)

### External Resources
- [Go Documentation](https://golang.org/doc/)
- [Gin Framework](https://gin-gonic.com/docs/)
- [GORM](https://gorm.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Getting Help

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers for security issues

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive environment for all contributors.

---

Thank you for contributing to Lite Blog! 🎉

