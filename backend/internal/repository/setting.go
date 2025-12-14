package repository

import (
	"github.com/lite-blog/backend/internal/model"
	"gorm.io/gorm"
)

type SettingRepository struct {
	db *gorm.DB
}

func NewSettingRepository(db *gorm.DB) *SettingRepository {
	return &SettingRepository{db: db}
}

// GetAll returns all settings
func (r *SettingRepository) GetAll() ([]model.Setting, error) {
	var settings []model.Setting
	err := r.db.Find(&settings).Error
	return settings, err
}

// GetByKey returns a setting by key
func (r *SettingRepository) GetByKey(key string) (*model.Setting, error) {
	var setting model.Setting
	err := r.db.Where("key = ?", key).First(&setting).Error
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

// Upsert creates or updates a setting
func (r *SettingRepository) Upsert(key, value string) error {
	var setting model.Setting
	result := r.db.Where("key = ?", key).First(&setting)

	if result.Error == gorm.ErrRecordNotFound {
		return r.db.Create(&model.Setting{Key: key, Value: value}).Error
	}

	if result.Error != nil {
		return result.Error
	}

	setting.Value = value
	return r.db.Save(&setting).Error
}

// UpdateMultiple updates multiple settings at once
func (r *SettingRepository) UpdateMultiple(settings map[string]string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for key, value := range settings {
			var setting model.Setting
			result := tx.Where("key = ?", key).First(&setting)

			if result.Error == gorm.ErrRecordNotFound {
				if err := tx.Create(&model.Setting{Key: key, Value: value}).Error; err != nil {
					return err
				}
				continue
			}

			if result.Error != nil {
				return result.Error
			}

			setting.Value = value
			if err := tx.Save(&setting).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
