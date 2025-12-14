package service

import (
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/repository"
)

var (
	ErrCommentNotFound            = errors.New("comment not found")
	ErrCommentTooShort            = errors.New("comment is too short")
	ErrCommentTooLong             = errors.New("comment is too long")
	ErrNotCommentOwner            = errors.New("not comment owner")
	ErrParentCommentNotFound      = errors.New("parent comment not found")
	ErrCommentEmailNotVerified    = errors.New("email not verified")
)

const (
	MinCommentLength = 1
	MaxCommentLength = 500
)

type CommentService struct {
	commentRepo *repository.CommentRepository
	articleRepo *repository.ArticleRepository
}

func NewCommentService(
	commentRepo *repository.CommentRepository,
	articleRepo *repository.ArticleRepository,
) *CommentService {
	return &CommentService{
		commentRepo: commentRepo,
		articleRepo: articleRepo,
	}
}

// CommentResponse represents the response for a comment
type CommentResponse struct {
	ID        uint               `json:"id"`
	ArticleID uint               `json:"article_id"`
	UserID    uint               `json:"user_id"`
	UserEmail string             `json:"user_email"`
	ParentID  *uint              `json:"parent_id,omitempty"`
	Content   string             `json:"content"`
	IsDeleted bool               `json:"is_deleted"`
	CreatedAt time.Time          `json:"created_at"`
	Replies   []CommentResponse  `json:"replies,omitempty"`
}

// CreateComment creates a new comment
func (s *CommentService) CreateComment(
	articleID uint,
	user *model.User,
	content string,
	parentID *uint,
) (*CommentResponse, error) {
	// Check if user has verified email
	if !user.EmailVerified {
		return nil, ErrCommentEmailNotVerified
	}

	// Validate content
	content = strings.TrimSpace(content)
	contentLength := utf8.RuneCountInString(content)

	if contentLength < MinCommentLength {
		return nil, ErrCommentTooShort
	}
	if contentLength > MaxCommentLength {
		return nil, ErrCommentTooLong
	}

	// Check if article exists
	_, err := s.articleRepo.FindByID(articleID)
	if err != nil {
		return nil, ErrArticleNotFound
	}

	// If replying to a comment, verify parent exists
	if parentID != nil {
		parentComment, err := s.commentRepo.FindByID(*parentID)
		if err != nil {
			return nil, ErrParentCommentNotFound
		}
		// Ensure parent comment belongs to the same article
		if parentComment.ArticleID != articleID {
			return nil, ErrParentCommentNotFound
		}
	}

	comment := &model.Comment{
		ArticleID: articleID,
		UserID:    user.ID,
		ParentID:  parentID,
		Content:   content,
	}

	if err := s.commentRepo.Create(comment); err != nil {
		return nil, err
	}

	return &CommentResponse{
		ID:        comment.ID,
		ArticleID: comment.ArticleID,
		UserID:    comment.UserID,
		UserEmail: user.Email,
		ParentID:  comment.ParentID,
		Content:   comment.Content,
		IsDeleted: comment.IsDeleted,
		CreatedAt: comment.CreatedAt,
	}, nil
}

// GetCommentsByArticle returns comments for an article
func (s *CommentService) GetCommentsByArticle(articleID uint, page, pageSize int) ([]CommentResponse, int64, error) {
	comments, total, err := s.commentRepo.FindByArticleID(articleID, page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]CommentResponse, len(comments))
	for i, comment := range comments {
		responses[i] = s.toCommentResponse(comment)
	}

	return responses, total, nil
}

// DeleteComment soft-deletes a comment (admin only)
func (s *CommentService) DeleteComment(commentID uint) error {
	return s.commentRepo.SoftDelete(commentID)
}

// DeleteCommentByOwner allows a user to delete their own comment
func (s *CommentService) DeleteCommentByOwner(commentID uint, userID uint) error {
	comment, err := s.commentRepo.FindByID(commentID)
	if err != nil {
		return ErrCommentNotFound
	}

	if comment.UserID != userID {
		return ErrNotCommentOwner
	}

	return s.commentRepo.SoftDelete(commentID)
}

// toCommentResponse converts a Comment model to CommentResponse
func (s *CommentService) toCommentResponse(comment model.Comment) CommentResponse {
	response := CommentResponse{
		ID:        comment.ID,
		ArticleID: comment.ArticleID,
		UserID:    comment.UserID,
		ParentID:  comment.ParentID,
		Content:   comment.Content,
		IsDeleted: comment.IsDeleted,
		CreatedAt: comment.CreatedAt,
	}

	if comment.User.ID != 0 {
		response.UserEmail = comment.User.Email
	}

	return response
}
