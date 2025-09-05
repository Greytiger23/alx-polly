/**
 * Utility functions for sanitizing user input and preventing XSS attacks
 */

/**
 * Sanitizes text content for safe display in React components
 * Removes HTML tags, scripts, and potentially dangerous content
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, (match) => {
      // Replace dangerous characters with HTML entities
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    })
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitizes text for use in URLs (more restrictive)
 */
export function sanitizeForUrl(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, '') // Remove dangerous characters completely
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/[^\w\s-_.]/g, '') // Keep only alphanumeric, spaces, hyphens, underscores, dots
    .trim();
}

/**
 * Validates that a string contains only safe characters for display
 */
export function isTextSafe(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /<\/script>/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<link[^>]*>/i,
    /<meta[^>]*>/i
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Truncates text to a maximum length and adds ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitizes and truncates text for safe display
 */
export function sanitizeAndTruncate(input: string | null | undefined, maxLength: number = 200): string {
  const sanitized = sanitizeText(input);
  return truncateText(sanitized, maxLength);
}