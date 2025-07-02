/**
 * Item Routes
 * Defines all API routes for item management
 */

const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Health check - should be first to avoid conflicts
router.get('/health', itemController.healthCheck);

// Item statistics - should be before :id routes to avoid conflicts
router.get('/stats', itemController.getItemStats);

// Item CRUD routes
router.post('/', itemController.createItem);
router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);
router.put('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

module.exports = router;