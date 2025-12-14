.PHONY: run build test clean tidy

# Run the server
run:
	cd cmd/server && go run main.go

# Build the server
build:
	go build -o bin/server cmd/server/main.go

# Run tests
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f blog.db

# Tidy dependencies
tidy:
	go mod tidy

# Download dependencies
deps:
	go mod download

# Format code
fmt:
	go fmt ./...

# Lint code (requires golangci-lint)
lint:
	golangci-lint run

# Generate (placeholder for future code generation)
generate:
	go generate ./...
