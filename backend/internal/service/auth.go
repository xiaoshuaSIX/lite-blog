package service

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/lite-blog/backend/internal/config"
	"github.com/lite-blog/backend/internal/model"
	"github.com/lite-blog/backend/internal/repository"
	"github.com/lite-blog/backend/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailAlreadyExists = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrUserDisabled       = errors.New("user account is disabled")
	ErrEmailNotVerified   = errors.New("email not verified")
	ErrTooManyRequests    = errors.New("too many requests, please try again later")
)

type AuthService struct {
	userRepo     *repository.UserRepository
	roleRepo     *repository.RoleRepository
	emailService *EmailService
	cfg          *config.Config
}

func NewAuthService(
	userRepo *repository.UserRepository,
	roleRepo *repository.RoleRepository,
	emailService *EmailService,
	cfg *config.Config,
) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		roleRepo:     roleRepo,
		emailService: emailService,
		cfg:          cfg,
	}
}

// Register creates a new user account
func (s *AuthService) Register(email, password string) (*model.User, error) {
	// Check if email already exists
	if s.userRepo.ExistsByEmail(email) {
		return nil, ErrEmailAlreadyExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Generate verification token
	token, err := generateRandomToken(32)
	if err != nil {
		return nil, err
	}

	// Set expiration time (30 minutes)
	expireAt := time.Now().Add(30 * time.Minute)
	sentAt := time.Now()

	// Create user
	user := &model.User{
		Email:                     email,
		PasswordHash:              string(hashedPassword),
		EmailVerified:             false,
		EmailVerificationToken:    &token,
		EmailVerificationExpireAt: &expireAt,
		EmailVerificationSentAt:   &sentAt,
		Status:                    model.UserStatusActive,
	}

	// Assign default "user" role
	userRole, err := s.roleRepo.FindByCode(model.RoleCodeUser)
	if err == nil {
		user.Roles = []model.Role{*userRole}
	}

	// Save user
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Send verification email (async)
	go s.emailService.SendVerificationEmail(email, token)

	return user, nil
}

// VerifyEmail verifies a user's email with the provided token
func (s *AuthService) VerifyEmail(token string) error {
	// Find user by token
	user, err := s.userRepo.FindByVerificationToken(token)
	if err != nil {
		return ErrInvalidToken
	}

	// Check if token is expired
	if user.EmailVerificationExpireAt != nil && time.Now().After(*user.EmailVerificationExpireAt) {
		return ErrInvalidToken
	}

	// Update user
	user.EmailVerified = true
	user.EmailVerificationToken = nil
	user.EmailVerificationExpireAt = nil

	return s.userRepo.Update(user)
}

// ResendVerification resends the verification email
func (s *AuthService) ResendVerification(userID uint) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return ErrUserNotFound
	}

	if user.EmailVerified {
		return errors.New("email already verified")
	}

	// Check rate limiting (60 seconds between sends)
	if user.EmailVerificationSentAt != nil {
		if time.Since(*user.EmailVerificationSentAt) < 60*time.Second {
			return ErrTooManyRequests
		}
	}

	// Generate new token
	token, err := generateRandomToken(32)
	if err != nil {
		return err
	}

	// Update user with new token
	expireAt := time.Now().Add(30 * time.Minute)
	sentAt := time.Now()
	user.EmailVerificationToken = &token
	user.EmailVerificationExpireAt = &expireAt
	user.EmailVerificationSentAt = &sentAt

	if err := s.userRepo.Update(user); err != nil {
		return err
	}

	// Send verification email (async)
	go s.emailService.SendVerificationEmail(user.Email, token)

	return nil
}

// Login authenticates a user and returns a JWT token
func (s *AuthService) Login(email, password string) (*model.User, string, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Check if user is disabled
	if user.Status == model.UserStatusDisabled {
		return nil, "", ErrUserDisabled
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Generate JWT token
	token, err := jwt.GenerateToken(
		user.ID,
		user.Email,
		user.GetRoleCodes(),
		s.cfg.JWT.Secret,
		s.cfg.JWT.ExpireHours,
	)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// GetUserByID returns a user by ID
func (s *AuthService) GetUserByID(id uint) (*model.User, error) {
	return s.userRepo.FindByID(id)
}

// generateRandomToken generates a random base64-encoded token
func generateRandomToken(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(b), nil
}
