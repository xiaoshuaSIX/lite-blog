package main

import (
	"fmt"
	"log"

	"github.com/lite-blog/backend/internal/api/router"
	"github.com/lite-blog/backend/internal/config"
	"github.com/lite-blog/backend/internal/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// Load config
	cfg := config.Load()

	// Configure GORM logger
	gormConfig := &gorm.Config{}
	if cfg.Server.Mode == "debug" {
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	} else {
		gormConfig.Logger = logger.Default.LogMode(logger.Silent)
	}

	// Connect to database
	db, err := gorm.Open(sqlite.Open(cfg.Database.Path), gormConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")

	// Run migrations
	if err := model.Migrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Seed initial data
	if err := model.Seed(db); err != nil {
		log.Fatalf("Failed to seed database: %v", err)
	}

	// Create admin user from environment variables if provided
	if err := model.CreateAdminFromEnv(db); err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	// Setup router
	r := router.Setup(cfg, db)

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("Server starting on http://localhost%s", addr)
	log.Printf("Mode: %s", cfg.Server.Mode)

	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
