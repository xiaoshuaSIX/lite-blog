package config

import (
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	CORS     CORSConfig     `mapstructure:"cors"`
	Email    EmailConfig    `mapstructure:"email"`
}

type ServerConfig struct {
	Port          int    `mapstructure:"port"`
	Mode          string `mapstructure:"mode"`
	FrontendProxy string `mapstructure:"frontend_proxy"`
}

type DatabaseConfig struct {
	Path string `mapstructure:"path"`
}

type JWTConfig struct {
	Secret      string `mapstructure:"secret"`
	ExpireHours int    `mapstructure:"expire_hours"`
}

type CORSConfig struct {
	AllowedOrigins   []string `mapstructure:"allowed_origins"`
	AllowedMethods   []string `mapstructure:"allowed_methods"`
	AllowedHeaders   []string `mapstructure:"allowed_headers"`
	AllowCredentials bool     `mapstructure:"allow_credentials"`
}

type EmailConfig struct {
	Provider string         `mapstructure:"provider"`
	From     string         `mapstructure:"from"`
	AWS      AWSEmailConfig `mapstructure:"aws"`
}

type AWSEmailConfig struct {
	Region string `mapstructure:"region"`
}

func Load() *Config {
	// Get the executable directory
	execPath, err := os.Executable()
	if err != nil {
		log.Printf("Warning: Could not get executable path: %v", err)
	}
	execDir := filepath.Dir(execPath)

	// Set config name and type
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")

	// Add config paths (in order of priority)
	viper.AddConfigPath("./configs")                       // Current directory configs
	viper.AddConfigPath("../configs")                      // Parent directory configs (for running from cmd/server)
	viper.AddConfigPath(filepath.Join(execDir, "configs")) // Executable directory configs

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Error unmarshaling config: %v", err)
	}

	// Override with environment variables if set
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		config.JWT.Secret = secret
	}

	if region := os.Getenv("AWS_REGION"); region != "" {
		config.Email.AWS.Region = region
	}

	// Docker environment overrides
	if dbPath := os.Getenv("DATABASE_PATH"); dbPath != "" {
		config.Database.Path = dbPath
	}

	if port := os.Getenv("SERVER_PORT"); port != "" {
		if p, err := strconv.Atoi(port); err == nil {
			config.Server.Port = p
		}
	}

	if mode := os.Getenv("SERVER_MODE"); mode != "" {
		config.Server.Mode = mode
	}

	if frontend := os.Getenv("FRONTEND_PROXY"); frontend != "" {
		config.Server.FrontendProxy = frontend
	}

	if origins := os.Getenv("CORS_ORIGINS"); origins != "" {
		config.CORS.AllowedOrigins = strings.Split(origins, ",")
	}

	return &config
}
