package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/service"
)

type SettingHandler struct {
	settingService *service.SettingService
}

func NewSettingHandler(settingService *service.SettingService) *SettingHandler {
	return &SettingHandler{settingService: settingService}
}

// GetSiteSettings returns public site settings
func (h *SettingHandler) GetSiteSettings(c *gin.Context) {
	settings, err := h.settingService.GetSiteSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch site settings",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateSiteSettings updates site settings (admin only)
func (h *SettingHandler) UpdateSiteSettings(c *gin.Context) {
	var req model.SiteSettings
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	if err := h.settingService.UpdateSiteSettings(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update site settings",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	// Return updated settings
	settings, err := h.settingService.GetSiteSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Settings updated but failed to fetch",
			"code":  "INTERNAL_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, settings)
}
