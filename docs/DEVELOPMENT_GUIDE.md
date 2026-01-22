# Development Guide

This guide provides detailed information for developers working on Lite Blog.

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Database Migrations](#database-migrations)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)

## Development Environment Setup

### Prerequisites
- **Go**: 1.24.0 or higher
- **Node.js**: 18.x or higher
- **SQLite**: Built-in (no installation needed)
- **Git**: For version control

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Go dependencies:
```bash
go mod download
```

3. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
go run cmd/server/main.go
# Migrations run automatically on startup
```

5. Start the development server:
```bash
go run cmd/server/main.go
# Server runs on http://localhost:8080
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install npm dependencies:
```bash
npm install
```

3. Create local environment file (optional):
```bash
cp .env.example .env.local
# Configure NEXT_PUBLIC_API_URL if needed
```

4. Start the development server:
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

## Code Standards

### Go Backend Standards

#### Project Structure
Follow the standard Go project layout:
- `cmd/`: Application entry points
- `internal/`: Private application code
  - `api/`: HTTP handlers, middleware, routing
  - `service/`: Business logic layer
  - `repository/`: Data access layer
  - `model/`: Database models and domain types
  - `config/`: Configuration management
- `pkg/`: Public library code (reusable across projects)

#### Naming Conventions
- **Files**: Use lowercase with underscores (e.g., `article_service.go`)
- **Packages**: Short, lowercase, single word (e.g., `handler`, `service`)
- **Interfaces**: Noun or adjective ending in "er" (e.g., `Repository`, `Handler`)
- **Functions**: PascalCase for exported, camelCase for unexported
- **Variables**: camelCase (e.g., `userRepo`, `articleID`)
- **Constants**: PascalCase or UPPER_SNAKE_CASE (e.g., `RoleCodeAdmin`, `USER_STATUS_ACTIVE`)

#### Error Handling
```go
// Always check and handle errors
result, err := someFunction()
if err != nil {
    return fmt.Errorf("failed to perform action: %w", err)
}

// Use custom error types for business logic
type NotFoundError struct {
    Resource string
    ID       interface{}
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s with ID %v not found", e.Resource, e.ID)
}
```

#### Logging
```go
// Use structured logging
logger.Info("User logged in", 
    "user_id", user.ID,
    "email", user.Email,
)

logger.Error("Failed to create article",
    "error", err,
    "user_id", userID,
)
```

#### Database Queries
```go
// Use GORM best practices
// Always preload relationships when needed
var article model.Article
if err := db.Preload("Author").First(&article, id).Error; err != nil {
    return nil, err
}

// Use transactions for multiple operations
err := db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&article).Error; err != nil {
        return err
    }
    if err := tx.Create(&comment).Error; err != nil {
        return err
    }
    return nil
})
```

### Frontend Standards

#### Component Organization
```
components/
  ├── ui/              # Reusable UI components (buttons, inputs, etc.)
  ├── layout/          # Layout components (header, footer, sidebar)
  ├── auth/            # Authentication-related components
  ├── comments/        # Comment-related components
  └── home/            # Home page specific components
```

#### TypeScript Best Practices
```typescript
// Define interfaces for API responses
interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  author: User;
  visibility: 'hidden' | 'public_full' | 'member_full';
  is_preview?: boolean;
  created_at: string;
}

// Use type-safe API calls
async function fetchArticle(slug: string): Promise<Article> {
  const response = await fetch(`/api/articles/${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch article');
  }
  return response.json();
}
```

#### Component Standards
```typescript
// Use functional components with TypeScript
interface ArticleCardProps {
  article: Article;
  showPreview?: boolean;
}

export function ArticleCard({ article, showPreview = false }: ArticleCardProps) {
  return (
    <div className="article-card">
      <h2>{article.title}</h2>
      {/* Component content */}
    </div>
  );
}

// Use React Server Components for data fetching
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await fetchArticle(params.slug);
  
  return <ArticleDetail article={article} />;
}
```

#### Styling Guidelines
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Use shadcn/ui components as base
- Maintain consistent spacing and typography

```tsx
// Good: Use Tailwind utility classes
<div className="flex flex-col gap-4 p-6 md:flex-row md:gap-6 md:p-8">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
    {title}
  </h1>
</div>

// Avoid: Inline styles unless absolutely necessary
<div style={{ display: 'flex', padding: '24px' }}>
```

## Testing

### Backend Testing

#### Unit Tests
```go
// Use table-driven tests
func TestArticleService_GetBySlug(t *testing.T) {
    tests := []struct {
        name    string
        slug    string
        want    *model.Article
        wantErr bool
    }{
        {
            name: "existing article",
            slug: "test-article",
            want: &model.Article{ID: 1, Slug: "test-article"},
            wantErr: false,
        },
        {
            name: "non-existent article",
            slug: "missing",
            want: nil,
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := service.GetBySlug(tt.slug)
            if (err != nil) != tt.wantErr {
                t.Errorf("GetBySlug() error = %v, wantErr %v", err, tt.wantErr)
                return
            }
            // Add assertions
        })
    }
}
```

#### Integration Tests
```go
// Test API endpoints
func TestArticleAPI_Create(t *testing.T) {
    router := setupTestRouter()
    
    body := `{"title":"Test","content":"Content","visibility":"public_full"}`
    req, _ := http.NewRequest("POST", "/api/admin/articles", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+testToken)
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusCreated, w.Code)
}
```

### Frontend Testing

#### Component Tests (Jest/React Testing Library)
```typescript
import { render, screen } from '@testing-library/react';
import { ArticleCard } from './article-card';

describe('ArticleCard', () => {
  it('renders article title', () => {
    const article = { id: 1, title: 'Test Article', /* ... */ };
    render(<ArticleCard article={article} />);
    
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });
});
```

## Database Migrations

### Auto-Migration (Development)
The application uses GORM's auto-migration feature. Models are automatically migrated on startup:

```go
// internal/model/migrate.go
func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &User{},
        &Role{},
        &Permission{},
        &Article{},
        &Comment{},
        &Setting{},
    )
}
```

### Manual SQL Migrations (Production)
For production, create explicit migration files:

```sql
-- migrations/001_create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
```

### Adding New Fields
1. Update the model struct in `internal/model/`
2. Add GORM tags for database constraints
3. Test locally with auto-migration
4. Create manual migration file for production

## Debugging

### Backend Debugging

#### Enable Debug Mode
```yaml
# configs/config.yaml
server:
  mode: debug  # gin debug mode
```

#### View SQL Queries
```go
// Enable GORM logger
db.Logger = logger.Default.LogMode(logger.Info)
```

#### Use Delve Debugger
```bash
# Install delve
go install github.com/go-delve/delve/cmd/dlv@latest

# Start debugger
dlv debug cmd/server/main.go
```

### Frontend Debugging

#### React DevTools
Install React Developer Tools browser extension for component inspection.

#### Network Debugging
```typescript
// Add request/response logging
const response = await fetch(url);
console.log('Response:', response.status, await response.json());
```

#### Next.js Debug Mode
```bash
# Run with verbose logging
NODE_OPTIONS='--inspect' npm run dev
```

## Performance Optimization

### Backend Optimization

#### Database Indexing
```go
// Add indexes to frequently queried fields
type Article struct {
    // ...
    Slug      string `gorm:"uniqueIndex;size:255"`
    AuthorID  uint   `gorm:"index"`
    IsPinned  bool   `gorm:"index"`
}
```

#### Query Optimization
```go
// Use pagination for large datasets
func (r *ArticleRepository) List(page, pageSize int) ([]model.Article, error) {
    var articles []model.Article
    offset := (page - 1) * pageSize
    
    err := r.db.
        Preload("Author").
        Order("is_pinned DESC, published_at DESC").
        Limit(pageSize).
        Offset(offset).
        Find(&articles).Error
    
    return articles, err
}

// Avoid N+1 queries with Preload
db.Preload("Author").Preload("Comments.User").Find(&articles)
```

#### Caching (Future Enhancement)
Consider implementing Redis cache for:
- Frequently accessed articles
- User sessions
- Site settings

### Frontend Optimization

#### Image Optimization
```tsx
import Image from 'next/image';

<Image
  src="/article-image.jpg"
  alt="Article"
  width={800}
  height={600}
  loading="lazy"
/>
```

#### Code Splitting
```tsx
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const MarkdownEditor = dynamic(() => import('./markdown-editor'), {
  loading: () => <p>Loading editor...</p>,
});
```

#### API Response Caching
```typescript
// Use SWR for client-side caching
import useSWR from 'swr';

function useArticles() {
  const { data, error } = useSWR('/api/articles', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });
  
  return { articles: data, error, isLoading: !data && !error };
}
```

## Git Workflow

### Commit Messages
Follow conventional commits:
```
feat: add article pinning functionality
fix: resolve preview calculation bug
docs: update API documentation
refactor: simplify auth middleware
test: add user service tests
chore: update dependencies
```

### Branch Naming
```
feature/article-pinning
bugfix/preview-calculation
hotfix/security-patch
```

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation if needed
4. Submit PR with clear description
5. Address review comments
6. Merge after approval

## Additional Resources

- [Go Best Practices](https://golang.org/doc/effective_go)
- [Next.js Documentation](https://nextjs.org/docs)
- [GORM Documentation](https://gorm.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
