package service

import (
	"errors"
	"time"

	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/repository"
)

var (
	ErrCannotDisableSelf   = errors.New("cannot disable your own account")
	ErrCannotDeleteSelf    = errors.New("cannot delete your own account")
	ErrCannotRemoveOwnRole = errors.New("cannot remove your own admin role")
	ErrRoleNotFound        = errors.New("role not found")
)

type UserService struct {
	userRepo *repository.UserRepository
	roleRepo *repository.RoleRepository
}

func NewUserService(userRepo *repository.UserRepository, roleRepo *repository.RoleRepository) *UserService {
	return &UserService{
		userRepo: userRepo,
		roleRepo: roleRepo,
	}
}

// UserListItem represents a user in the list response
type UserListItem struct {
	ID             uint       `json:"id"`
	Email          string     `json:"email"`
	EmailVerified  bool       `json:"email_verified"`
	Status         int        `json:"status"`
	IsMember       bool       `json:"is_member"`
	MemberExpireAt *time.Time `json:"member_expire_at,omitempty"`
	Roles          []string   `json:"roles"`
	CreatedAt      time.Time  `json:"created_at"`
}

// UserDetail represents detailed user information
type UserDetail struct {
	ID             uint       `json:"id"`
	Email          string     `json:"email"`
	EmailVerified  bool       `json:"email_verified"`
	Status         int        `json:"status"`
	IsMember       bool       `json:"is_member"`
	MemberExpireAt *time.Time `json:"member_expire_at,omitempty"`
	Roles          []RoleInfo `json:"roles"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// RoleInfo represents role information
type RoleInfo struct {
	ID   uint   `json:"id"`
	Code string `json:"code"`
	Name string `json:"name"`
}

// ListUsers returns a paginated list of users
func (s *UserService) ListUsers(page, pageSize int) ([]UserListItem, int64, error) {
	users, total, err := s.userRepo.List(page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	items := make([]UserListItem, len(users))
	for i, user := range users {
		roles := make([]string, len(user.Roles))
		for j, role := range user.Roles {
			roles[j] = role.Code
		}
		items[i] = UserListItem{
			ID:             user.ID,
			Email:          user.Email,
			EmailVerified:  user.EmailVerified,
			Status:         user.Status,
			IsMember:       user.IsMember(),
			MemberExpireAt: user.MemberExpireAt,
			Roles:          roles,
			CreatedAt:      user.CreatedAt,
		}
	}

	return items, total, nil
}

// GetUserByID returns a user by ID
func (s *UserService) GetUserByID(id uint) (*UserDetail, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, ErrUserNotFound
	}

	roles := make([]RoleInfo, len(user.Roles))
	for i, role := range user.Roles {
		roles[i] = RoleInfo{
			ID:   role.ID,
			Code: role.Code,
			Name: role.Name,
		}
	}

	return &UserDetail{
		ID:             user.ID,
		Email:          user.Email,
		EmailVerified:  user.EmailVerified,
		Status:         user.Status,
		IsMember:       user.IsMember(),
		MemberExpireAt: user.MemberExpireAt,
		Roles:          roles,
		CreatedAt:      user.CreatedAt,
		UpdatedAt:      user.UpdatedAt,
	}, nil
}

// UpdateUserStatus updates a user's status (enable/disable)
func (s *UserService) UpdateUserStatus(id uint, status int, currentUserID uint) error {
	// Prevent disabling own account
	if id == currentUserID && status == model.UserStatusDisabled {
		return ErrCannotDisableSelf
	}

	// Check if user exists
	_, err := s.userRepo.FindByID(id)
	if err != nil {
		return ErrUserNotFound
	}

	return s.userRepo.UpdateStatus(id, status)
}

// UpdateMembership updates a user's membership expiration date
func (s *UserService) UpdateMembership(id uint, expireAt *time.Time) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return ErrUserNotFound
	}

	user.MemberExpireAt = expireAt
	return s.userRepo.Update(user)
}

// AssignRole assigns a role to a user
func (s *UserService) AssignRole(userID uint, roleCode string) error {
	// Check if user exists
	_, err := s.userRepo.FindByID(userID)
	if err != nil {
		return ErrUserNotFound
	}

	// Find role by code
	role, err := s.roleRepo.FindByCode(roleCode)
	if err != nil {
		return ErrRoleNotFound
	}

	return s.userRepo.AssignRole(userID, role.ID)
}

// RemoveRole removes a role from a user
func (s *UserService) RemoveRole(userID uint, roleCode string, currentUserID uint) error {
	// Prevent removing own admin role
	if userID == currentUserID && roleCode == model.RoleCodeAdmin {
		return ErrCannotRemoveOwnRole
	}

	// Check if user exists
	_, err := s.userRepo.FindByID(userID)
	if err != nil {
		return ErrUserNotFound
	}

	// Find role by code
	role, err := s.roleRepo.FindByCode(roleCode)
	if err != nil {
		return ErrRoleNotFound
	}

	return s.userRepo.RemoveRole(userID, role.ID)
}

// DeleteUser deletes a user by ID
func (s *UserService) DeleteUser(id uint, currentUserID uint) error {
	// Prevent deleting own account
	if id == currentUserID {
		return ErrCannotDeleteSelf
	}

	// Check if user exists
	_, err := s.userRepo.FindByID(id)
	if err != nil {
		return ErrUserNotFound
	}

	return s.userRepo.Delete(id)
}

// GetAllRoles returns all available roles
func (s *UserService) GetAllRoles() ([]RoleInfo, error) {
	roles, err := s.roleRepo.List()
	if err != nil {
		return nil, err
	}

	items := make([]RoleInfo, len(roles))
	for i, role := range roles {
		items[i] = RoleInfo{
			ID:   role.ID,
			Code: role.Code,
			Name: role.Name,
		}
	}

	return items, nil
}
