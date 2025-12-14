package model

import (
	"time"

	"gorm.io/gorm"
)

// ArticleVisibility defines the visibility of an article
type ArticleVisibility string

const (
	VisibilityHidden     ArticleVisibility = "hidden"      // Only admin can see
	VisibilityPublicFull ArticleVisibility = "public_full" // Everyone can see full content
	VisibilityMemberFull ArticleVisibility = "member_full" // Members see full, others see preview
)

// ArticleStatus defines the status of an article
type ArticleStatus int

const (
	ArticleStatusDraft     ArticleStatus = 0
	ArticleStatusPublished ArticleStatus = 1
)

// Article represents a blog article
type Article struct {
	ID                    uint              `gorm:"primaryKey" json:"id"`
	Title                 string            `gorm:"size:255;not null" json:"title"`
	Slug                  string            `gorm:"uniqueIndex;size:255;not null" json:"slug"`
	Content               string            `gorm:"type:text;not null" json:"content"`
	AuthorID              uint              `gorm:"not null;index" json:"author_id"`
	Author                User              `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Visibility            ArticleVisibility `gorm:"size:20;default:'member_full'" json:"visibility"`
	PreviewPercentage     int               `gorm:"default:30" json:"preview_percentage"`
	PreviewMinChars       int               `gorm:"default:200" json:"preview_min_chars"`
	PreviewSmartParagraph bool              `gorm:"default:true" json:"preview_smart_paragraph"`
	Status                ArticleStatus     `gorm:"default:0" json:"status"`
	PublishedAt           *time.Time        `json:"published_at,omitempty"`
	CreatedAt             time.Time         `json:"created_at"`
	UpdatedAt             time.Time         `json:"updated_at"`
	DeletedAt             gorm.DeletedAt    `gorm:"index" json:"-"`
}

// IsPublished checks if the article is published
func (a *Article) IsPublished() bool {
	return a.Status == ArticleStatusPublished && a.PublishedAt != nil
}

// IsVisibleTo checks if the article is visible to a user
func (a *Article) IsVisibleTo(user *User) bool {
	// Hidden articles are only visible to admins
	if a.Visibility == VisibilityHidden {
		if user == nil {
			return false
		}
		return user.IsAdmin()
	}
	return true
}

// ShouldShowPreview checks if the article should show preview content to a user
func (a *Article) ShouldShowPreview(user *User) bool {
	// Public full articles show full content to everyone
	if a.Visibility == VisibilityPublicFull {
		return false
	}

	// Member full articles show full content to members and admins
	if a.Visibility == VisibilityMemberFull {
		if user == nil {
			return true
		}
		if user.IsAdmin() || user.IsMember() {
			return false
		}
		return true
	}

	return false
}
