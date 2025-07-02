/**
 * Validation Middleware
 * Comprehensive input validation for all API endpoints using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');
const logger = require('../config/logger');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    logger.warn('Validation failed:', {
      url: req.originalUrl,
      method: req.method,
      errors: errorMessages,
      userId: req.user?.id,
      ip: req.ip
    });

    const errorMessage = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');
    
    return next(new AppError(
      `Validation Error: ${errorMessage}`,
      400,
      true,
      'validation',
      'VALIDATION_FAILED'
    ));
  }
  
  next();
};

/**
 * Custom UUID validation
 */
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Property validation rules
 */
const propertyValidation = {
  // Create property validation
  create: [
    body('name')
      .notEmpty()
      .withMessage('Property name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Property name must be 1-255 characters')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
      .trim(),
    
    body('address')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Address must be less than 500 characters')
      .trim(),
    
    body('property_type')
      .optional()
      .isIn(['residential', 'commercial', 'industrial', 'mixed_use', 'other'])
      .withMessage('Property type must be one of: residential, commercial, industrial, mixed_use, other'),
    
    body('settings')
      .optional()
      .isObject()
      .withMessage('Settings must be a valid object'),
    
    handleValidationErrors
  ],

  // Update property validation
  update: [
    param('id')
      .custom(isValidUUID)
      .withMessage('Property ID must be a valid UUID'),
    
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Property name cannot be empty')
      .isLength({ min: 1, max: 255 })
      .withMessage('Property name must be 1-255 characters')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
      .trim(),
    
    body('address')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Address must be less than 500 characters')
      .trim(),
    
    body('property_type')
      .optional()
      .isIn(['residential', 'commercial', 'industrial', 'mixed_use', 'other'])
      .withMessage('Property type must be one of: residential, commercial, industrial, mixed_use, other'),
    
    body('settings')
      .optional()
      .isObject()
      .withMessage('Settings must be a valid object'),
    
    handleValidationErrors
  ],

  // Get property by ID validation
  getById: [
    param('id')
      .custom(isValidUUID)
      .withMessage('Property ID must be a valid UUID'),
    
    handleValidationErrors
  ],

  // Delete property validation
  delete: [
    param('id')
      .custom(isValidUUID)
      .withMessage('Property ID must be a valid UUID'),
    
    handleValidationErrors
  ],

  // Get properties with filters validation
  getAll: [
    query('property_type')
      .optional()
      .isIn(['residential', 'commercial', 'industrial', 'mixed_use', 'other'])
      .withMessage('Property type must be one of: residential, commercial, industrial, mixed_use, other'),
    
    query('sortBy')
      .optional()
      .isIn(['name', 'created_at', 'updated_at', 'property_type'])
      .withMessage('Sort by must be one of: name, created_at, updated_at, property_type'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be a number between 1 and 100'),
    
    handleValidationErrors
  ]
};

/**
 * Item validation rules
 */
const itemValidation = {
  // Create item validation
  create: [
    body('property_id')
      .notEmpty()
      .withMessage('Property ID is required')
      .custom(isValidUUID)
      .withMessage('Property ID must be a valid UUID'),
    
    body('name')
      .notEmpty()
      .withMessage('Item name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Item name must be 1-255 characters')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
      .trim(),
    
    body('location')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Location must be less than 500 characters')
      .trim(),
    
    body('media_url')
      .optional()
      .isURL()
      .withMessage('Media URL must be a valid URL'),
    
    body('media_type')
      .optional()
      .isIn(['image', 'video', 'document', 'audio', 'other'])
      .withMessage('Media type must be one of: image, video, document, audio, other'),
    
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be a valid object'),
    
    handleValidationErrors
  ],

  // Update item validation
  update: [
    param('id')
      .custom(isValidUUID)
      .withMessage('Item ID must be a valid UUID'),
    
    body('property_id')
      .optional()
      .custom(isValidUUID)
      .withMessage('Property ID must be a valid UUID'),
    
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Item name cannot be empty')
      .isLength({ min: 1, max: 255 })
      .withMessage('Item name must be 1-255 characters')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
      .trim(),
    
    body('location')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Location must be less than 500 characters')
      .trim(),
    
    body('media_url')
      .optional()
      .isURL()
      .withMessage('Media URL must be a valid URL'),
    
    body('media_type')
      .optional()
      .isIn(['image', 'video', 'document', 'audio', 'other'])
      .withMessage('Media type must be one of: image, video, document, audio, other'),
    
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be a valid object'),
    
    handleValidationErrors
  ],

  // Get item by ID validation
  getById: [
    param('id')
      .custom(isValidUUID)
      .withMessage('Item ID must be a valid UUID'),
    
    handleValidationErrors
  ],

  // Delete item validation
  delete: [
    param('id')
      .custom(isValidUUID)
      .withMessage('Item ID must be a valid UUID'),
    
    handleValidationErrors
  ],

  // Get items with filters validation
  getAll: [
    query('media_type')
      .optional()
      .isIn(['image', 'video', 'document', 'audio', 'other'])
      .withMessage('Media type must be one of: image, video, document, audio, other'),
    
    query('location')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Location filter must be less than 500 characters'),
    
    query('sortBy')
      .optional()
      .isIn(['name', 'created_at', 'updated_at', 'location', 'media_type'])
      .withMessage('Sort by must be one of: name, created_at, updated_at, location, media_type'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be a number between 1 and 100'),
    
    handleValidationErrors
  ],

  // Get items for property validation
  getForProperty: [
    param('propertyId')
      .custom(isValidUUID)
      .withMessage('Property ID must be a valid UUID'),
    
    query('media_type')
      .optional()
      .isIn(['image', 'video', 'document', 'audio', 'other'])
      .withMessage('Media type must be one of: image, video, document, audio, other'),
    
    query('location')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Location filter must be less than 500 characters'),
    
    query('sortBy')
      .optional()
      .isIn(['name', 'created_at', 'updated_at', 'location', 'media_type'])
      .withMessage('Sort by must be one of: name, created_at, updated_at, location, media_type'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be a number between 1 and 100'),
    
    handleValidationErrors
  ]
};

/**
 * QR Code validation rules
 */
const qrCodeValidation = {
  // Create QR code validation
  create: [
    body('item_id')
      .notEmpty()
      .withMessage('Item ID is required')
      .custom(isValidUUID)
      .withMessage('Item ID must be a valid UUID'),
    
    body('allowMultiple')
      .optional()
      .isBoolean()
      .withMessage('Allow multiple must be a boolean'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'expired', 'deleted'])
      .withMessage('Status must be one of: active, inactive, expired, deleted'),
    
    body('customQRId')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Custom QR ID must be 1-255 characters')
      .matches(/^[A-Z0-9\-_]+$/i)
      .withMessage('Custom QR ID can only contain letters, numbers, hyphens, and underscores'),
    
    handleValidationErrors
  ],

  // Update QR code validation
  update: [
    param('id')
      .custom(isValidUUID)
      .withMessage('QR code ID must be a valid UUID'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'expired', 'deleted'])
      .withMessage('Status must be one of: active, inactive, expired, deleted'),
    
    body('qr_id')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('QR ID must be 1-255 characters')
      .matches(/^[A-Z0-9\-_]+$/i)
      .withMessage('QR ID can only contain letters, numbers, hyphens, and underscores'),
    
    handleValidationErrors
  ],

  // Get QR code by QR ID validation (public endpoint)
  getByQRId: [
    param('qrId')
      .notEmpty()
      .withMessage('QR ID is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('QR ID must be 1-255 characters'),
    
    handleValidationErrors
  ],

  // Record scan validation (public endpoint)
  recordScan: [
    param('qrId')
      .notEmpty()
      .withMessage('QR ID is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('QR ID must be 1-255 characters'),
    
    body('location')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Scan location must be less than 500 characters'),
    
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Scan notes must be less than 1000 characters'),
    
    handleValidationErrors
  ],

  // Delete QR code validation
  delete: [
    param('id')
      .custom(isValidUUID)
      .withMessage('QR code ID must be a valid UUID'),
    
    query('hard')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('Hard delete parameter must be true or false'),
    
    handleValidationErrors
  ],

  // Get QR codes with filters validation
  getAll: [
    query('item_id')
      .optional()
      .custom(isValidUUID)
      .withMessage('Item ID must be a valid UUID'),
    
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'expired', 'deleted'])
      .withMessage('Status must be one of: active, inactive, expired, deleted'),
    
    query('sortBy')
      .optional()
      .isIn(['created_at', 'updated_at', 'scan_count', 'last_scanned', 'status'])
      .withMessage('Sort by must be one of: created_at, updated_at, scan_count, last_scanned, status'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be a number between 1 and 100'),
    
    handleValidationErrors
  ],

  // Get analytics validation
  getAnalytics: [
    query('itemId')
      .optional()
      .custom(isValidUUID)
      .withMessage('Item ID must be a valid UUID'),
    
    handleValidationErrors
  ]
};

/**
 * Authentication validation rules
 */
const authValidation = {
  // Login validation
  login: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Email must be valid')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    handleValidationErrors
  ],

  // Register validation
  register: [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters')
      .trim(),
    
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Email must be valid')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('confirmPassword')
      .notEmpty()
      .withMessage('Password confirmation is required')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
    
    handleValidationErrors
  ]
};

/**
 * General validation utilities
 */
const commonValidation = {
  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be a number between 1 and 100'),
    
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
    
    handleValidationErrors
  ],

  // File upload validation
  fileUpload: [
    body('fileType')
      .optional()
      .isIn(['image', 'video', 'document', 'audio'])
      .withMessage('File type must be one of: image, video, document, audio'),
    
    body('maxFileSize')
      .optional()
      .isInt({ min: 1, max: 50000000 }) // 50MB max
      .withMessage('Max file size must be between 1 byte and 50MB'),
    
    handleValidationErrors
  ],

  // Search validation
  search: [
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be 1-100 characters')
      .trim(),
    
    query('fields')
      .optional()
      .isArray()
      .withMessage('Search fields must be an array'),
    
    handleValidationErrors
  ]
};

/**
 * Sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Basic XSS protection - strip HTML tags from string inputs
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/<[^>]+>/g, '')
                  .trim();
    }
    return value;
  };

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (key !== 'metadata' && key !== 'settings') { // Don't sanitize JSON fields
        req.body[key] = sanitizeValue(req.body[key]);
      }
    });
  }

  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitizeValue(req.query[key]);
    });
  }

  next();
};

module.exports = {
  propertyValidation,
  itemValidation,
  qrCodeValidation,
  authValidation,
  commonValidation,
  handleValidationErrors,
  sanitizeInput,
  isValidUUID
};