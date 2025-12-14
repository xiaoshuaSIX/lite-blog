package router

import (
	"github.com/gin-gonic/gin"
	"github.com/lite-blog/backend/internal/api/handler"
	"github.com/lite-blog/backend/internal/api/middleware"
	"github.com/lite-blog/backend/internal/config"
	"github.com/lite-blog/backend/internal/repository"
	"github.com/lite-blog/backend/internal/service"
	"gorm.io/gorm"
)

func Setup(cfg *config.Config, db *gorm.DB) *gin.Engine {
	// Set Gin mode
	gin.SetMode(cfg.Server.Mode)

	r := gin.Default()

	// Apply global middleware
	r.Use(middleware.CORS(&cfg.CORS))
	r.Use(gin.Recovery())

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	roleRepo := repository.NewRoleRepository(db)
	articleRepo := repository.NewArticleRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	settingRepo := repository.NewSettingRepository(db)

	// Initialize services
	emailService := service.NewEmailService(&cfg.Email, "http://localhost:3000")
	authService := service.NewAuthService(userRepo, roleRepo, emailService, cfg)
	articleService := service.NewArticleService(articleRepo)
	commentService := service.NewCommentService(commentRepo, articleRepo)
	settingService := service.NewSettingService(settingRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService, cfg)
	articleHandler := handler.NewArticleHandler(articleService)
	commentHandler := handler.NewCommentHandler(commentService)
	settingHandler := handler.NewSettingHandler(settingService)
	adminArticleHandler := handler.NewAdminArticleHandler(articleService)
	adminCommentHandler := handler.NewAdminCommentHandler(commentService)

	// Create auth middleware
	authMiddleware := middleware.AuthMiddleware(cfg.JWT.Secret, userRepo)
	optionalAuthMiddleware := middleware.OptionalAuthMiddleware(cfg.JWT.Secret, userRepo)

	// Health check endpoint
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			auth.GET("/me", authMiddleware, authHandler.Me)
			auth.POST("/verify-email", authHandler.VerifyEmail)
			auth.POST("/resend-verification", authMiddleware, authHandler.ResendVerification)
		}

		// Public site settings
		api.GET("/settings", settingHandler.GetSiteSettings)

		// Public article routes (with optional auth for content masking)
		articles := api.Group("/articles")
		articles.Use(optionalAuthMiddleware)
		{
			articles.GET("", articleHandler.List)
			articles.GET("/:slug", articleHandler.GetBySlug)
		}

		// Comment routes
		comments := api.Group("/comments")
		{
			comments.GET("/article/:articleId", optionalAuthMiddleware, commentHandler.List)
			comments.POST("/article/:articleId", authMiddleware, commentHandler.Create)
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(authMiddleware)
		admin.Use(middleware.RequireAdmin())
		{
			// Article management
			admin.GET("/articles", adminArticleHandler.List)
			admin.GET("/articles/:id", adminArticleHandler.GetByID)
			admin.POST("/articles", adminArticleHandler.Create)
			admin.PUT("/articles/:id", adminArticleHandler.Update)
			admin.DELETE("/articles/:id", adminArticleHandler.Delete)
			admin.POST("/articles/:id/publish", adminArticleHandler.Publish)
			admin.POST("/articles/:id/unpublish", adminArticleHandler.Unpublish)

			// Comment management
			admin.DELETE("/comments/:id", adminCommentHandler.Delete)

			// Site settings management
			admin.GET("/settings", settingHandler.GetSiteSettings)
			admin.PUT("/settings", settingHandler.UpdateSiteSettings)
		}
	}

	return r
}
