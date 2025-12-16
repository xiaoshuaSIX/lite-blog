package service

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
	appconfig "github.com/lite-blog/backend/internal/config"
)

// SiteInfoGetter is an interface for getting site info
type SiteInfoGetter interface {
	GetSiteName() string
	GetSiteURL() string
	GetEmailFrom() string
}

type EmailService struct {
	cfg            *appconfig.EmailConfig
	sesClient      *ses.Client
	siteInfoGetter SiteInfoGetter
}

func NewEmailService(cfg *appconfig.EmailConfig, siteInfoGetter SiteInfoGetter) *EmailService {
	svc := &EmailService{
		cfg:            cfg,
		siteInfoGetter: siteInfoGetter,
	}

	// Initialize SES client if provider is SES
	if cfg.Provider == "ses" {
		awsCfg, err := config.LoadDefaultConfig(context.Background(),
			config.WithRegion(cfg.AWS.Region),
		)
		if err != nil {
			log.Printf("Warning: Failed to load AWS config: %v", err)
		} else {
			svc.sesClient = ses.NewFromConfig(awsCfg)
		}
	}

	return svc
}

func (s *EmailService) getSiteName() string {
	if s.siteInfoGetter != nil {
		return s.siteInfoGetter.GetSiteName()
	}
	return "Lite Blog"
}

func (s *EmailService) getSiteURL() string {
	if s.siteInfoGetter != nil {
		return s.siteInfoGetter.GetSiteURL()
	}
	return "http://localhost:8080"
}

func (s *EmailService) getEmailFrom() string {
	// First try to get from site settings
	if s.siteInfoGetter != nil {
		emailFrom := s.siteInfoGetter.GetEmailFrom()
		if emailFrom != "" {
			return emailFrom
		}
	}
	// Fallback to config file
	return s.cfg.From
}

// SendVerificationEmail sends an email verification link to the user
func (s *EmailService) SendVerificationEmail(email, token string) error {
	siteName := s.getSiteName()
	siteURL := s.getSiteURL()
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", siteURL, token)

	subject := fmt.Sprintf("验证您的邮箱 - %s", siteName)
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮箱验证</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a2e; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); margin: 0; padding: 40px 20px; min-height: 100vh;">
    <div style="max-width: 480px; margin: 0 auto;">
        <!-- Logo/Brand -->
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 50px;">
                <span style="color: #fff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">%s</span>
            </div>
        </div>

        <!-- Main Card -->
        <div style="background: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden;">
            <!-- Icon Section -->
            <div style="padding: 48px 40px 32px; text-align: center; background: linear-gradient(180deg, #f8fafc 0%%, #ffffff 100%%);">
                <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); border-radius: 50%%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(102,126,234,0.4);">
                    <span style="font-size: 36px;">✉️</span>
                </div>
                <h1 style="color: #1a1a2e; margin: 0 0 8px; font-size: 26px; font-weight: 700;">验证您的邮箱</h1>
                <p style="color: #64748b; margin: 0; font-size: 15px;">只需一步即可完成注册</p>
            </div>

            <!-- Content Section -->
            <div style="padding: 0 40px 40px;">
                <p style="color: #475569; font-size: 15px; margin: 0 0 28px; text-align: center;">
                    感谢您注册 <strong>%s</strong>！<br>
                    点击下方按钮验证您的邮箱地址。
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin-bottom: 28px;">
                    <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 24px rgba(102,126,234,0.4); transition: transform 0.2s;">
                        立即验证
                    </a>
                </div>

                <!-- Divider -->
                <div style="display: flex; align-items: center; margin: 28px 0;">
                    <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                    <span style="padding: 0 16px; color: #94a3b8; font-size: 12px;">或复制链接</span>
                    <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                </div>

                <!-- Link Box -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; word-break: break-all;">
                    <a href="%s" style="color: #667eea; font-size: 13px; text-decoration: none;">%s</a>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 8px;">
                ⏱️ 此链接将在 30 分钟后过期
            </p>
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">
                如果您没有注册账号，请忽略此邮件。
            </p>
        </div>
    </div>
</body>
</html>
`, siteName, siteName, verifyURL, verifyURL, verifyURL)

	textBody := fmt.Sprintf(`
欢迎注册 %s！

感谢您的注册。请点击以下链接验证您的邮箱地址：

%s

此链接将在 30 分钟后过期。

如果您没有注册账号，请忽略此邮件。
`, siteName, verifyURL)

	return s.sendEmail(email, subject, htmlBody, textBody)
}

// sendEmail sends an email using the configured provider
func (s *EmailService) sendEmail(to, subject, htmlBody, textBody string) error {
	// Log for development/debugging
	log.Printf("Sending email to: %s", to)
	log.Printf("Subject: %s", subject)

	if s.cfg.Provider == "ses" && s.sesClient != nil {
		return s.sendViaSES(to, subject, htmlBody, textBody)
	}

	// Fallback: just log the email content (for development)
	log.Printf("Email content (HTML):\n%s", htmlBody)
	log.Printf("Email content (Text):\n%s", textBody)
	log.Println("Email would be sent in production (SES not configured)")
	return nil
}

func (s *EmailService) sendViaSES(to, subject, htmlBody, textBody string) error {
	emailFrom := s.getEmailFrom()
	input := &ses.SendEmailInput{
		Destination: &types.Destination{
			ToAddresses: []string{to},
		},
		Message: &types.Message{
			Body: &types.Body{
				Html: &types.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(htmlBody),
				},
				Text: &types.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(textBody),
				},
			},
			Subject: &types.Content{
				Charset: aws.String("UTF-8"),
				Data:    aws.String(subject),
			},
		},
		Source: aws.String(emailFrom),
	}

	_, err := s.sesClient.SendEmail(context.Background(), input)
	if err != nil {
		log.Printf("Failed to send email via SES: %v", err)
		return err
	}

	log.Printf("Email sent successfully to %s via SES", to)
	return nil
}
