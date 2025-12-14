# ===========================================
# Stage 1: Build Backend
# ===========================================
FROM golang:1.23-alpine AS backend-builder

# Allow toolchain auto-download for newer Go requirements
ENV GOTOOLCHAIN=auto

RUN apk add --no-cache gcc musl-dev git

WORKDIR /app/backend

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .

RUN CGO_ENABLED=1 GOOS=linux go build -a -ldflags '-linkmode external -extldflags "-static"' -o server ./cmd/server

# ===========================================
# Stage 2: Build Frontend
# ===========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ===========================================
# Stage 3: Runtime
# ===========================================
FROM node:20-alpine AS runtime

RUN apk add --no-cache ca-certificates tzdata supervisor

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend/server ./backend/server
COPY --from=backend-builder /app/backend/configs ./backend/configs

# Copy frontend
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static

# Create data directory
RUN mkdir -p /app/data

# Create supervisord config
RUN mkdir -p /etc/supervisor.d
COPY <<EOF /etc/supervisor.d/lite-blog.ini
[supervisord]
nodaemon=true
user=root

[program:backend]
command=/app/backend/server
directory=/app/backend
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:frontend]
command=node /app/frontend/server.js
directory=/app/frontend
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=PORT=3000,HOSTNAME="0.0.0.0"
EOF

# Environment variables
ENV SERVER_PORT=8080
ENV SERVER_MODE=release
ENV DATABASE_PATH=/app/data/blog.db
ENV JWT_SECRET=change-this-in-production
ENV NODE_ENV=production

# Expose ports
EXPOSE 3000 8080

CMD ["supervisord", "-c", "/etc/supervisor.d/lite-blog.ini"]
