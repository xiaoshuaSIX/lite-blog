package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lite-blog/backend/pkg/jwt"
)

// RequireRole creates a middleware that requires specific roles
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := GetClaimsFromContext(c)
		if claims == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
			return
		}

		// Check if user has any of the required roles
		hasRole := false
		for _, requiredRole := range roles {
			if claims.HasRole(requiredRole) {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "You don't have permission to access this resource",
				"code":  "FORBIDDEN",
			})
			return
		}

		c.Next()
	}
}

// RequireAdmin creates a middleware that requires admin role
func RequireAdmin() gin.HandlerFunc {
	return RequireRole("admin")
}

// RequireVerifiedEmail creates a middleware that requires verified email
func RequireVerifiedEmail() gin.HandlerFunc {
	return func(c *gin.Context) {
		user := GetUserFromContext(c)
		if user == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
			return
		}

		if !user.EmailVerified {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Please verify your email before performing this action",
				"code":  "EMAIL_NOT_VERIFIED",
			})
			return
		}

		c.Next()
	}
}

// HasRole checks if the current user has a specific role
func HasRole(c *gin.Context, role string) bool {
	claims := GetClaimsFromContext(c)
	if claims == nil {
		return false
	}
	return claims.HasRole(role)
}

// HasAnyRole checks if the current user has any of the specified roles
func HasAnyRole(c *gin.Context, roles ...string) bool {
	claims := GetClaimsFromContext(c)
	if claims == nil {
		return false
	}
	for _, role := range roles {
		if claims.HasRole(role) {
			return true
		}
	}
	return false
}

// GetUserRoles returns the roles of the current user
func GetUserRoles(c *gin.Context) []string {
	claims, exists := c.Get(ContextKeyClaims)
	if !exists {
		return nil
	}
	if jwtClaims, ok := claims.(*jwt.Claims); ok {
		return jwtClaims.Roles
	}
	return nil
}
