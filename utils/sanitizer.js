const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create a DOMPurify instance for Node.js
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitize input to prevent XSS and other security issues
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
function sanitizeInput(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }

  const {
    allowedTags = [],
    stripTags = true,
    trim = true,
    maxLength = null
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Strip HTML tags using DOMPurify
  if (stripTags) {
    sanitized = purify.sanitize(sanitized, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  // Remove any remaining HTML entities that might have been double-encoded
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`');

  // Remove HTML tags manually as a backup
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove script-like content
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/expression\s*\(/gi, '');

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize object properties recursively
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj, options = {}) {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeInput(key, options);
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeInput(value, options);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value, options);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }

  return sanitizeInput(email, { trim: true })
    .toLowerCase()
    .replace(/[^\w\.-@]/g, '');
}

/**
 * Sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }

  return sanitizeInput(phone, { trim: true })
    .replace(/[^\d]/g, '');
}

/**
 * Sanitize name field
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizeName(name) {
  if (typeof name !== 'string') {
    return '';
  }

  return sanitizeInput(name, { trim: true })
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Sanitize filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  if (typeof filename !== 'string') {
    return '';
  }

  return sanitizeInput(filename, { trim: true })
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Escape special characters for database queries
 * @param {string} input - Input to escape
 * @returns {string} Escaped string
 */
function escapeForDatabase(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate and sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return null;
  }

  const sanitized = sanitizeInput(url, { trim: true });
  
  // Basic URL validation
  try {
    const urlObj = new URL(sanitized);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.toString();
  } catch (error) {
    return null;
  }
}

/**
 * Remove dangerous file extensions
 * @param {string} filename - Filename to check
 * @returns {boolean} True if filename is safe
 */
function isSafeFilename(filename) {
  if (typeof filename !== 'string') {
    return false;
  }

  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
    '.jar', '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl'
  ];

  const lowerFilename = filename.toLowerCase();
  
  return !dangerousExtensions.some(ext => lowerFilename.endsWith(ext));
}

module.exports = {
  sanitizeInput,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  sanitizeFilename,
  escapeForDatabase,
  sanitizeUrl,
  isSafeFilename
};