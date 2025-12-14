# Build stage
FROM golang:1.23-alpine AS builder

# Allow toolchain auto-download for newer Go requirements
ENV GOTOOLCHAIN=auto

# Install build dependencies
RUN apk add --no-cache gcc musl-dev git

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux \
    go build -a -ldflags '-linkmode external -extldflags "-static"' \
    -o server ./cmd/server

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .

# Copy config files
COPY --from=builder /app/configs ./configs

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment variables (DO NOT hardcode secrets in prod)
ENV SERVER_PORT=8080
ENV SERVER_MODE=release
ENV DATABASE_PATH=/app/data/blog.db
ENV JWT_SECRET=change-this-in-production

EXPOSE 8080

CMD ["./server"]