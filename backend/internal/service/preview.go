package service

import (
	"strings"
	"unicode/utf8"
)

// PreviewConfig holds the configuration for content preview
type PreviewConfig struct {
	Percentage     int  // Percentage of content to show (0-100)
	MinChars       int  // Minimum number of characters to show
	SmartParagraph bool // Whether to cut at paragraph boundaries
}

// DefaultPreviewConfig returns the default preview configuration
func DefaultPreviewConfig() PreviewConfig {
	return PreviewConfig{
		Percentage:     30,
		MinChars:       200,
		SmartParagraph: true,
	}
}

// GeneratePreview generates a preview of the content based on the given configuration.
// It calculates the preview length based on percentage, ensures minimum chars,
// and optionally cuts at smart paragraph boundaries.
func GeneratePreview(content string, cfg PreviewConfig) string {
	if content == "" {
		return ""
	}

	// Count runes (characters) for proper Unicode support
	totalRunes := utf8.RuneCountInString(content)
	if totalRunes == 0 {
		return ""
	}

	// Calculate the target length based on percentage
	targetLength := (totalRunes * cfg.Percentage) / 100

	// Ensure minimum characters
	if targetLength < cfg.MinChars {
		targetLength = cfg.MinChars
	}

	// If target length is greater than or equal to total, return full content
	if targetLength >= totalRunes {
		return content
	}

	// Convert to rune slice for proper slicing
	runes := []rune(content)

	// Get the initial cut point
	cutPoint := targetLength

	// Smart paragraph cutting
	if cfg.SmartParagraph {
		cutPoint = findSmartCutPoint(runes, targetLength)
	}

	// Ensure we don't exceed the total length
	if cutPoint > len(runes) {
		cutPoint = len(runes)
	}

	return string(runes[:cutPoint])
}

// findSmartCutPoint finds the best cut point near the target length
// It looks for paragraph breaks (\n\n), line breaks (\n), or sentence endings.
func findSmartCutPoint(runes []rune, targetLength int) int {
	// Define the search window (look forward from target, not too far)
	maxForwardSearch := 100 // Max characters to look forward
	endSearch := targetLength + maxForwardSearch
	if endSearch > len(runes) {
		endSearch = len(runes)
	}

	// First, look for paragraph break (double newline) forward from target
	for i := targetLength; i < endSearch-1; i++ {
		if runes[i] == '\n' && i+1 < len(runes) && runes[i+1] == '\n' {
			return i + 2 // Include the double newline
		}
	}

	// Look for single newline forward from target
	for i := targetLength; i < endSearch; i++ {
		if runes[i] == '\n' {
			return i + 1 // Include the newline
		}
	}

	// Look for sentence endings forward from target
	for i := targetLength; i < endSearch; i++ {
		if isSentenceEnd(runes, i) {
			return i + 1
		}
	}

	// If no good cut point found forward, try looking backward
	// for a sentence ending (better than cutting mid-word)
	for i := targetLength; i > targetLength-50 && i > 0; i-- {
		if isSentenceEnd(runes, i) {
			return i + 1
		}
	}

	// Fallback: try to avoid cutting in the middle of a word
	// by finding the last space before the target
	for i := targetLength; i > targetLength-30 && i > 0; i-- {
		if runes[i] == ' ' || runes[i] == '\t' {
			return i
		}
	}

	// If all else fails, just cut at target length
	return targetLength
}

// isSentenceEnd checks if the character at position i is a sentence-ending punctuation
func isSentenceEnd(runes []rune, i int) bool {
	if i >= len(runes) {
		return false
	}

	r := runes[i]
	// Check for common sentence-ending punctuation
	// Including both ASCII and Chinese punctuation
	return r == '.' || r == '!' || r == '?' ||
		r == '。' || r == '！' || r == '？' ||
		r == '；' // Chinese semicolon can also be a good break point
}

// GeneratePreviewWithEllipsis generates a preview and appends ellipsis if content was truncated
func GeneratePreviewWithEllipsis(content string, cfg PreviewConfig) (preview string, isTruncated bool) {
	preview = GeneratePreview(content, cfg)
	isTruncated = utf8.RuneCountInString(preview) < utf8.RuneCountInString(content)

	if isTruncated {
		// Trim trailing whitespace before adding ellipsis
		preview = strings.TrimRight(preview, " \t\n\r")
		preview += "..."
	}

	return preview, isTruncated
}
