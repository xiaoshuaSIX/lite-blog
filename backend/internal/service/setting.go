package service

import (
	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/repository"
)

type SettingService struct {
	settingRepo *repository.SettingRepository
}

func NewSettingService(settingRepo *repository.SettingRepository) *SettingService {
	return &SettingService{settingRepo: settingRepo}
}

// GetSiteSettings returns all site settings as a structured object
func (s *SettingService) GetSiteSettings() (*model.SiteSettings, error) {
	settings, err := s.settingRepo.GetAll()
	if err != nil {
		return nil, err
	}

	// Start with defaults
	siteSettings := model.DefaultSiteSettings()

	// Override with database values
	for _, setting := range settings {
		switch setting.Key {
		case "site_name":
			siteSettings.SiteName = setting.Value
		case "site_description":
			siteSettings.SiteDescription = setting.Value
		case "site_keywords":
			siteSettings.SiteKeywords = setting.Value
		case "site_url":
			siteSettings.SiteURL = setting.Value
		case "email_from":
			siteSettings.EmailFrom = setting.Value
		case "home_title":
			siteSettings.HomeTitle = setting.Value
		case "home_subtitle":
			siteSettings.HomeSubtitle = setting.Value
		case "home_custom_content":
			siteSettings.HomeCustomContent = setting.Value
		case "footer_text":
			siteSettings.FooterText = setting.Value
		case "logo_url":
			siteSettings.LogoURL = setting.Value
		}
	}

	return siteSettings, nil
}

// UpdateSiteSettings updates site settings
func (s *SettingService) UpdateSiteSettings(settings *model.SiteSettings) error {
	updates := map[string]string{
		"site_name":           settings.SiteName,
		"site_description":    settings.SiteDescription,
		"site_keywords":       settings.SiteKeywords,
		"site_url":            settings.SiteURL,
		"email_from":          settings.EmailFrom,
		"home_title":          settings.HomeTitle,
		"home_subtitle":       settings.HomeSubtitle,
		"home_custom_content": settings.HomeCustomContent,
		"footer_text":         settings.FooterText,
		"logo_url":            settings.LogoURL,
	}

	return s.settingRepo.UpdateMultiple(updates)
}

// GetSiteName returns the site name for use in emails etc.
func (s *SettingService) GetSiteName() string {
	settings, err := s.GetSiteSettings()
	if err != nil || settings.SiteName == "" {
		return "Lite Blog"
	}
	return settings.SiteName
}

// GetSiteURL returns the site URL for use in emails etc.
func (s *SettingService) GetSiteURL() string {
	settings, err := s.GetSiteSettings()
	if err != nil || settings.SiteURL == "" {
		return "http://localhost:8080"
	}
	return settings.SiteURL
}

// GetEmailFrom returns the email from address for sending emails
func (s *SettingService) GetEmailFrom() string {
	settings, err := s.GetSiteSettings()
	if err != nil || settings.EmailFrom == "" {
		return ""
	}
	return settings.EmailFrom
}
