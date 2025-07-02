/**
 * Property Controller
 * Handles all API endpoints for property management
 */

const propertyDataAccess = require('../services/propertyDataAccess');
const logger = require('../config/logger');

class PropertyController {
    /**
     * Create a new property
     * POST /api/properties
     */
    async createProperty(req, res) {
        try {
            const startTime = Date.now();
            logger.info('Property creation request received:', {
                userId: req.user?.id || 'demo',
                body: { ...req.body, settings: req.body.settings ? 'present' : 'none' }
            });

            // Extract user ID (from auth middleware or use demo)
            const userId = req.user?.id || propertyDataAccess.demoUserId;

            // Validate required fields
            if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Property name is required and must be a non-empty string',
                    error: {
                        type: 'validation',
                        field: 'name',
                        code: 'PROPERTY_NAME_REQUIRED'
                    }
                });
            }

            // Create property using data access layer
            const result = await propertyDataAccess.createProperty(req.body, userId);

            // Handle database/service errors
            if (!result.success) {
                const statusCode = result.error?.type === 'validation' ? 400 : 500;
                logger.warn('Property creation failed:', {
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
                        code: 'PROPERTY_CREATION_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Property created successfully:', {
                userId,
                propertyId: result.data.id,
                propertyName: result.data.name,
                duration: Date.now() - startTime
            });

            res.status(201).json({
                success: true,
                message: 'Property created successfully',
                data: result.data
            });

        } catch (error) {
            logger.error('Property creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during property creation',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get user properties with filtering and pagination
     * GET /api/properties
     */
    async getProperties(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || propertyDataAccess.demoUserId;

            logger.info('Properties retrieval request:', {
                userId,
                query: req.query
            });

            // Build filters from query parameters
            const filters = {};
            
            if (req.query.property_type) {
                filters.property_type = req.query.property_type;
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

            // Get properties using data access layer
            const result = await propertyDataAccess.getProperties(userId, filters);

            if (!result.success) {
                const statusCode = result.error?.type === 'validation' ? 400 : 500;
                logger.warn('Properties retrieval failed:', {
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
                        code: 'PROPERTIES_RETRIEVAL_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Properties retrieved successfully:', {
                userId,
                count: result.data.length,
                totalCount: result.count,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data,
                meta: {
                    count: result.count,
                    filters: filters,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Properties retrieval error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during properties retrieval',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get specific property by ID
     * GET /api/properties/:id
     */
    async getPropertyById(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || propertyDataAccess.demoUserId;
            const propertyId = req.params.id;

            logger.info('Property by ID request:', {
                userId,
                propertyId
            });

            // Validate property ID format (basic UUID check)
            if (!propertyId || typeof propertyId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Property ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'id',
                        code: 'INVALID_PROPERTY_ID'
                    }
                });
            }

            // Get property using data access layer
            const result = await propertyDataAccess.getPropertyById(propertyId, userId);

            if (!result.success) {
                const statusCode = result.message.includes('not found') ? 404 : 500;
                logger.warn('Property retrieval by ID failed:', {
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
                        type: result.error?.type || 'not_found',
                        code: statusCode === 404 ? 'PROPERTY_NOT_FOUND' : 'PROPERTY_RETRIEVAL_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Property retrieved successfully by ID:', {
                userId,
                propertyId: result.data.id,
                propertyName: result.data.name,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });

        } catch (error) {
            logger.error('Property retrieval by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during property retrieval',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Update property information
     * PUT /api/properties/:id
     */
    async updateProperty(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || propertyDataAccess.demoUserId;
            const propertyId = req.params.id;

            logger.info('Property update request:', {
                userId,
                propertyId,
                body: { ...req.body, settings: req.body.settings ? 'present' : 'none' }
            });

            // Validate property ID
            if (!propertyId || typeof propertyId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Property ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'id',
                        code: 'INVALID_PROPERTY_ID'
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

            // Update property using data access layer
            const result = await propertyDataAccess.updateProperty(propertyId, req.body, userId);

            if (!result.success) {
                let statusCode = 500;
                if (result.message.includes('not found') || result.message.includes('access denied')) {
                    statusCode = 404;
                } else if (result.error?.type === 'validation') {
                    statusCode = 400;
                }

                logger.warn('Property update failed:', {
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
                        code: statusCode === 404 ? 'PROPERTY_NOT_FOUND' : 'PROPERTY_UPDATE_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Property updated successfully:', {
                userId,
                propertyId: result.data.id,
                propertyName: result.data.name,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });

        } catch (error) {
            logger.error('Property update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during property update',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Delete property (with validation)
     * DELETE /api/properties/:id
     */
    async deleteProperty(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || propertyDataAccess.demoUserId;
            const propertyId = req.params.id;

            logger.info('Property deletion request:', {
                userId,
                propertyId
            });

            // Validate property ID
            if (!propertyId || typeof propertyId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Property ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'id',
                        code: 'INVALID_PROPERTY_ID'
                    }
                });
            }

            // Delete property using data access layer
            const result = await propertyDataAccess.deleteProperty(propertyId, userId);

            if (!result.success) {
                let statusCode = 500;
                if (result.message.includes('not found') || result.message.includes('access denied')) {
                    statusCode = 404;
                } else if (result.error?.type === 'constraint') {
                    statusCode = 409; // Conflict - cannot delete due to dependencies
                }

                logger.warn('Property deletion failed:', {
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
                        code: statusCode === 404 ? 'PROPERTY_NOT_FOUND' : 
                              statusCode === 409 ? 'PROPERTY_HAS_DEPENDENCIES' : 'PROPERTY_DELETION_FAILED'
                    }
                });
            }

            // Success response
            logger.info('Property deleted successfully:', {
                userId,
                propertyId,
                propertyName: result.data.propertyName,
                relatedItems: result.data.relatedItemsDeleted,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });

        } catch (error) {
            logger.error('Property deletion error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during property deletion',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get property statistics
     * GET /api/properties/:id/stats
     */
    async getPropertyStats(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || propertyDataAccess.demoUserId;
            const propertyId = req.params.id;

            logger.info('Property statistics request:', {
                userId,
                propertyId
            });

            // Validate property ID
            if (!propertyId || typeof propertyId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Property ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'id',
                        code: 'INVALID_PROPERTY_ID'
                    }
                });
            }

            // Get property statistics using data access layer
            const result = await propertyDataAccess.getPropertyStats(propertyId, userId);

            if (!result.success) {
                const statusCode = result.message.includes('not found') ? 404 : 500;
                logger.warn('Property statistics retrieval failed:', {
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
            logger.info('Property statistics retrieved successfully:', {
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
                    propertyId: propertyId
                }
            });

        } catch (error) {
            logger.error('Property statistics error:', error);
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
     * Health check endpoint for property controller
     * GET /api/properties/health
     */
    async healthCheck(req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Property controller is healthy',
                timestamp: new Date().toISOString(),
                service: 'PropertyController'
            });
        } catch (error) {
            logger.error('Property controller health check error:', error);
            res.status(500).json({
                success: false,
                message: 'Property controller health check failed',
                error: {
                    type: 'server_error',
                    code: 'HEALTH_CHECK_FAILED'
                }
            });
        }
    }
}

module.exports = new PropertyController();