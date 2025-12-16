# Lite Blog

A role-based blog system with member content preview, built with Next.js and Go.

[English](README.md) | [中文](README.zh-CN.md)

## Features
- **Role-Based Access Control (RBAC)**: Guest, User, Member, Admin with fine-grained permissions
- **Content Preview**: Member-only content offers smart previews to non-members
- **Authentication**: JWT + HttpOnly cookies with email verification
- **Theming & i18n**: Dark mode and Chinese/English UI
- **Admin Dashboard**: Manage articles, users, and site settings

## Disclaimer
- Use at your own risk; review security and compliance before production.
- Always set a strong `JWT_SECRET`, configure TLS/HTTPS, and back up the data volume.
- The default SQLite storage (`/app/data/blog.db`) is suited for small/self-hosted setups—migrate to a managed DB for production scale.

## Quick Start (Docker)

### Docker (single container)
```bash
docker run -d --name lite-blog \
  -p 80:8080 \
  -v blog-data:/app/data \
  -e JWT_SECRET=please-change-me \
  -e AWS_ACCESS_KEY_ID=your_access_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret_key \
  -e AWS_REGION=us-east-1 \
  -e CORS_ORIGINS=https://your-domain.com \
  -e FRONTEND_PROXY=http://localhost:3000 \
  -e ADMIN_EMAIL=admin@your-domain.com \   # optional
  -e ADMIN_PASSWORD=strong-password \      # optional
  xiaoshuai66/lite-blog:latest
```
Notes:
- If testing locally without TLS, set `CORS_ORIGINS=http://localhost`.
- The container listens on 8080; mapping `80:8080` exposes it on port 80.
- `ADMIN_EMAIL`/`ADMIN_PASSWORD` are optional—set them to auto-create an admin on first start.

### Docker Compose
```yaml
services:
  lite-blog:
    image: xiaoshuai66/lite-blog:latest
    container_name: lite-blog
    restart: unless-stopped
    ports:
      - "80:8080"
    environment:
      JWT_SECRET: please-change-me
      AWS_ACCESS_KEY_ID: your_access_key
      AWS_SECRET_ACCESS_KEY: your_secret_key
      AWS_REGION: us-east-1
      CORS_ORIGINS: https://your-domain.com
      FRONTEND_PROXY: http://localhost:3000
      SERVER_PORT: 8080
      SERVER_MODE: release
      DATABASE_PATH: /app/data/blog.db
      ADMIN_EMAIL: admin@your-domain.com   # optional
      ADMIN_PASSWORD: strong-password      # optional
    volumes:
      - blog-data:/app/data

volumes:
  blog-data:
    driver: local
```
Run with:
```bash
docker compose up -d
```

## Contributing
See `CONTRIBUTING.md` for local development, architecture, and API details.
