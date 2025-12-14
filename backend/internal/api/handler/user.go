package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lite-blog/backend/internal/api/middleware"
	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/service"
)

type AdminUserHandler struct {
	userService *service.UserService
}

func NewAdminUserHandler(userService *service.UserService) *AdminUserHandler {
	return &AdminUserHandler{
		userService: userService,
	}
}

// ListUsersRequest represents the list users request
type ListUsersRequest struct {
	Page     int `form:"page,default=1"`
	PageSize int `form:"page_size,default=10"`
}

// UserListResponse represents the paginated user list response
type UserListResponse struct {
	Users      []service.UserListItem `json:"users"`
	Total      int64                  `json:"total"`
	Page       int                    `json:"page"`
	PageSize   int                    `json:"page_size"`
	TotalPages int                    `json:"total_pages"`
}

// UpdateStatusRequest represents the update status request
type UpdateStatusRequest struct {
	Status int `json:"status" binding:"oneof=0 1"`
}

// UpdateMembershipRequest represents the update membership request
type UpdateMembershipRequest struct {
	ExpireAt *time.Time `json:"expire_at"`
}

// RoleRequest represents a role operation request
type RoleRequest struct {
	RoleCode string `json:"role_code" binding:"required"`
}

// List returns a paginated list of users
func (h *AdminUserHandler) List(c *gin.Context) {
	var req ListUsersRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid query parameters",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// Validate pagination
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 50 {
		req.PageSize = 10
	}

	users, total, err := h.userService.ListUsers(req.Page, req.PageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	totalPages := int(total) / req.PageSize
	if int(total)%req.PageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, UserListResponse{
		Users:      users,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	})
}

// GetByID returns a user by ID
func (h *AdminUserHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	user, err := h.userService.GetUserByID(uint(id))
	if err != nil {
		if err == service.ErrUserNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
				"code":  "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateStatus updates a user's status
func (h *AdminUserHandler) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// Get current user
	currentUser := middleware.GetUserFromContext(c)
	if currentUser == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
			"code":  "AUTH_REQUIRED",
		})
		return
	}

	err = h.userService.UpdateUserStatus(uint(id), req.Status, currentUser.ID)
	if err != nil {
		switch err {
		case service.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
				"code":  "NOT_FOUND",
			})
		case service.ErrCannotDisableSelf:
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Cannot disable your own account",
				"code":  "FORBIDDEN",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to update user status",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	statusText := "enabled"
	if req.Status == model.UserStatusDisabled {
		statusText = "disabled"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User " + statusText + " successfully",
	})
}

// UpdateMembership updates a user's membership
func (h *AdminUserHandler) UpdateMembership(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	var req UpdateMembershipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	err = h.userService.UpdateMembership(uint(id), req.ExpireAt)
	if err != nil {
		if err == service.ErrUserNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
				"code":  "NOT_FOUND",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update membership",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Membership updated successfully",
	})
}

// AssignRole assigns a role to a user
func (h *AdminUserHandler) AssignRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	var req RoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	err = h.userService.AssignRole(uint(id), req.RoleCode)
	if err != nil {
		switch err {
		case service.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
				"code":  "NOT_FOUND",
			})
		case service.ErrRoleNotFound:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Role not found",
				"code":  "ROLE_NOT_FOUND",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to assign role",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role assigned successfully",
	})
}

// RemoveRole removes a role from a user
func (h *AdminUserHandler) RemoveRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	var req RoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// Get current user
	currentUser := middleware.GetUserFromContext(c)
	if currentUser == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
			"code":  "AUTH_REQUIRED",
		})
		return
	}

	err = h.userService.RemoveRole(uint(id), req.RoleCode, currentUser.ID)
	if err != nil {
		switch err {
		case service.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
				"code":  "NOT_FOUND",
			})
		case service.ErrRoleNotFound:
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Role not found",
				"code":  "ROLE_NOT_FOUND",
			})
		case service.ErrCannotRemoveOwnRole:
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Cannot remove your own admin role",
				"code":  "FORBIDDEN",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to remove role",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role removed successfully",
	})
}

// Delete deletes a user
func (h *AdminUserHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// Get current user
	currentUser := middleware.GetUserFromContext(c)
	if currentUser == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
			"code":  "AUTH_REQUIRED",
		})
		return
	}

	err = h.userService.DeleteUser(uint(id), currentUser.ID)
	if err != nil {
		switch err {
		case service.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
				"code":  "NOT_FOUND",
			})
		case service.ErrCannotDeleteSelf:
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Cannot delete your own account",
				"code":  "FORBIDDEN",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to delete user",
				"code":  "INTERNAL_ERROR",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}

// GetRoles returns all available roles
func (h *AdminUserHandler) GetRoles(c *gin.Context) {
	roles, err := h.userService.GetAllRoles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch roles",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"roles": roles,
	})
}