const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import custom middleware
const logger = require('./config/logger');
const { globalErrorHandler, handleUnknownRoute } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware - use both morgan and custom logger
app.use(morgan('combined'));
app.use(logger.requestMiddleware());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API info route
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'Property Management API',
    version: '1.0.0',
    description: 'AI-powered Property Management System Backend',
    endpoints: {
      health: '/health',
      properties: '/api/properties',
      items: '/api/items',
      qrCodes: '/api/qr-codes'
    }
  });
});

// 404 handler for undefined routes
app.use('*', handleUnknownRoute);

// Global error handler
app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🔗 API info available at: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;