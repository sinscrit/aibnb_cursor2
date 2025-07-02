/**
 * Authentication Middleware
 * Handles JWT token validation, user session management, and authentication
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { AppError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'demo-jwt-secret-key-for-development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Demo user for development/testing
 */
const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@propertymanagement.local',
  name: 'Demo User',
  role: 'user',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Extract token from request headers
 */
const extractToken = (req) => {
  let token = null;

  // Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check Authorization header (basic format)
  else if (req.headers.authorization) {
    token = req.headers.authorization;
  }
  
  // Check x-auth-token header
  else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }
  
  // Check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token;
};

/**
 * Authentication middleware - protects routes that require authentication
 */
const authenticate = async (req, res, next) => {
  try {
    const startTime = Date.now();
    
    // Extract token
    const token = extractToken(req);

    if (!token) {
      logger.warn('Authentication failed - no token provided:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method
      });

      return next(new AppError('Access denied. No token provided.', 401, true, 'authentication', 'TOKEN_MISSING'));
    }

    // Special handling for demo mode
    if (token === 'demo-token' || process.env.NODE_ENV === 'development') {
      logger.info('Demo authentication:', {
        token: token === 'demo-token' ? 'demo-token' : 'development-mode',
        ip: req.ip,
        url: req.originalUrl
      });

      req.user = DEMO_USER;
      req.token = token;
      req.authDuration = Date.now() - startTime;
      return next();
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Authentication failed - token expired:', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl
        });
        return next(new AppError('Token expired. Please log in again.', 401, true, 'authentication', 'TOKEN_EXPIRED'));
      }
      
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Authentication failed - invalid token:', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          error: error.message
        });
        return next(new AppError('Invalid token. Please log in again.', 401, true, 'authentication', 'TOKEN_INVALID'));
      }
      
      throw error;
    }

    // In a real application, you would fetch the user from the database
    // For now, we'll use the demo user with the decoded ID
    const user = {
      ...DEMO_USER,
      id: decoded.id,
      tokenIssued: decoded.iat,
      tokenExpires: decoded.exp
    };

    logger.info('Authentication successful:', {
      userId: user.id,
      ip: req.ip,
      url: req.originalUrl,
      duration: Date.now() - startTime
    });

    // Attach user and token to request
    req.user = user;
    req.token = token;
    req.authDuration = Date.now() - startTime;

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    next(new AppError('Authentication failed', 500, true, 'authentication', 'AUTH_ERROR'));
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      req.token = null;
      return next();
    }

    // Use the same authentication logic but don't fail on missing token
    return authenticate(req, res, next);
  } catch (error) {
    // On any auth error, just continue without authentication
    req.user = null;
    req.token = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Access denied. Authentication required.', 401, true, 'authorization', 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed - insufficient permissions:', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        url: req.originalUrl
      });

      return next(new AppError('Access denied. Insufficient permissions.', 403, true, 'authorization', 'INSUFFICIENT_PERMISSIONS'));
    }

    logger.info('Authorization successful:', {
      userId: req.user.id,
      userRole: req.user.role,
      url: req.originalUrl
    });

    next();
  };
};

/**
 * Login function to generate and return JWT token
 */
const login = (userId, userData = {}) => {
  try {
    const token = generateToken(userId);
    
    const user = {
      ...DEMO_USER,
      ...userData,
      id: userId
    };

    logger.info('User login successful:', {
      userId,
      email: user.email
    });

    return {
      success: true,
      token,
      user,
      expiresIn: JWT_EXPIRES_IN
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw new AppError('Login failed', 500, true, 'authentication', 'LOGIN_ERROR');
  }
};

/**
 * Logout function to invalidate token (in real app, would add to blacklist)
 */
const logout = (req) => {
  try {
    logger.info('User logout:', {
      userId: req.user?.id,
      ip: req.ip
    });

    // In a real application, you might:
    // 1. Add token to blacklist
    // 2. Clear session data
    // 3. Invalidate refresh tokens

    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    logger.error('Logout error:', error);
    throw new AppError('Logout failed', 500, true, 'authentication', 'LOGOUT_ERROR');
  }
};

/**
 * Refresh token function (simplified for demo)
 */
const refreshToken = (req) => {
  try {
    if (!req.user) {
      throw new AppError('No user found for token refresh', 401, true, 'authentication', 'NO_USER');
    }

    const newToken = generateToken(req.user.id);

    logger.info('Token refreshed:', {
      userId: req.user.id,
      ip: req.ip
    });

    return {
      success: true,
      token: newToken,
      user: req.user,
      expiresIn: JWT_EXPIRES_IN
    };
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw new AppError('Token refresh failed', 500, true, 'authentication', 'REFRESH_ERROR');
  }
};

/**
 * Middleware to inject user context even for public endpoints
 */
const injectUserContext = async (req, res, next) => {
  try {
    // Try to authenticate but don't fail if it doesn't work
    await optionalAuth(req, res, next);
  } catch (error) {
    // If authentication fails, continue without user context
    req.user = null;
    req.token = null;
    next();
  }
};

/**
 * Development/demo authentication helper
 */
const enableDemoMode = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' || req.query.demo === 'true') {
    req.user = DEMO_USER;
    req.token = 'demo-token';
    logger.info('Demo mode enabled for request:', {
      url: req.originalUrl,
      ip: req.ip
    });
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  login,
  logout,
  refreshToken,
  injectUserContext,
  enableDemoMode,
  generateToken,
  verifyToken,
  DEMO_USER
};