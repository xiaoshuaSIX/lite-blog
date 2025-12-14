package model

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID                        uint           `gorm:"primaryKey" json:"id"`
	Email                     string         `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash              string         `gorm:"size:255;not null" json:"-"`
	EmailVerified             bool           `gorm:"default:false" json:"email_verified"`
	EmailVerificationToken    *string        `gorm:"size:64" json:"-"`
	EmailVerificationExpireAt *time.Time     `json:"-"`
	EmailVerificationSentAt   *time.Time     `json:"-"`
	MemberExpireAt            *time.Time     `json:"member_expire_at,omitempty"`
	Status                    int            `gorm:"default:0" json:"status"` // 0: active, 1: disabled
	Roles                     []Role         `gorm:"many2many:user_roles;" json:"roles,omitempty"`
	CreatedAt                 time.Time      `json:"created_at"`
	UpdatedAt                 time.Time      `json:"updated_at"`
	DeletedAt                 gorm.DeletedAt `gorm:"index" json:"-"`
}

// UserStatus constants
const (
	UserStatusActive   = 0
	UserStatusDisabled = 1
)

// IsMember checks if the user has an active membership
// A user is considered a member if they have the member role OR have an active membership expiration date
func (u *User) IsMember() bool {
	// Check if user has the member role
	if u.HasRole(RoleCodeMember) {
		return true
	}
	// Check if user has an active membership based on expiration date
	if u.MemberExpireAt != nil && time.Now().Before(*u.MemberExpireAt) {
		return true
	}
	return false
}

// IsAdmin checks if the user has admin role
func (u *User) IsAdmin() bool {
	for _, role := range u.Roles {
		if role.Code == RoleCodeAdmin {
			return true
		}
	}
	return false
}

// HasRole checks if the user has a specific role
func (u *User) HasRole(roleCode string) bool {
	for _, role := range u.Roles {
		if role.Code == roleCode {
			return true
		}
	}
	return false
}

// GetRoleCodes returns a slice of role codes for the user
func (u *User) GetRoleCodes() []string {
	codes := make([]string, len(u.Roles))
	for i, role := range u.Roles {
		codes[i] = role.Code
	}
	return codes
}

// Role represents a role in the system
type Role struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Code        string       `gorm:"uniqueIndex;size:50;not null" json:"code"`
	Name        string       `gorm:"size:100;not null" json:"name"`
	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// Role code constants
const (
	RoleCodeGuest  = "guest"
	RoleCodeUser   = "user"
	RoleCodeMember = "member"
	RoleCodeAdmin  = "admin"
)

// Permission represents a permission in the system
type Permission struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Code      string    `gorm:"uniqueIndex;size:100;not null" json:"code"`
	Name      string    `gorm:"size:100" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Permission code constants
const (
	PermissionArticleManage = "article.manage"
	PermissionUserManage    = "user.manage"
	PermissionCommentManage = "comment.manage"
	PermissionRoleManage    = "role.manage"
)
