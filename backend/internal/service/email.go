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

type EmailService struct {
	cfg       *appconfig.EmailConfig
	sesClient *ses.Client
	baseURL   string
}

func NewEmailService(cfg *appconfig.EmailConfig, baseURL string) *EmailService {
	svc := &EmailService{
		cfg:     cfg,
		baseURL: baseURL,
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

// SendVerificationEmail sends an email verification link to the user
func (s *EmailService) SendVerificationEmail(email, token string) error {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", s.baseURL, token)

	subject := "Verify your email address - Lite Blog"
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Welcome to Lite Blog!</h2>
        <p>Thank you for registering. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="%s" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email
            </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">%s</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 30 minutes.<br>
            If you didn't create an account, you can safely ignore this email.
        </p>
    </div>
</body>
</html>
`, verifyURL, verifyURL)

	textBody := fmt.Sprintf(`
Welcome to Lite Blog!

Thank you for registering. Please click the link below to verify your email address:

%s

This link will expire in 30 minutes.

If you didn't create an account, you can safely ignore this email.
`, verifyURL)

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
		Source: aws.String(s.cfg.From),
	}

	_, err := s.sesClient.SendEmail(context.Background(), input)
	if err != nil {
		log.Printf("Failed to send email via SES: %v", err)
		return err
	}

	log.Printf("Email sent successfully to %s via SES", to)
	return nil
}
