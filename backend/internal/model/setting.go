package model

import (
	"time"
)

// Setting represents a site setting
type Setting struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Key       string    `gorm:"uniqueIndex;size:100;not null" json:"key"`
	Value     string    `gorm:"type:text" json:"value"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SiteSettings represents all site settings as a structured object
type SiteSettings struct {
	SiteName          string `json:"site_name"`
	SiteDescription   string `json:"site_description"`
	SiteKeywords      string `json:"site_keywords"`
	HomeTitle         string `json:"home_title"`
	HomeSubtitle      string `json:"home_subtitle"`
	HomeCustomContent string `json:"home_custom_content"`
	FooterText        string `json:"footer_text"`
	LogoURL           string `json:"logo_url"`
}

// DefaultSiteSettings returns default site settings
func DefaultSiteSettings() *SiteSettings {
	return &SiteSettings{
		SiteName:          "Lite Blog",
		SiteDescription:   "A role-based blog system",
		SiteKeywords:      "blog, articles, technology",
		HomeTitle:         "Welcome to Lite Blog",
		HomeSubtitle:      "Discover amazing articles and insights",
		HomeCustomContent: "About this blog: This is a customizable area where you can introduce yourself or your website.",
		FooterText:        "Lite Blog. All rights reserved.",
		LogoURL:           "",
	}
}
