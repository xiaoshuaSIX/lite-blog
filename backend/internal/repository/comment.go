package repository

import (
	"github.com/lite-blog/backend/internal/model"
	"gorm.io/gorm"
)

type CommentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

// Create creates a new comment
func (r *CommentRepository) Create(comment *model.Comment) error {
	return r.db.Create(comment).Error
}

// Update updates a comment
func (r *CommentRepository) Update(comment *model.Comment) error {
	return r.db.Save(comment).Error
}

// Delete hard deletes a comment
func (r *CommentRepository) Delete(id uint) error {
	return r.db.Delete(&model.Comment{}, id).Error
}

// FindByID finds a comment by ID
func (r *CommentRepository) FindByID(id uint) (*model.Comment, error) {
	var comment model.Comment
	err := r.db.Preload("User").First(&comment, id).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

// FindByArticleID finds all comments for an article with pagination
func (r *CommentRepository) FindByArticleID(articleID uint, page, pageSize int) ([]model.Comment, int64, error) {
	var comments []model.Comment
	var total int64

	// Count total comments (excluding soft-deleted ones from display, but include in count)
	err := r.db.Model(&model.Comment{}).
		Where("article_id = ?", articleID).
		Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results, ordered by creation time (oldest first for readability)
	offset := (page - 1) * pageSize
	err = r.db.Preload("User").
		Where("article_id = ?", articleID).
		Order("created_at ASC").
		Offset(offset).
		Limit(pageSize).
		Find(&comments).Error
	if err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

// FindReplies finds all replies to a comment
func (r *CommentRepository) FindReplies(parentID uint) ([]model.Comment, error) {
	var comments []model.Comment
	err := r.db.Preload("User").
		Where("parent_id = ?", parentID).
		Order("created_at ASC").
		Find(&comments).Error
	if err != nil {
		return nil, err
	}
	return comments, nil
}

// SoftDelete marks a comment as deleted (keeps the record but changes content)
func (r *CommentRepository) SoftDelete(id uint) error {
	comment, err := r.FindByID(id)
	if err != nil {
		return err
	}
	comment.SoftDelete()
	return r.Update(comment)
}

// CountByArticleID counts comments for an article
func (r *CommentRepository) CountByArticleID(articleID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.Comment{}).
		Where("article_id = ? AND is_deleted = ?", articleID, false).
		Count(&count).Error
	return count, err
}
