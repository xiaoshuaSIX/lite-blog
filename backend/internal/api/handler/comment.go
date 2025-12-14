package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lite-blog/backend/internal/api/middleware"
	"github.com/lite-blog/backend/internal/service"
)

type CommentHandler struct {
	commentService *service.CommentService
}

func NewCommentHandler(commentService *service.CommentService) *CommentHandler {
	return &CommentHandler{
		commentService: commentService,
	}
}

// CreateCommentRequest represents the create comment request
type CreateCommentRequest struct {
	Content  string `json:"content" binding:"required,min=1,max=500"`
	ParentID *uint  `json:"parent_id,omitempty"`
}

// ListCommentsRequest represents the list comments request
type ListCommentsRequest struct {
	Page     int `form:"page,default=1"`
	PageSize int `form:"page_size,default=20"`
}

// CommentListResponse represents the paginated comment list response
type CommentListResponse struct {
	Comments   []service.CommentResponse `json:"comments"`
	Total      int64                     `json:"total"`
	Page       int                       `json:"page"`
	PageSize   int                       `json:"page_size"`
	TotalPages int                       `json:"total_pages"`
}

// List returns comments for an article
func (h *CommentHandler) List(c *gin.Context) {
	articleIDStr := c.Param("articleId")
	articleID, err := strconv.ParseUint(articleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid article ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	var req ListCommentsRequest
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
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	comments, total, err := h.commentService.GetCommentsByArticle(uint(articleID), req.Page, req.PageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch comments",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	totalPages := int(total) / req.PageSize
	if int(total)%req.PageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, CommentListResponse{
		Comments:   comments,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	})
}

// Create creates a new comment
func (h *CommentHandler) Create(c *gin.Context) {
	articleIDStr := c.Param("articleId")
	articleID, err := strconv.ParseUint(articleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid article ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	user := middleware.GetUserFromContext(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
			"code":  "AUTH_REQUIRED",
		})
		return
	}

	comment, err := h.commentService.CreateComment(uint(articleID), user, req.Content, req.ParentID)
	if err != nil {
		switch err {
		case service.ErrCommentEmailNotVerified:
			c.JSON(http.StatusForbidden, gin.H{
				"error": "请先验证邮箱",
				"code":  "EMAIL_NOT_VERIFIED",
			})
		case service.ErrArticleNotFound:
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Article not found",
				"code":  "NOT_FOUND",
			})
		case service.ErrParentCommentNotFound:
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Parent comment not found",
				"code":  "PARENT_NOT_FOUND",
			})
		case service.ErrCommentTooShort:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Comment is too short",
				"code":  "COMMENT_TOO_SHORT",
			})
		case service.ErrCommentTooLong:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Comment is too long (max 500 characters)",
				"code":  "COMMENT_TOO_LONG",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create comment",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	c.JSON(http.StatusCreated, comment)
}

// AdminCommentHandler handles admin comment operations
type AdminCommentHandler struct {
	commentService *service.CommentService
}

func NewAdminCommentHandler(commentService *service.CommentService) *AdminCommentHandler {
	return &AdminCommentHandler{
		commentService: commentService,
	}
}

// Delete soft-deletes a comment (admin only)
func (h *AdminCommentHandler) Delete(c *gin.Context) {
	commentIDStr := c.Param("id")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid comment ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	if err := h.commentService.DeleteComment(uint(commentID)); err != nil {
		if err == service.ErrCommentNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Comment not found",
				"code":  "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete comment",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Comment deleted successfully",
	})
}
