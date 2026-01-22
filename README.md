# Lite Blog

A modern, role-based blog system with intelligent content preview, built with Next.js and Go.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-1.24%2B-blue)](https://golang.org/dl/)
[![Next.js](https://img.shields.io/badge/next.js-16.0-black)](https://nextjs.org/)

[English](README.md) | [中文](README.zh-CN.md)

## Overview

Lite Blog is a full-stack blog platform designed for content creators who want to monetize their content through membership-based access control. The system features intelligent content preview/masking, allowing non-members to see a portion of premium content while encouraging upgrades.

### Key Features

- ✅ **Role-Based Access Control (RBAC)**: Four-tier permission system (Guest, User, Member, Admin)
- ✅ **Intelligent Content Preview**: Configurable content masking with smart paragraph boundaries
- ✅ **Email Verification**: Secure user authentication with AWS SES email verification
- ✅ **Modern UI/UX**: Dark mode support, responsive design, internationalization (English/Chinese)
- ✅ **Admin Dashboard**: Comprehensive management interface for articles, users, and settings
- ✅ **Article Management**: Draft/publish workflow, article pinning, visibility control
- ✅ **Comment System**: Nested comments with soft-deletion support
- ✅ **SEO Friendly**: Dynamic meta tags, sitemap support
- ✅ **Docker Ready**: One-command deployment with Docker/Docker Compose

### Architecture

```
┌─────────────────┐      HTTP/JSON      ┌──────────────────┐
│  Next.js 16     │ ←─────────────────→ │   Go + Gin       │
│  (Frontend)     │                     │   (Backend API)   │
│  React 19       │                     │   GORM ORM       │
└─────────────────┘                     └──────────────────┘
                                                 │
                                                 ↓
                                        ┌──────────────────┐
                                        │  SQLite / MySQL  │
                                        │   / PostgreSQL   │
                                        └──────────────────┘
```

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
  - [Docker Deployment](#docker-deployment)
  - [Docker Compose](#docker-compose)
- [Local Development](#local-development)
- [Configuration](#configuration)
- [User Roles](#user-roles)
- [Content Visibility](#content-visibility)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

### Docker Deployment

Deploy Lite Blog in seconds with Docker:

```bash
docker run -d --name lite-blog \
  -p 80:8080 \
  -v blog-data:/app/data \
  -e JWT_SECRET=your-super-secret-key-change-me \
  -e AWS_ACCESS_KEY_ID=your_aws_key \
  -e AWS_SECRET_ACCESS_KEY=your_aws_secret \
  -e AWS_REGION=us-east-1 \
  -e CORS_ORIGINS=https://yourdomain.com \
  -e ADMIN_EMAIL=admin@yourdomain.com \
  -e ADMIN_PASSWORD=secure-password \
  xiaoshuai66/lite-blog:latest
```

**Important Notes:**
- Replace `your-super-secret-key-change-me` with a strong random string
- Set `AWS_*` variables for email verification (AWS SES)
- For local testing: use `CORS_ORIGINS=http://localhost`
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are optional but recommended for first-time setup

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  lite-blog:
    image: xiaoshuai66/lite-blog:latest
    container_name: lite-blog
    restart: unless-stopped
    ports:
      - "80:8080"
    environment:
      # Required
      JWT_SECRET: your-super-secret-key-change-me
      
      # Email Configuration (AWS SES)
      AWS_ACCESS_KEY_ID: your_aws_access_key
      AWS_SECRET_ACCESS_KEY: your_aws_secret_key
      AWS_REGION: us-east-1
      EMAIL_FROM: noreply@yourdomain.com
      
      # CORS
      CORS_ORIGINS: https://yourdomain.com
      
      # Server
      SERVER_PORT: 8080
      SERVER_MODE: release
      DATABASE_PATH: /app/data/blog.db
      
      # Optional: Auto-create admin account
      ADMIN_EMAIL: admin@yourdomain.com
      ADMIN_PASSWORD: secure-password
    volumes:
      - blog-data:/app/data
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  blog-data:
    driver: local
```

Start the service:

```bash
docker compose up -d
```

Access your blog at `http://localhost` (or your domain).

## Local Development

For local development without Docker, see [CONTRIBUTING.md](CONTRIBUTING.md).

**Quick setup:**

1. **Backend**:
   ```bash
   cd backend
   cp .env.example .env  # Configure your settings
   go mod download
   go run cmd/server/main.go  # Runs on :8080
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev  # Runs on :3000
   ```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for JWT signing (use strong random string) |
| `AWS_ACCESS_KEY_ID` | Yes* | - | AWS access key for SES email service |
| `AWS_SECRET_ACCESS_KEY` | Yes* | - | AWS secret key for SES |
| `AWS_REGION` | Yes* | `us-east-1` | AWS region for SES |
| `EMAIL_FROM` | No | - | Email sender address |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `SERVER_PORT` | No | `8080` | Backend server port |
| `SERVER_MODE` | No | `debug` | Server mode (`debug` or `release`) |
| `DATABASE_PATH` | No | `./blog.db` | SQLite database file path |
| `ADMIN_EMAIL` | No | - | Auto-create admin with this email on first start |
| `ADMIN_PASSWORD` | No | - | Password for auto-created admin |
| `FRONTEND_PROXY` | No | - | Frontend dev server URL (dev only) |

*Required for email verification functionality.

### Database

**SQLite (Default):**
- Ideal for small to medium deployments
- Zero configuration
- Stored at `/app/data/blog.db` in Docker

**PostgreSQL/MySQL (Production):**
- Update `DATABASE_PATH` to connection string
- Modify GORM driver in backend code
- Recommended for high-traffic production use

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Guest** | Unauthenticated visitors | View public articles (with preview), browse article list |
| **User** | Registered users | Same as Guest + post comments (requires email verification) |
| **Member** | Paid/premium users | View full content of member-restricted articles, post comments |
| **Admin** | Site administrators | Full access: manage articles, users, comments, site settings |

## Content Visibility

Articles support three visibility levels:

1. **`public_full`**: Everyone sees full content
2. **`member_full`**: Members/Admin see full content; others see intelligent preview
3. **`hidden`**: Only Admin can see

### Intelligent Preview System

For `member_full` articles, non-members see a smart preview based on configurable settings:

- **Preview Percentage** (default 30%): How much content to show
- **Minimum Characters** (default 200): Minimum preview length
- **Smart Paragraph** (default true): Cut at paragraph boundaries for better readability

Example: A 1000-word article with 30% preview shows ~300 words, cut at the nearest paragraph end.

## Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development setup, project structure, contribution guidelines
- **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete REST API documentation
- **[docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** - Detailed development guide, code standards, testing
- **[CLAUDE.md](CLAUDE.md)** - AI assistant context (project overview for AI tools)

## Disclaimer

⚠️ **Important Security Notes:**

- This software is provided "as-is" for educational and personal use
- **Always** use a strong `JWT_SECRET` (32+ random characters)
- Configure **HTTPS/TLS** in production (use reverse proxy like Nginx/Caddy)
- **Backup** your database regularly (especially `/app/data` volume)
- Review security settings before deploying to production
- SQLite is suitable for small/personal blogs; consider PostgreSQL/MySQL for production scale

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development environment setup
- Code style guidelines
- Testing procedures
- Pull request process

**Quick contribution steps:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Plugin system for extensibility
- [ ] Markdown editor with live preview
- [ ] RSS feed support
- [ ] Full-text search
- [ ] Image upload and management
- [ ] Social media integration
- [ ] Analytics dashboard
- [ ] Payment gateway integration
- [ ] Multi-language content support

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui components
- next-themes (dark mode)

**Backend:**
- Go 1.24
- Gin web framework
- GORM ORM
- JWT authentication
- AWS SES (email)

**Database:**
- SQLite (default)
- PostgreSQL/MySQL compatible

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Gin](https://gin-gonic.com/) - Go web framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [GORM](https://gorm.io/) - Go ORM

---

**Made with ❤️ by the Lite Blog Team**

If you find this project helpful, please consider giving it a ⭐ on GitHub!
