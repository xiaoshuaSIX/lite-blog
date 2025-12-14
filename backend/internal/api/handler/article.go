package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lite-blog/backend/internal/api/middleware"
	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/service"
)

type ArticleHandler struct {
	articleService *service.ArticleService
}

func NewArticleHandler(articleService *service.ArticleService) *ArticleHandler {
	return &ArticleHandler{
		articleService: articleService,
	}
}

// ListArticlesRequest represents the list articles request
type ListArticlesRequest struct {
	Page     int `form:"page,default=1"`
	PageSize int `form:"page_size,default=10"`
}

// ArticleListResponse represents the paginated list response
type ArticleListResponse struct {
	Articles   []service.ArticleListItem `json:"articles"`
	Total      int64                     `json:"total"`
	Page       int                       `json:"page"`
	PageSize   int                       `json:"page_size"`
	TotalPages int                       `json:"total_pages"`
}

// List returns a paginated list of published articles
func (h *ArticleHandler) List(c *gin.Context) {
	var req ListArticlesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid query parameters",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// Validate pagination
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 50 {
		req.PageSize = 10
	}

	articles, total, err := h.articleService.ListPublishedArticles(req.Page, req.PageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch articles",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	totalPages := int(total) / req.PageSize
	if int(total)%req.PageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, ArticleListResponse{
		Articles:   articles,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	})
}

// GetBySlug returns an article by its slug
func (h *ArticleHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Slug is required",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// Get user from context (may be nil for guests)
	user := middleware.GetUserFromContext(c)

	article, err := h.articleService.GetArticleBySlug(slug, user)
	if err != nil {
		if err == service.ErrArticleNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Article not found",
				"code":  "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch article",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, article)
}

// AdminArticleHandler handles admin article operations
type AdminArticleHandler struct {
	articleService *service.ArticleService
}

func NewAdminArticleHandler(articleService *service.ArticleService) *AdminArticleHandler {
	return &AdminArticleHandler{
		articleService: articleService,
	}
}

// CreateArticleRequest represents the create article request
type CreateArticleRequest struct {
	Title                 string                  `json:"title" binding:"required,min=1,max=255"`
	Slug                  string                  `json:"slug" binding:"required,min=1,max=255"`
	Content               string                  `json:"content" binding:"required"`
	Visibility            model.ArticleVisibility `json:"visibility" binding:"required,oneof=hidden public_full member_full"`
	PreviewPercentage     int                     `json:"preview_percentage" binding:"min=0,max=100"`
	PreviewMinChars       int                     `json:"preview_min_chars" binding:"min=0"`
	PreviewSmartParagraph bool                    `json:"preview_smart_paragraph"`
}

// UpdateArticleRequest represents the update article request
type UpdateArticleRequest struct {
	Title                 string                  `json:"title" binding:"required,min=1,max=255"`
	Slug                  string                  `json:"slug" binding:"required,min=1,max=255"`
	Content               string                  `json:"content" binding:"required"`
	Visibility            model.ArticleVisibility `json:"visibility" binding:"required,oneof=hidden public_full member_full"`
	PreviewPercentage     int                     `json:"preview_percentage" binding:"min=0,max=100"`
	PreviewMinChars       int                     `json:"preview_min_chars" binding:"min=0"`
	PreviewSmartParagraph bool                    `json:"preview_smart_paragraph"`
}

// List returns all articles for admin
func (h *AdminArticleHandler) List(c *gin.Context) {
	var req ListArticlesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid query parameters",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 50 {
		req.PageSize = 10
	}

	articles, total, err := h.articleService.ListAllArticles(req.Page, req.PageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch articles",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	totalPages := int(total) / req.PageSize
	if int(total)%req.PageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, ArticleListResponse{
		Articles:   articles,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	})
}

// GetByID returns an article by its ID (for admin editing)
func (h *AdminArticleHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid article ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	article, err := h.articleService.GetArticleByID(uint(id))
	if err != nil {
		if err == service.ErrArticleNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Article not found",
				"code":  "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch article",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, article)
}

// Create creates a new article
func (h *AdminArticleHandler) Create(c *gin.Context) {
	var req CreateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// Get current user
	user := middleware.GetUserFromContext(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
			"code":  "AUTH_REQUIRED",
		})
		return
	}

	// Set defaults
	if req.PreviewPercentage == 0 {
		req.PreviewPercentage = 30
	}
	if req.PreviewMinChars == 0 {
		req.PreviewMinChars = 200
	}

	article, err := h.articleService.CreateArticle(
		req.Title,
		req.Slug,
		req.Content,
		user.ID,
		req.Visibility,
		req.PreviewPercentage,
		req.PreviewMinChars,
		req.PreviewSmartParagraph,
	)
	if err != nil {
		switch err {
		case service.ErrSlugExists:
			c.JSON(http.StatusConflict, gin.H{
				"error": "Slug already exists",
				"code":  "SLUG_EXISTS",
			})
		case service.ErrInvalidSlug:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid slug format",
				"code":  "INVALID_SLUG",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create article",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	c.JSON(http.StatusCreated, article)
}

// Update updates an article
func (h *AdminArticleHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid article ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	var req UpdateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	article, err := h.articleService.UpdateArticle(
		uint(id),
		req.Title,
		req.Slug,
		req.Content,
		req.Visibility,
		req.PreviewPercentage,
		req.PreviewMinChars,
		req.PreviewSmartParagraph,
	)
	if err != nil {
		switch err {
		case service.ErrArticleNotFound:
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Article not found",
				"code":  "NOT_FOUND",
			})
		case service.ErrSlugExists:
			c.JSON(http.StatusConflict, gin.H{
				"error": "Slug already exists",
				"code":  "SLUG_EXISTS",
			})
		case service.ErrInvalidSlug:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid slug format",
				"code":  "INVALID_SLUG",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to update article",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	c.JSON(http.StatusOK, article)
}

// Delete deletes an article
func (h *AdminArticleHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid article ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	if err := h.articleService.DeleteArticle(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete article",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Article deleted successfully",
	})
}

// Publish publishes an article
func (h *AdminArticleHandler) Publish(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid article ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	article, err := h.articleService.PublishArticle(uint(id))
	if err != nil {
		if err == service.ErrArticleNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Article not found",
				"code":  "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to publish article",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, article)
}

// Unpublish unpublishes an article
func (h *AdminArticleHandler) Unpublish(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid article ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	article, err := h.articleService.UnpublishArticle(uint(id))
	if err != nil {
		if err == service.ErrArticleNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Article not found",
				"code":  "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to unpublish article",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, article)
}
