package model

import (
	"time"

	"gorm.io/gorm"
)

// Comment represents a comment on an article
type Comment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	ArticleID uint           `gorm:"index;not null" json:"article_id"`
	Article   Article        `gorm:"foreignKey:ArticleID" json:"article,omitempty"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID  *uint          `gorm:"index" json:"parent_id,omitempty"`
	Parent    *Comment       `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	IsDeleted bool           `gorm:"default:false" json:"is_deleted"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// SoftDelete marks the comment as deleted (soft delete)
func (c *Comment) SoftDelete() {
	c.IsDeleted = true
	c.Content = "[This comment has been deleted]"
}
