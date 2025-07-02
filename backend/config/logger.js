/**
 * Logging Configuration
 * Centralized logging setup for the application
 */

const fs = require('fs');
const path = require('path');

/**
 * Simple logger implementation
 * Can be extended with more sophisticated logging libraries like Winston
 */
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.enableConsole = process.env.NODE_ENV !== 'test';
    this.enableFile = process.env.LOG_TO_FILE === 'true';
    this.logDir = path.join(__dirname, '../logs');
    
    // Create logs directory if it doesn't exist
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get current timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
  }

  /**
   * Write to console
   */
  writeToConsole(level, formattedMessage) {
    if (!this.enableConsole) return;

    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  /**
   * Write to file
   */
  writeToFile(level, formattedMessage) {
    if (!this.enableFile) return;

    const logFile = path.join(this.logDir, `${level}.log`);
    const allLogsFile = path.join(this.logDir, 'combined.log');

    try {
      // Write to level-specific file
      fs.appendFileSync(logFile, formattedMessage + '\n');
      
      // Write to combined log file
      fs.appendFileSync(allLogsFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Log message
   */
  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    this.writeToConsole(level, formattedMessage);
    this.writeToFile(level, formattedMessage);
  }

  /**
   * Log error level messages
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log warning level messages
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log info level messages
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log debug level messages
   */
  debug(message, meta = {}) {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }

  /**
   * Log HTTP requests
   */
  http(req, res, responseTime) {
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    };

    // Log as info for successful requests, warn for client errors, error for server errors
    if (res.statusCode >= 500) {
      this.error(message, meta);
    } else if (res.statusCode >= 400) {
      this.warn(message, meta);
    } else {
      this.info(message, meta);
    }
  }

  /**
   * Log database operations
   */
  database(operation, table, meta = {}) {
    if (process.env.SQL_DEBUG === 'true') {
      this.debug(`Database ${operation} on ${table}`, meta);
    }
  }

  /**
   * Create request logging middleware
   */
  requestMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - start;
        this.http(req, res, responseTime);
      });
      
      next();
    };
  }
}

// Create and export singleton instance
const logger = new Logger();

module.exports = logger;