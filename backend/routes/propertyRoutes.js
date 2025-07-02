/**
 * Property Routes
 * Defines all API routes for property management
 */

const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const itemController = require('../controllers/itemController');

// Health check - should be first to avoid conflicts
router.get('/health', propertyController.healthCheck);

// Property CRUD routes
router.post('/', propertyController.createProperty);
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getPropertyById);
router.put('/:id', propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

// Property statistics
router.get('/:id/stats', propertyController.getPropertyStats);

// Nested routes for property items
router.get('/:propertyId/items', itemController.getItemsForProperty);

module.exports = router;