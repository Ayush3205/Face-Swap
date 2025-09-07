const validator = require('validator');
const { sanitizeInput } = require('../utils/sanitizer');

/**
 * Validation middleware for form submissions
 */
class ValidationMiddleware {
  /**
   * Validate form submission data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static validateSubmission(req, res, next) {
    const errors = [];
    const formData = {};

    // Sanitize all input fields
    const { name, email, phone, terms } = req.body;
    
    formData.name = sanitizeInput(name || '');
    formData.email = sanitizeInput(email || '');
    formData.phone = sanitizeInput(phone || '');
    formData.terms = terms ? 'on' : '';

    // Validate name
    if (!formData.name) {
      errors.push('Name is required');
    } else if (formData.name.length < 4 || formData.name.length > 30) {
      errors.push('Name must be between 4 and 30 characters long');
    } else if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      errors.push('Name must contain only alphabetic characters and spaces');
    }

    // Validate email
    if (!formData.email) {
      errors.push('Email is required');
    } else if (!validator.isEmail(formData.email)) {
      errors.push('Please provide a valid email address');
    }

    // Validate phone
    if (!formData.phone) {
      errors.push('Phone number is required');
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.push('Phone number must be exactly 10 digits');
    }

    // Validate terms and conditions
    if (!terms) {
      errors.push('You must accept the Terms & Conditions');
    }

    // Validate image file
    if (!req.file) {
      errors.push('Image is required');
    } else {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const maxFileSize = 2 * 1024 * 1024; // 2MB

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        errors.push('Image must be in JPG, JPEG, or PNG format');
      }

      if (req.file.size > maxFileSize) {
        errors.push('Image size must not exceed 2MB');
      }
    }

    // If validation fails, render form with errors
    if (errors.length > 0) {
      return res.status(400).render('form', {
        error: errors.join('. '),
        formData: formData
      });
    }

    // Add sanitized data to request
    req.validatedData = {
      name: formData.name,
      email: formData.email.toLowerCase(),
      phone: formData.phone,
      terms: true
    };

    next();
  }

  /**
   * Validate query parameters for submissions list
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static validateSubmissionsQuery(req, res, next) {
    const { page, limit, sort } = req.query;

    // Validate and sanitize page number
    let pageNum = 1;
    if (page) {
      pageNum = parseInt(sanitizeInput(page));
      if (isNaN(pageNum) || pageNum < 1) {
        pageNum = 1;
      }
    }

    // Validate and sanitize limit
    let limitNum = 10;
    if (limit) {
      limitNum = parseInt(sanitizeInput(limit));
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        limitNum = 10;
      }
    }

    // Validate and sanitize sort
    const allowedSortFields = ['name', 'email', 'createdAt', 'updatedAt'];
    let sortField = 'createdAt';
    let sortOrder = -1;
    
    if (sort) {
      const sortValue = sanitizeInput(sort);
      if (sortValue.startsWith('-')) {
        sortField = sortValue.substring(1);
        sortOrder = -1;
      } else {
        sortField = sortValue;
        sortOrder = 1;
      }
      
      if (!allowedSortFields.includes(sortField)) {
        sortField = 'createdAt';
        sortOrder = -1;
      }
    }

    req.queryOptions = {
      page: pageNum,
      limit: limitNum,
      skip: (pageNum - 1) * limitNum,
      sortBy: sortField,
      sortOrder: sortOrder
    };

    next();
  }

  /**
   * Validate MongoDB ObjectId parameter
   * @param {string} paramName - Parameter name to validate
   * @returns {Function} Express middleware function
   */
  static validateObjectId(paramName) {
    return (req, res, next) => {
      const id = req.params[paramName];
      
      if (!id) {
        return res.status(400).json({
          error: `${paramName} parameter is required`
        });
      }

      const sanitizedId = sanitizeInput(id);
      
      // Basic ObjectId format validation (24 character hex string)
      if (!/^[0-9a-fA-F]{24}$/.test(sanitizedId)) {
        return res.status(400).json({
          error: `Invalid ${paramName} format`
        });
      }

      req.params[paramName] = sanitizedId;
      next();
    };
  }

  /**
   * Rate limiting validation (basic implementation)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static rateLimit(req, res, next) {
    // Simple rate limiting by IP (in production, use Redis or similar)
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 10;

    if (!req.app.locals.rateLimitStore) {
      req.app.locals.rateLimitStore = new Map();
    }

    const store = req.app.locals.rateLimitStore;
    const clientData = store.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
    } else {
      clientData.count++;
    }

    store.set(ip, clientData);

    if (clientData.count > maxRequests) {
      return res.status(429).render('form', {
        error: 'Too many requests. Please try again later.',
        formData: {}
      });
    }

    next();
  }
}

module.exports = ValidationMiddleware;