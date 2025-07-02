/**
 * Error Handling Middleware
 * Centralized error handling for the Express application
 */

const logger = require('../config/logger');

/**
 * Custom Application Error class
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, type = null, code = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.type = type || (statusCode >= 400 && statusCode < 500 ? 'client_error' : 'server_error');
    this.code = code || 'GENERIC_ERROR';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle database/Supabase errors
 */
const handleSupabaseError = (error) => {
  let message = 'Database operation failed';
  let statusCode = 500;

  // Handle common Supabase error codes
  if (error.code === 'PGRST116') {
    message = 'Resource not found';
    statusCode = 404;
  } else if (error.code === '23505') {
    message = 'Duplicate entry - resource already exists';
    statusCode = 409;
  } else if (error.code === '23503') {
    message = 'Referenced resource not found';
    statusCode = 400;
  } else if (error.message) {
    message = error.message;
  }

  return new AppError(message, statusCode);
};

/**
 * Handle validation errors
 */
const handleValidationError = (error) => {
  const errors = error.details?.map(detail => detail.message) || [error.message];
  const message = `Validation Error: ${errors.join(', ')}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

/**
 * Handle rate limiting errors
 */
const handleRateLimitError = () => {
  return new AppError('Too many requests from this IP, please try again later.', 429);
};

/**
 * Handle file upload errors
 */
const handleFileUploadError = (error) => {
  let message = 'File upload failed';
  let statusCode = 400;

  if (error.code === 'LIMIT_FILE_SIZE') {
    message = 'File too large';
  } else if (error.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected file field';
  }

  return new AppError(message, statusCode);
};

/**
 * Handle validation middleware errors
 */
const handleExpressValidatorError = (error) => {
  const errors = error.array().map(err => `${err.param}: ${err.msg}`);
  const message = `Validation Error: ${errors.join(', ')}`;
  return new AppError(message, 400);
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: {
      type: err.type || 'server_error',
      code: err.code || 'UNKNOWN_ERROR',
      details: err.message,
      stack: err.stack
    },
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      error: {
        type: err.type || 'client_error',
        code: err.code || 'OPERATIONAL_ERROR'
      },
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);
    
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong!',
      error: {
        type: 'server_error',
        code: 'INTERNAL_ERROR'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Global error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    logger.error('Development Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
    
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.code?.startsWith('PGRST') || error.code?.match(/^\d{5}$/)) {
      error = handleSupabaseError(error);
    }
    
    if (error.name === 'ValidationError' || error.isJoi) {
      error = handleValidationError(error);
    }
    
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    
    if (error.type === 'too_many_requests' || error.message?.includes('Too many requests')) {
      error = handleRateLimitError();
    }
    
    if (error.code?.startsWith('LIMIT_') || error.name === 'MulterError') {
      error = handleFileUploadError(error);
    }
    
    if (error.array && typeof error.array === 'function') {
      error = handleExpressValidatorError(error);
    }

    logger.error('Production Error:', {
      message: error.message,
      statusCode: error.statusCode,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });

    sendErrorProd(error, res);
  }
};

/**
 * Handle unhandled routes
 */
const handleUnknownRoute = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

/**
 * Async error wrapper
 * Catches async errors and passes them to error handler
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  globalErrorHandler,
  handleUnknownRoute,
  catchAsync
};