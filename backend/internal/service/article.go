package service

import (
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/repository"
)

var (
	ErrArticleNotFound = errors.New("article not found")
	ErrSlugExists      = errors.New("slug already exists")
	ErrInvalidSlug     = errors.New("invalid slug format")
)

type ArticleService struct {
	articleRepo *repository.ArticleRepository
}

func NewArticleService(articleRepo *repository.ArticleRepository) *ArticleService {
	return &ArticleService{
		articleRepo: articleRepo,
	}
}

// ArticleResponse represents the response for an article
type ArticleResponse struct {
	ID                    uint                    `json:"id"`
	Title                 string                  `json:"title"`
	Slug                  string                  `json:"slug"`
	Content               string                  `json:"content"`
	AuthorID              uint                    `json:"author_id"`
	AuthorEmail           string                  `json:"author_email,omitempty"`
	Visibility            model.ArticleVisibility `json:"visibility"`
	PreviewPercentage     int                     `json:"preview_percentage"`
	PreviewMinChars       int                     `json:"preview_min_chars"`
	PreviewSmartParagraph bool                    `json:"preview_smart_paragraph"`
	Status                model.ArticleStatus     `json:"status"`
	PublishedAt           *time.Time              `json:"published_at,omitempty"`
	CreatedAt             time.Time               `json:"created_at"`
	UpdatedAt             time.Time               `json:"updated_at"`
	IsPreview             bool                    `json:"is_preview"`
}

// ArticleListItem represents a summary item for article lists
type ArticleListItem struct {
	ID          uint                    `json:"id"`
	Title       string                  `json:"title"`
	Slug        string                  `json:"slug"`
	Excerpt     string                  `json:"excerpt"`
	AuthorID    uint                    `json:"author_id"`
	AuthorEmail string                  `json:"author_email,omitempty"`
	Visibility  model.ArticleVisibility `json:"visibility"`
	Status      model.ArticleStatus     `json:"status"`
	PublishedAt *time.Time              `json:"published_at,omitempty"`
	CreatedAt   time.Time               `json:"created_at"`
}

// CreateArticle creates a new article
func (s *ArticleService) CreateArticle(
	title, slug, content string,
	authorID uint,
	visibility model.ArticleVisibility,
	previewPercentage, previewMinChars int,
	previewSmartParagraph bool,
) (*model.Article, error) {
	// Validate and normalize slug
	slug = s.normalizeSlug(slug)
	if !s.isValidSlug(slug) {
		return nil, ErrInvalidSlug
	}

	// Check if slug exists
	if s.articleRepo.ExistsBySlug(slug) {
		return nil, ErrSlugExists
	}

	article := &model.Article{
		Title:                 title,
		Slug:                  slug,
		Content:               content,
		AuthorID:              authorID,
		Visibility:            visibility,
		PreviewPercentage:     previewPercentage,
		PreviewMinChars:       previewMinChars,
		PreviewSmartParagraph: previewSmartParagraph,
		Status:                model.ArticleStatusDraft,
	}

	if err := s.articleRepo.Create(article); err != nil {
		return nil, err
	}

	return article, nil
}

// UpdateArticle updates an existing article
func (s *ArticleService) UpdateArticle(
	id uint,
	title, slug, content string,
	visibility model.ArticleVisibility,
	previewPercentage, previewMinChars int,
	previewSmartParagraph bool,
) (*model.Article, error) {
	article, err := s.articleRepo.FindByID(id)
	if err != nil {
		return nil, ErrArticleNotFound
	}

	// Validate and normalize slug
	slug = s.normalizeSlug(slug)
	if !s.isValidSlug(slug) {
		return nil, ErrInvalidSlug
	}

	// Check if slug exists (excluding current article)
	if s.articleRepo.ExistsBySlugExcludingID(slug, id) {
		return nil, ErrSlugExists
	}

	article.Title = title
	article.Slug = slug
	article.Content = content
	article.Visibility = visibility
	article.PreviewPercentage = previewPercentage
	article.PreviewMinChars = previewMinChars
	article.PreviewSmartParagraph = previewSmartParagraph

	if err := s.articleRepo.Update(article); err != nil {
		return nil, err
	}

	return article, nil
}

// PublishArticle publishes an article
func (s *ArticleService) PublishArticle(id uint) (*model.Article, error) {
	article, err := s.articleRepo.FindByID(id)
	if err != nil {
		return nil, ErrArticleNotFound
	}

	now := time.Now()
	article.Status = model.ArticleStatusPublished
	article.PublishedAt = &now

	if err := s.articleRepo.Update(article); err != nil {
		return nil, err
	}

	return article, nil
}

// UnpublishArticle unpublishes an article
func (s *ArticleService) UnpublishArticle(id uint) (*model.Article, error) {
	article, err := s.articleRepo.FindByID(id)
	if err != nil {
		return nil, ErrArticleNotFound
	}

	article.Status = model.ArticleStatusDraft

	if err := s.articleRepo.Update(article); err != nil {
		return nil, err
	}

	return article, nil
}

// DeleteArticle deletes an article
func (s *ArticleService) DeleteArticle(id uint) error {
	return s.articleRepo.Delete(id)
}

// GetArticleByID gets an article by ID
func (s *ArticleService) GetArticleByID(id uint) (*model.Article, error) {
	article, err := s.articleRepo.FindByID(id)
	if err != nil {
		return nil, ErrArticleNotFound
	}
	return article, nil
}

// GetArticleBySlug gets an article by slug and applies content masking based on user role
func (s *ArticleService) GetArticleBySlug(slug string, user *model.User) (*ArticleResponse, error) {
	article, err := s.articleRepo.FindBySlug(slug)
	if err != nil {
		return nil, ErrArticleNotFound
	}

	// Check visibility
	if !article.IsVisibleTo(user) {
		return nil, ErrArticleNotFound
	}

	// Debug: Log user membership status
	if user != nil {
		println("[DEBUG] User:", user.Email, "IsMember:", user.IsMember(), "IsAdmin:", user.IsAdmin(), "Roles count:", len(user.Roles))
		for _, r := range user.Roles {
			println("[DEBUG] Role:", r.Code)
		}
	} else {
		println("[DEBUG] User is nil (guest)")
	}

	// Check if we should show preview
	isPreview := article.ShouldShowPreview(user)
	content := article.Content

	if isPreview {
		cfg := PreviewConfig{
			Percentage:     article.PreviewPercentage,
			MinChars:       article.PreviewMinChars,
			SmartParagraph: article.PreviewSmartParagraph,
		}
		content = GeneratePreview(content, cfg)
	}

	response := &ArticleResponse{
		ID:                    article.ID,
		Title:                 article.Title,
		Slug:                  article.Slug,
		Content:               content,
		AuthorID:              article.AuthorID,
		Visibility:            article.Visibility,
		PreviewPercentage:     article.PreviewPercentage,
		PreviewMinChars:       article.PreviewMinChars,
		PreviewSmartParagraph: article.PreviewSmartParagraph,
		Status:                article.Status,
		PublishedAt:           article.PublishedAt,
		CreatedAt:             article.CreatedAt,
		UpdatedAt:             article.UpdatedAt,
		IsPreview:             isPreview,
	}

	if article.Author.ID != 0 {
		response.AuthorEmail = article.Author.Email
	}

	return response, nil
}

// ListPublishedArticles returns a paginated list of published articles
func (s *ArticleService) ListPublishedArticles(page, pageSize int) ([]ArticleListItem, int64, error) {
	articles, total, err := s.articleRepo.FindPublished(page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	items := make([]ArticleListItem, len(articles))
	for i, article := range articles {
		// Generate excerpt (first 200 chars)
		excerpt := s.generateExcerpt(article.Content, 200)

		items[i] = ArticleListItem{
			ID:          article.ID,
			Title:       article.Title,
			Slug:        article.Slug,
			Excerpt:     excerpt,
			AuthorID:    article.AuthorID,
			Visibility:  article.Visibility,
			Status:      article.Status,
			PublishedAt: article.PublishedAt,
			CreatedAt:   article.CreatedAt,
		}

		if article.Author.ID != 0 {
			items[i].AuthorEmail = article.Author.Email
		}
	}

	return items, total, nil
}

// ListAllArticles returns a paginated list of all articles (for admin)
func (s *ArticleService) ListAllArticles(page, pageSize int) ([]ArticleListItem, int64, error) {
	articles, total, err := s.articleRepo.FindAll(page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	items := make([]ArticleListItem, len(articles))
	for i, article := range articles {
		excerpt := s.generateExcerpt(article.Content, 200)

		items[i] = ArticleListItem{
			ID:          article.ID,
			Title:       article.Title,
			Slug:        article.Slug,
			Excerpt:     excerpt,
			AuthorID:    article.AuthorID,
			Visibility:  article.Visibility,
			Status:      article.Status,
			PublishedAt: article.PublishedAt,
			CreatedAt:   article.CreatedAt,
		}

		if article.Author.ID != 0 {
			items[i].AuthorEmail = article.Author.Email
		}
	}

	return items, total, nil
}

// normalizeSlug normalizes a slug
func (s *ArticleService) normalizeSlug(slug string) string {
	slug = strings.ToLower(strings.TrimSpace(slug))
	// Replace spaces with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")
	// Remove multiple consecutive hyphens
	re := regexp.MustCompile(`-+`)
	slug = re.ReplaceAllString(slug, "-")
	// Remove leading and trailing hyphens
	slug = strings.Trim(slug, "-")
	return slug
}

// isValidSlug checks if a slug is valid
func (s *ArticleService) isValidSlug(slug string) bool {
	if slug == "" {
		return false
	}
	// Only allow lowercase letters, numbers, and hyphens
	matched, _ := regexp.MatchString(`^[a-z0-9]+(-[a-z0-9]+)*$`, slug)
	return matched
}

// generateExcerpt generates a short excerpt from content
func (s *ArticleService) generateExcerpt(content string, maxLength int) string {
	// Remove markdown formatting for cleaner excerpt
	content = s.stripMarkdown(content)

	runes := []rune(content)
	if len(runes) <= maxLength {
		return content
	}

	// Find a good cut point (space)
	cutPoint := maxLength
	for i := maxLength; i > maxLength-30 && i > 0; i-- {
		if runes[i] == ' ' {
			cutPoint = i
			break
		}
	}

	return strings.TrimSpace(string(runes[:cutPoint])) + "..."
}

// stripMarkdown removes common markdown formatting
func (s *ArticleService) stripMarkdown(content string) string {
	// Remove headers
	content = regexp.MustCompile(`(?m)^#{1,6}\s*`).ReplaceAllString(content, "")
	// Remove bold/italic
	content = regexp.MustCompile(`\*{1,2}([^*]+)\*{1,2}`).ReplaceAllString(content, "$1")
	content = regexp.MustCompile(`_{1,2}([^_]+)_{1,2}`).ReplaceAllString(content, "$1")
	// Remove links
	content = regexp.MustCompile(`\[([^\]]+)\]\([^)]+\)`).ReplaceAllString(content, "$1")
	// Remove images
	content = regexp.MustCompile(`!\[([^\]]*)\]\([^)]+\)`).ReplaceAllString(content, "")
	// Remove code blocks
	content = regexp.MustCompile("(?s)```[^`]*```").ReplaceAllString(content, "")
	content = regexp.MustCompile("`([^`]+)`").ReplaceAllString(content, "$1")
	// Normalize whitespace
	content = regexp.MustCompile(`\s+`).ReplaceAllString(content, " ")
	return strings.TrimSpace(content)
}
