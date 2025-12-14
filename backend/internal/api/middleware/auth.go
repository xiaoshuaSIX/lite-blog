package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/repository"
	"github.com/lite-blog/backend/pkg/jwt"
)

const (
	// ContextKeyUser is the key for storing user in context
	ContextKeyUser = "user"
	// ContextKeyClaims is the key for storing JWT claims in context
	ContextKeyClaims = "claims"
	// CookieNameToken is the name of the JWT cookie
	CookieNameToken = "token"
)

// AuthMiddleware creates a middleware that validates JWT tokens
func AuthMiddleware(jwtSecret string, userRepo *repository.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from cookie
		tokenString, err := c.Cookie(CookieNameToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
			return
		}

		// Validate token
		claims, err := jwt.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
				"code":  "INVALID_TOKEN",
			})
			return
		}

		// Load user from database
		user, err := userRepo.FindByID(claims.UserID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "User not found",
				"code":  "USER_NOT_FOUND",
			})
			return
		}

		// Check if user is disabled
		if user.Status == model.UserStatusDisabled {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Account is disabled",
				"code":  "ACCOUNT_DISABLED",
			})
			return
		}

		// Store user and claims in context
		c.Set(ContextKeyUser, user)
		c.Set(ContextKeyClaims, claims)

		c.Next()
	}
}

// OptionalAuthMiddleware creates a middleware that optionally validates JWT tokens
// It doesn't abort if no token is present, but will set user if token is valid
func OptionalAuthMiddleware(jwtSecret string, userRepo *repository.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from cookie (don't fail if not present)
		tokenString, err := c.Cookie(CookieNameToken)
		if err != nil {
			c.Next()
			return
		}

		// Validate token
		claims, err := jwt.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			c.Next()
			return
		}

		// Load user from database
		user, err := userRepo.FindByID(claims.UserID)
		if err != nil {
			c.Next()
			return
		}

		// Check if user is disabled
		if user.Status == model.UserStatusDisabled {
			c.Next()
			return
		}

		// Store user and claims in context
		c.Set(ContextKeyUser, user)
		c.Set(ContextKeyClaims, claims)

		c.Next()
	}
}

// GetUserFromContext retrieves the user from the context
func GetUserFromContext(c *gin.Context) *model.User {
	if user, exists := c.Get(ContextKeyUser); exists {
		if u, ok := user.(*model.User); ok {
			return u
		}
	}
	return nil
}

// GetClaimsFromContext retrieves the JWT claims from the context
func GetClaimsFromContext(c *gin.Context) *jwt.Claims {
	if claims, exists := c.Get(ContextKeyClaims); exists {
		if c, ok := claims.(*jwt.Claims); ok {
			return c
		}
	}
	return nil
}
