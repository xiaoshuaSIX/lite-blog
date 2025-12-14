package repository

import (
	"github.com/lite-blog/backend/internal/model"
	"gorm.io/gorm"
)

type RoleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) FindByID(id uint) (*model.Role, error) {
	var role model.Role
	err := r.db.Preload("Permissions").First(&role, id).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *RoleRepository) FindByCode(code string) (*model.Role, error) {
	var role model.Role
	err := r.db.Preload("Permissions").Where("code = ?", code).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *RoleRepository) List() ([]model.Role, error) {
	var roles []model.Role
	err := r.db.Preload("Permissions").Find(&roles).Error
	if err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *RoleRepository) Create(role *model.Role) error {
	return r.db.Create(role).Error
}

func (r *RoleRepository) Update(role *model.Role) error {
	return r.db.Save(role).Error
}

func (r *RoleRepository) AssignPermissions(roleID uint, permissionIDs []uint) error {
	var role model.Role
	if err := r.db.First(&role, roleID).Error; err != nil {
		return err
	}

	var permissions []model.Permission
	if err := r.db.Find(&permissions, permissionIDs).Error; err != nil {
		return err
	}

	return r.db.Model(&role).Association("Permissions").Replace(permissions)
}
