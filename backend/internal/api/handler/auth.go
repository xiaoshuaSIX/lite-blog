package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lite-blog/backend/internal/api/middleware"
	"github.com/lite-blog/backend/internal/config"
	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
	cfg         *config.Config
}

func NewAuthHandler(authService *service.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		cfg:         cfg,
	}
}

// RegisterRequest represents the register request body
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=128"`
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// VerifyEmailRequest represents the verify email request body
type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

// UserResponse represents the user response
type UserResponse struct {
	ID             uint    `json:"id"`
	Email          string  `json:"email"`
	EmailVerified  bool    `json:"email_verified"`
	IsMember       bool    `json:"is_member"`
	MemberExpireAt *string `json:"member_expire_at,omitempty"`
	Roles          []string `json:"roles"`
	CreatedAt      string  `json:"created_at"`
}

// buildUserResponse creates a UserResponse from a User model
func buildUserResponse(user *model.User) UserResponse {
	resp := UserResponse{
		ID:            user.ID,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		IsMember:      user.IsMember(),
		Roles:         user.GetRoleCodes(),
		CreatedAt:     user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if user.MemberExpireAt != nil {
		expireStr := user.MemberExpireAt.Format("2006-01-02T15:04:05Z07:00")
		resp.MemberExpireAt = &expireStr
	}
	return resp
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// Normalize email
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	user, err := h.authService.Register(req.Email, req.Password)
	if err != nil {
		switch err {
		case service.ErrEmailAlreadyExists:
			c.JSON(http.StatusConflict, gin.H{
				"error": "Email already registered",
				"code":  "EMAIL_EXISTS",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create account",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Please check your email to verify your account.",
		"user":    buildUserResponse(user),
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// Normalize email
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	user, token, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		switch err {
		case service.ErrInvalidCredentials:
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid email or password",
				"code":  "INVALID_CREDENTIALS",
			})
		case service.ErrUserDisabled:
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Your account has been disabled",
				"code":  "ACCOUNT_DISABLED",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Login failed",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	// Set HttpOnly cookie
	h.setTokenCookie(c, token)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    buildUserResponse(user),
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear the token cookie
	h.clearTokenCookie(c)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// Me returns the current user's information
func (h *AuthHandler) Me(c *gin.Context) {
	user := middleware.GetUserFromContext(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Not authenticated",
			"code":  "AUTH_REQUIRED",
		})
		return
	}

	c.JSON(http.StatusOK, buildUserResponse(user))
}

// VerifyEmail handles email verification
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	err := h.authService.VerifyEmail(req.Token)
	if err != nil {
		switch err {
		case service.ErrInvalidToken:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid or expired verification token",
				"code":  "INVALID_TOKEN",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Verification failed",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Email verified successfully",
	})
}

// ResendVerification resends the verification email
func (h *AuthHandler) ResendVerification(c *gin.Context) {
	user := middleware.GetUserFromContext(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Not authenticated",
			"code":  "AUTH_REQUIRED",
		})
		return
	}

	err := h.authService.ResendVerification(user.ID)
	if err != nil {
		switch err {
		case service.ErrTooManyRequests:
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Please wait before requesting another verification email",
				"code":  "TOO_MANY_REQUESTS",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Verification email sent",
	})
}

// setTokenCookie sets the JWT token in an HttpOnly cookie
func (h *AuthHandler) setTokenCookie(c *gin.Context, token string) {
	maxAge := h.cfg.JWT.ExpireHours * 3600 // Convert hours to seconds
	secure := isSecureRequest(c)

	c.SetCookie(
		middleware.CookieNameToken, // name
		token,                      // value
		maxAge,                     // max age in seconds
		"/",                        // path
		"",                         // domain (empty = current domain)
		secure,                     // secure (HTTPS only in production)
		true,                       // httpOnly
	)
}

// clearTokenCookie clears the JWT token cookie
func (h *AuthHandler) clearTokenCookie(c *gin.Context) {
	secure := isSecureRequest(c)

	c.SetCookie(
		middleware.CookieNameToken,
		"",
		-1, // negative max age deletes the cookie
		"/",
		"",
		secure,
		true,
	)
}

// isSecureRequest determines whether the current request is over HTTPS, including common proxy headers.
func isSecureRequest(c *gin.Context) bool {
	if c.Request.TLS != nil {
		return true
	}

	proto := c.Request.Header.Get("X-Forwarded-Proto")
	if strings.EqualFold(proto, "https") {
		return true
	}

	if strings.EqualFold(c.Request.Header.Get("X-Forwarded-Ssl"), "on") {
		return true
	}

	return false
}
