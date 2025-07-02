/**
 * Item Controller
 * Handles all API endpoints for item management
 */

const itemDataAccess = require('../services/itemDataAccess');
const propertyDataAccess = require('../services/propertyDataAccess');
const logger = require('../config/logger');

class ItemController {
    /**
     * Create a new item
     * POST /api/items
     */
    async createItem(req, res) {
        try {
            const startTime = Date.now();
            logger.info('Item creation request received:', {
                userId: req.user?.id || 'demo',
                body: { ...req.body, metadata: req.body.metadata ? 'present' : 'none' }
            });

            // Extract user ID (from auth middleware or use demo)
            const userId = req.user?.id || itemDataAccess.demoUserId;

            // Validate required fields
            if (!req.body.property_id || typeof req.body.property_id !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Property ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'property_id',
                        code: 'PROPERTY_ID_REQUIRED'
                    }
                });
            }

            if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Item name is required and must be a non-empty string',
                    error: {
                        type: 'validation',
                        field: 'name',
                        code: 'ITEM_NAME_REQUIRED'
                    }
                });
            }

            // Create item using data access layer
            const result = await itemDataAccess.createItem(req.body, userId);

            // Handle database/service errors
            if (!result.success) {
                let statusCode = 500;
                if (result.error?.type === 'validation') {
                    statusCode = 400;
                } else if (result.error?.type === 'authorization') {
                    statusCode = 404; // Property not found or access denied
                }

                logger.warn('Item creation failed:', {
                    userId,
                    propertyId: req.body.property_id,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: statusCode === 404 ? 'PROPERTY_NOT_FOUND' : 'ITEM_CREATION_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Item created successfully:', {
                userId,
                itemId: result.data.id,
                itemName: result.data.name,
                propertyId: result.data.property_id,
                duration: Date.now() - startTime
            });

            res.status(201).json({
                success: true,
                message: 'Item created successfully',
                data: result.data
            });

        } catch (error) {
            logger.error('Item creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during item creation',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get items with filtering and pagination
     * GET /api/items
     */
    async getItems(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || itemDataAccess.demoUserId;

            logger.info('Items retrieval request:', {
                userId,
                query: req.query
            });

            // Build filters from query parameters
            const filters = {};
            
            if (req.query.media_type) {
                filters.media_type = req.query.media_type;
            }
            
            if (req.query.location) {
                filters.location = req.query.location;
            }
            
            if (req.query.sortBy) {
                filters.sortBy = req.query.sortBy;
            }
            
            if (req.query.sortOrder) {
                filters.sortOrder = req.query.sortOrder;
            }
            
            if (req.query.limit) {
                const limit = parseInt(req.query.limit);
                if (isNaN(limit) || limit < 1 || limit > 100) {
                    return res.status(400).json({
                        success: false,
                        message: 'Limit must be a number between 1 and 100',
                        error: {
                            type: 'validation',
                            field: 'limit',
                            code: 'INVALID_LIMIT'
                        }
                    });
                }
                filters.limit = limit;
            }

            // Get all items for user across all properties
            const result = await itemDataAccess.getAllItemsForUser(userId, filters);

            if (!result.success) {
                const statusCode = result.error?.type === 'validation' ? 400 : 500;
                logger.warn('Items retrieval failed:', {
                    userId,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: 'ITEMS_RETRIEVAL_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Items retrieved successfully:', {
                userId,
                count: result.data.length,
                totalCount: result.count,
                properties: result.properties?.length || 0,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data,
                meta: {
                    count: result.count,
                    properties: result.properties?.length || 0,
                    filters: filters,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Items retrieval error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during items retrieval',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get items for a specific property
     * GET /api/properties/:propertyId/items
     */
    async getItemsForProperty(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || itemDataAccess.demoUserId;
            const propertyId = req.params.propertyId;

            logger.info('Property items retrieval request:', {
                userId,
                propertyId,
                query: req.query
            });

            // Validate property ID
            if (!propertyId || typeof propertyId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Property ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'propertyId',
                        code: 'INVALID_PROPERTY_ID'
                    }
                });
            }

            // Build filters from query parameters
            const filters = {};
            
            if (req.query.media_type) {
                filters.media_type = req.query.media_type;
            }
            
            if (req.query.location) {
                filters.location = req.query.location;
            }
            
            if (req.query.sortBy) {
                filters.sortBy = req.query.sortBy;
            }
            
            if (req.query.sortOrder) {
                filters.sortOrder = req.query.sortOrder;
            }
            
            if (req.query.limit) {
                const limit = parseInt(req.query.limit);
                if (isNaN(limit) || limit < 1 || limit > 100) {
                    return res.status(400).json({
                        success: false,
                        message: 'Limit must be a number between 1 and 100',
                        error: {
                            type: 'validation',
                            field: 'limit',
                            code: 'INVALID_LIMIT'
                        }
                    });
                }
                filters.limit = limit;
            }

            // Get items for specific property
            const result = await itemDataAccess.getItems(propertyId, userId, filters);

            if (!result.success) {
                const statusCode = result.message.includes('not found') || result.message.includes('access denied') ? 404 : 500;
                logger.warn('Property items retrieval failed:', {
                    userId,
                    propertyId,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: statusCode === 404 ? 'PROPERTY_NOT_FOUND' : 'ITEMS_RETRIEVAL_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Property items retrieved successfully:', {
                userId,
                propertyId,
                count: result.data.length,
                propertyName: result.property?.name,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data,
                meta: {
                    count: result.count,
                    property: result.property,
                    filters: filters,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Property items retrieval error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during property items retrieval',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get specific item by ID
     * GET /api/items/:id
     */
    async getItemById(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || itemDataAccess.demoUserId;
            const itemId = req.params.id;

            logger.info('Item by ID request:', {
                userId,
                itemId
            });

            // Validate item ID format
            if (!itemId || typeof itemId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Item ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'id',
                        code: 'INVALID_ITEM_ID'
                    }
                });
            }

            // Get item using data access layer
            const result = await itemDataAccess.getItemById(itemId, userId);

            if (!result.success) {
                const statusCode = result.message.includes('not found') || result.message.includes('access denied') ? 404 : 500;
                logger.warn('Item retrieval by ID failed:', {
                    userId,
                    itemId,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'not_found',
                        code: statusCode === 404 ? 'ITEM_NOT_FOUND' : 'ITEM_RETRIEVAL_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Item retrieved successfully by ID:', {
                userId,
                itemId: result.data.id,
                itemName: result.data.name,
                propertyId: result.data.property_id,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data,
                meta: {
                    property: result.property
                }
            });

        } catch (error) {
            logger.error('Item retrieval by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during item retrieval',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Update item information
     * PUT /api/items/:id
     */
    async updateItem(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || itemDataAccess.demoUserId;
            const itemId = req.params.id;

            logger.info('Item update request:', {
                userId,
                itemId,
                body: { ...req.body, metadata: req.body.metadata ? 'present' : 'none' }
            });

            // Validate item ID
            if (!itemId || typeof itemId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Item ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'id',
                        code: 'INVALID_ITEM_ID'
                    }
                });
            }

            // Validate that there's something to update
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Request body cannot be empty',
                    error: {
                        type: 'validation',
                        field: 'body',
                        code: 'EMPTY_UPDATE_DATA'
                    }
                });
            }

            // Update item using data access layer
            const result = await itemDataAccess.updateItem(itemId, req.body, userId);

            if (!result.success) {
                let statusCode = 500;
                if (result.message.includes('not found') || result.message.includes('access denied')) {
                    statusCode = 404;
                } else if (result.error?.type === 'validation') {
                    statusCode = 400;
                }

                logger.warn('Item update failed:', {
                    userId,
                    itemId,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: statusCode === 404 ? 'ITEM_NOT_FOUND' : 'ITEM_UPDATE_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Item updated successfully:', {
                userId,
                itemId: result.data.id,
                itemName: result.data.name,
                propertyId: result.data.property_id,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });

        } catch (error) {
            logger.error('Item update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during item update',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Delete item
     * DELETE /api/items/:id
     */
    async deleteItem(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || itemDataAccess.demoUserId;
            const itemId = req.params.id;

            logger.info('Item deletion request:', {
                userId,
                itemId
            });

            // Validate item ID
            if (!itemId || typeof itemId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Item ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'id',
                        code: 'INVALID_ITEM_ID'
                    }
                });
            }

            // Delete item using data access layer
            const result = await itemDataAccess.deleteItem(itemId, userId);

            if (!result.success) {
                const statusCode = result.message.includes('not found') || result.message.includes('access denied') ? 404 : 500;
                logger.warn('Item deletion failed:', {
                    userId,
                    itemId,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: statusCode === 404 ? 'ITEM_NOT_FOUND' : 'ITEM_DELETION_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Item deleted successfully:', {
                userId,
                itemId,
                itemName: result.data.itemName,
                relatedQRCodes: result.data.relatedQRCodesDeleted,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });

        } catch (error) {
            logger.error('Item deletion error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during item deletion',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get item statistics
     * GET /api/items/stats
     */
    async getItemStats(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || itemDataAccess.demoUserId;
            const propertyId = req.query.propertyId; // Optional property filter

            logger.info('Item statistics request:', {
                userId,
                propertyId
            });

            // Get item statistics using data access layer
            const result = await itemDataAccess.getItemStats(propertyId, userId);

            if (!result.success) {
                const statusCode = result.message.includes('not found') ? 404 : 500;
                logger.warn('Item statistics retrieval failed:', {
                    userId,
                    propertyId,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: statusCode === 404 ? 'PROPERTY_NOT_FOUND' : 'STATS_RETRIEVAL_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Item statistics retrieved successfully:', {
                userId,
                propertyId,
                totalItems: result.data.totalItems,
                totalQRCodes: result.data.totalQRCodes,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data,
                meta: {
                    generatedAt: new Date().toISOString(),
                    scope: propertyId ? 'property' : 'user',
                    propertyId: propertyId || null
                }
            });

        } catch (error) {
            logger.error('Item statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during statistics retrieval',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Health check endpoint for item controller
     * GET /api/items/health
     */
    async healthCheck(req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Item controller is healthy',
                timestamp: new Date().toISOString(),
                service: 'ItemController'
            });
        } catch (error) {
            logger.error('Item controller health check error:', error);
            res.status(500).json({
                success: false,
                message: 'Item controller health check failed',
                error: {
                    type: 'server_error',
                    code: 'HEALTH_CHECK_FAILED'
                }
            });
        }
    }
}

module.exports = new ItemController();