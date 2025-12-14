package model

import (
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Migrate runs database migrations
func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	err := db.AutoMigrate(
		&User{},
		&Role{},
		&Permission{},
		&Article{},
		&Comment{},
		&Setting{},
	)
	if err != nil {
		return err
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// Seed seeds the database with initial data
func Seed(db *gorm.DB) error {
	log.Println("Seeding database...")

	// Seed roles
	if err := seedRoles(db); err != nil {
		return err
	}

	// Seed permissions
	if err := seedPermissions(db); err != nil {
		return err
	}

	// Assign permissions to admin role
	if err := assignAdminPermissions(db); err != nil {
		return err
	}

	// Seed default site settings
	if err := seedSiteSettings(db); err != nil {
		return err
	}

	log.Println("Database seeding completed successfully")
	return nil
}

func seedSiteSettings(db *gorm.DB) error {
	defaults := DefaultSiteSettings()
	settings := map[string]string{
		"site_name":        defaults.SiteName,
		"site_description": defaults.SiteDescription,
		"site_keywords":    defaults.SiteKeywords,
		"home_title":       defaults.HomeTitle,
		"home_subtitle":    defaults.HomeSubtitle,
		"footer_text":      defaults.FooterText,
		"logo_url":         defaults.LogoURL,
	}

	for key, value := range settings {
		var existing Setting
		result := db.Where("key = ?", key).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&Setting{Key: key, Value: value}).Error; err != nil {
				return err
			}
			log.Printf("Created setting: %s", key)
		}
	}

	return nil
}

func seedRoles(db *gorm.DB) error {
	roles := []Role{
		{Code: RoleCodeGuest, Name: "Guest"},
		{Code: RoleCodeUser, Name: "User"},
		{Code: RoleCodeMember, Name: "Member"},
		{Code: RoleCodeAdmin, Name: "Administrator"},
	}

	for _, role := range roles {
		// Check if role already exists
		var existing Role
		result := db.Where("code = ?", role.Code).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&role).Error; err != nil {
				return err
			}
			log.Printf("Created role: %s", role.Code)
		}
	}

	return nil
}

func seedPermissions(db *gorm.DB) error {
	permissions := []Permission{
		{Code: PermissionArticleManage, Name: "Manage Articles"},
		{Code: PermissionUserManage, Name: "Manage Users"},
		{Code: PermissionCommentManage, Name: "Manage Comments"},
		{Code: PermissionRoleManage, Name: "Manage Roles"},
	}

	for _, perm := range permissions {
		// Check if permission already exists
		var existing Permission
		result := db.Where("code = ?", perm.Code).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&perm).Error; err != nil {
				return err
			}
			log.Printf("Created permission: %s", perm.Code)
		}
	}

	return nil
}

func assignAdminPermissions(db *gorm.DB) error {
	// Get admin role
	var adminRole Role
	if err := db.Where("code = ?", RoleCodeAdmin).First(&adminRole).Error; err != nil {
		return err
	}

	// Get all permissions
	var permissions []Permission
	if err := db.Find(&permissions).Error; err != nil {
		return err
	}

	// Check if admin already has permissions
	var count int64
	db.Table("role_permissions").Where("role_id = ?", adminRole.ID).Count(&count)
	if count > 0 {
		return nil // Already assigned
	}

	// Assign all permissions to admin
	if err := db.Model(&adminRole).Association("Permissions").Replace(permissions); err != nil {
		return err
	}

	log.Println("Assigned all permissions to admin role")
	return nil
}

// CreateAdminFromEnv creates an admin user from environment variables if provided
// Environment variables: ADMIN_EMAIL, ADMIN_PASSWORD
func CreateAdminFromEnv(db *gorm.DB) error {
	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")

	if adminEmail == "" || adminPassword == "" {
		log.Println("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin user creation")
		return nil
	}

	// Check if admin already exists
	var existingUser User
	result := db.Where("email = ?", adminEmail).First(&existingUser)
	if result.Error == nil {
		log.Printf("Admin user %s already exists, skipping creation", adminEmail)
		return nil
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Get admin role
	var adminRole Role
	if err := db.Where("code = ?", RoleCodeAdmin).First(&adminRole).Error; err != nil {
		return err
	}

	// Create admin user
	adminUser := &User{
		Email:         adminEmail,
		PasswordHash:  string(hashedPassword),
		EmailVerified: true, // Admin is pre-verified
		Status:        UserStatusActive,
		Roles:         []Role{adminRole},
	}

	if err := db.Create(adminUser).Error; err != nil {
		return err
	}

	log.Printf("Created admin user: %s", adminEmail)
	return nil
}
