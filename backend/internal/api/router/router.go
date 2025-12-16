package router

import (
	"log"
	"net/http/httputil"

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

	var frontendProxy *httputil.ReverseProxy
	if cfg.Server.FrontendProxy != "" {
		proxy, err := newFrontendProxy(cfg.Server.FrontendProxy)
		if err != nil {
			log.Fatalf("failed to init frontend proxy: %v", err)
		}
		frontendProxy = proxy
	}

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
	settingService := service.NewSettingService(settingRepo)
	emailService := service.NewEmailService(&cfg.Email, settingService)
	authService := service.NewAuthService(userRepo, roleRepo, emailService, cfg)
	articleService := service.NewArticleService(articleRepo)
	commentService := service.NewCommentService(commentRepo, articleRepo)
	userService := service.NewUserService(userRepo, roleRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService, cfg)
	articleHandler := handler.NewArticleHandler(articleService)
	commentHandler := handler.NewCommentHandler(commentService)
	settingHandler := handler.NewSettingHandler(settingService)
	adminArticleHandler := handler.NewAdminArticleHandler(articleService)
	adminCommentHandler := handler.NewAdminCommentHandler(commentService)
	adminUserHandler := handler.NewAdminUserHandler(userService)

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

			// User management
			admin.GET("/users", adminUserHandler.List)
			admin.GET("/users/:id", adminUserHandler.GetByID)
			admin.PUT("/users/:id/status", adminUserHandler.UpdateStatus)
			admin.PUT("/users/:id/membership", adminUserHandler.UpdateMembership)
			admin.POST("/users/:id/roles", adminUserHandler.AssignRole)
			admin.DELETE("/users/:id/roles", adminUserHandler.RemoveRole)
			admin.DELETE("/users/:id", adminUserHandler.Delete)
			admin.GET("/roles", adminUserHandler.GetRoles)
		}
	}

	// All unmatched routes proxy to Next.js server (SSR / assets).
	if frontendProxy != nil {
		r.NoRoute(func(c *gin.Context) {
			if host := c.Request.Host; host != "" {
				c.Request.Header.Set("X-Forwarded-Host", host)
			}

			if proto := c.Request.Header.Get("X-Forwarded-Proto"); proto == "" {
				if c.Request.TLS != nil {
					c.Request.Header.Set("X-Forwarded-Proto", "https")
				} else {
					c.Request.Header.Set("X-Forwarded-Proto", "http")
				}
			}

			if clientIP := c.ClientIP(); clientIP != "" {
				if existing := c.Request.Header.Get("X-Forwarded-For"); existing != "" {
					clientIP = existing + ", " + clientIP
				}
				c.Request.Header.Set("X-Forwarded-For", clientIP)
			}

			frontendProxy.ServeHTTP(c.Writer, c.Request)
		})
	}

	return r
}
