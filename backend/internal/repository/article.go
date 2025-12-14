package repository

import (
	"github.com/lite-blog/backend/internal/model"
	"gorm.io/gorm"
)

type ArticleRepository struct {
	db *gorm.DB
}

func NewArticleRepository(db *gorm.DB) *ArticleRepository {
	return &ArticleRepository{db: db}
}

// Create creates a new article
func (r *ArticleRepository) Create(article *model.Article) error {
	return r.db.Create(article).Error
}

// Update updates an article
func (r *ArticleRepository) Update(article *model.Article) error {
	return r.db.Save(article).Error
}

// Delete soft deletes an article
func (r *ArticleRepository) Delete(id uint) error {
	return r.db.Delete(&model.Article{}, id).Error
}

// FindByID finds an article by ID
func (r *ArticleRepository) FindByID(id uint) (*model.Article, error) {
	var article model.Article
	err := r.db.Preload("Author").First(&article, id).Error
	if err != nil {
		return nil, err
	}
	return &article, nil
}

// FindBySlug finds an article by slug
func (r *ArticleRepository) FindBySlug(slug string) (*model.Article, error) {
	var article model.Article
	err := r.db.Preload("Author").Where("slug = ?", slug).First(&article).Error
	if err != nil {
		return nil, err
	}
	return &article, nil
}

// FindPublished finds all published articles with pagination
func (r *ArticleRepository) FindPublished(page, pageSize int) ([]model.Article, int64, error) {
	var articles []model.Article
	var total int64

	// Count total published articles (excluding hidden)
	err := r.db.Model(&model.Article{}).
		Where("status = ? AND visibility != ?", model.ArticleStatusPublished, model.VisibilityHidden).
		Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err = r.db.Preload("Author").
		Where("status = ? AND visibility != ?", model.ArticleStatusPublished, model.VisibilityHidden).
		Order("published_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&articles).Error
	if err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

// FindAll finds all articles with pagination (for admin)
func (r *ArticleRepository) FindAll(page, pageSize int) ([]model.Article, int64, error) {
	var articles []model.Article
	var total int64

	err := r.db.Model(&model.Article{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = r.db.Preload("Author").
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&articles).Error
	if err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

// ExistsBySlug checks if an article with the given slug exists
func (r *ArticleRepository) ExistsBySlug(slug string) bool {
	var count int64
	r.db.Model(&model.Article{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}

// ExistsBySlugExcludingID checks if an article with the given slug exists (excluding a specific ID)
func (r *ArticleRepository) ExistsBySlugExcludingID(slug string, excludeID uint) bool {
	var count int64
	r.db.Model(&model.Article{}).Where("slug = ? AND id != ?", slug, excludeID).Count(&count)
	return count > 0
}
