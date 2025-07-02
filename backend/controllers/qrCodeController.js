/**
 * QR Code Controller
 * Handles all API endpoints for QR code management and scanning
 */

const qrCodeDataAccess = require('../services/qrCodeDataAccess');
const qrService = require('../services/qrService');
const logger = require('../config/logger');

class QRCodeController {
    /**
     * Generate QR code for an item
     * POST /api/qr-codes
     */
    async createQRCode(req, res) {
        try {
            const startTime = Date.now();
            logger.info('QR code creation request received:', {
                userId: req.user?.id || 'demo',
                body: { ...req.body, options: req.body.options ? 'present' : 'none' }
            });

            // Extract user ID (from auth middleware or use demo)
            const userId = req.user?.id || qrCodeDataAccess.demoUserId;

            // Validate required fields
            if (!req.body.item_id || typeof req.body.item_id !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Item ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'item_id',
                        code: 'ITEM_ID_REQUIRED'
                    }
                });
            }

            // Extract options
            const options = {
                allowMultiple: req.body.allowMultiple || false,
                status: req.body.status || 'active',
                customQRId: req.body.customQRId || null
            };

            // Create QR code with image generation using QR service
            const result = await qrService.generateQRCodeForItem(req.body.item_id, userId, options);

            // Handle errors from QR service
            if (!result.success) {
                let statusCode = 500;
                if (result.error?.type === 'validation') {
                    statusCode = 400;
                } else if (result.error?.type === 'authorization' || result.error?.code === 'ITEM_NOT_FOUND') {
                    statusCode = 404; // Item not found or access denied
                } else if (result.error?.type === 'constraint' || result.error?.code === 'QR_CODE_EXISTS') {
                    statusCode = 409; // Already has QR code
                }

                logger.warn('QR code creation failed:', {
                    userId,
                    itemId: req.body.item_id,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: statusCode === 404 ? 'ITEM_NOT_FOUND' : 
                              statusCode === 409 ? 'QR_CODE_EXISTS' : 'QR_CODE_CREATION_FAILED'
                    }
                });
            }

            // Success response
            logger.info('QR code created successfully:', {
                userId,
                qrCodeId: result.data.id,
                qrId: result.data.qr_id,
                itemId: result.data.item_id,
                duration: Date.now() - startTime
            });

            res.status(201).json({
                success: true,
                message: 'QR code generated successfully',
                data: result.data
            });

        } catch (error) {
            logger.error('QR code creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during QR code creation',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get QR codes with filtering
     * GET /api/qr-codes
     */
    async getQRCodes(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || qrCodeDataAccess.demoUserId;

            logger.info('QR codes retrieval request:', {
                userId,
                query: req.query
            });

            // Build filters from query parameters
            const filters = {};
            
            if (req.query.status) {
                filters.status = req.query.status;
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

            // Check if item_id filter is provided
            let result;
            if (req.query.item_id) {
                // Get QR codes for specific item
                result = await qrCodeDataAccess.getQRCodesForItem(req.query.item_id, userId, filters);
            } else {
                // Get all QR codes for user
                result = await qrCodeDataAccess.getAllQRCodesForUser(userId, filters);
            }

            if (!result.success) {
                const statusCode = result.error?.type === 'validation' ? 400 : 500;
                logger.warn('QR codes retrieval failed:', {
                    userId,
                    itemId: req.query.item_id,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: 'QR_CODES_RETRIEVAL_FAILED'
                    }
                });
            }

            // Success response
            logger.info('QR codes retrieved successfully:', {
                userId,
                count: result.data.length,
                totalCount: result.count,
                scope: req.query.item_id ? 'item' : 'user',
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data,
                meta: {
                    count: result.count,
                    scope: req.query.item_id ? 'item' : 'user',
                    filters: filters,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('QR codes retrieval error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during QR codes retrieval',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get QR code details by QR ID (for scanning/validation) - PUBLIC ENDPOINT
     * GET /api/qr-codes/:qrId
     */
    async getQRCodeByQRId(req, res) {
        try {
            const startTime = Date.now();
            const qrId = req.params.qrId;

            logger.info('QR code lookup by QR ID (public):', {
                qrId,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            // Validate QR ID format
            if (!qrId || typeof qrId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'QR ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'qrId',
                        code: 'INVALID_QR_ID'
                    }
                });
            }

            // Get QR code using data access layer (public access)
            const result = await qrCodeDataAccess.getQRCodeByQRId(qrId);

            if (!result.success) {
                const statusCode = result.message.includes('not found') ? 404 : 500;
                logger.warn('QR code lookup failed:', {
                    qrId,
                    ip: req.ip,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'not_found',
                        code: statusCode === 404 ? 'QR_CODE_NOT_FOUND' : 'QR_CODE_LOOKUP_FAILED'
                    }
                });
            }

            // Success response (include public info only)
            logger.info('QR code lookup successful:', {
                qrId: result.data.qr_id,
                itemId: result.data.item_id,
                itemName: result.data.item?.name,
                status: result.data.status,
                ip: req.ip,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: 'QR code found',
                data: {
                    qr_id: result.data.qr_id,
                    status: result.data.status,
                    scan_count: result.data.scan_count,
                    item: {
                        id: result.data.item.id,
                        name: result.data.item.name,
                        description: result.data.item.description,
                        location: result.data.item.location,
                        media_url: result.data.item.media_url,
                        media_type: result.data.item.media_type
                    },
                    property: {
                        id: result.data.property.id,
                        name: result.data.property.name,
                        property_type: result.data.property.property_type
                    }
                }
            });

        } catch (error) {
            logger.error('QR code lookup error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during QR code lookup',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Record QR code scan - PUBLIC ENDPOINT
     * POST /api/qr-codes/:qrId/scan
     */
    async recordScan(req, res) {
        try {
            const startTime = Date.now();
            const qrId = req.params.qrId;

            logger.info('QR code scan recording (public):', {
                qrId,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                scanData: req.body
            });

            // Validate QR ID format
            if (!qrId || typeof qrId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'QR ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'qrId',
                        code: 'INVALID_QR_ID'
                    }
                });
            }

            // Record scan with optional metadata
            const scanData = {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
                ...req.body
            };

            // Record scan using data access layer
            const result = await qrCodeDataAccess.recordScan(qrId, scanData);

            if (!result.success) {
                const statusCode = result.message.includes('not found') ? 404 : 
                                 result.message.includes('cannot be scanned') ? 409 : 500;
                
                logger.warn('QR code scan recording failed:', {
                    qrId,
                    ip: req.ip,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: statusCode === 404 ? 'QR_CODE_NOT_FOUND' : 
                              statusCode === 409 ? 'QR_CODE_INACTIVE' : 'SCAN_RECORDING_FAILED'
                    }
                });
            }

            // Success response
            logger.info('QR code scan recorded successfully:', {
                qrId: result.data.qr_id,
                scanCount: result.scanInfo.scanCount,
                itemName: result.data.item?.name,
                ip: req.ip,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: 'Scan recorded successfully',
                data: {
                    qr_id: result.data.qr_id,
                    scan_count: result.scanInfo.scanCount,
                    last_scanned: result.scanInfo.lastScanned,
                    item: {
                        id: result.data.item.id,
                        name: result.data.item.name,
                        description: result.data.item.description,
                        location: result.data.item.location
                    }
                }
            });

        } catch (error) {
            logger.error('QR code scan recording error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during scan recording',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Download QR code image
     * GET /api/qr-codes/:qrId/download
     */
    async downloadQRCode(req, res) {
        try {
            const startTime = Date.now();
            const qrId = req.params.qrId;

            logger.info('QR code download request:', {
                qrId,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            // Validate QR ID format
            if (!qrId || typeof qrId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'QR ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'qrId',
                        code: 'INVALID_QR_ID'
                    }
                });
            }

            // Get QR code file using QR service
            const result = await qrService.getQRCodeFile(qrId);

            if (!result.success) {
                const statusCode = result.error?.code === 'QR_CODE_NOT_FOUND' ? 404 : 500;
                
                logger.warn('QR code download failed:', {
                    qrId,
                    ip: req.ip,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: result.error?.code || 'QR_DOWNLOAD_FAILED'
                    }
                });
            }

            // Set appropriate headers for file download
            res.setHeader('Content-Type', result.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
            res.setHeader('Content-Length', result.fileSize);

            // Send file
            res.sendFile(result.filePath, (err) => {
                if (err) {
                    logger.error('QR code file send error:', {
                        qrId,
                        filePath: result.filePath,
                        error: err.message
                    });
                    
                    // Only send error response if headers not yet sent
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: 'Failed to send QR code file',
                            error: {
                                type: 'file_error',
                                code: 'FILE_SEND_FAILED'
                            }
                        });
                    }
                } else {
                    logger.info('QR code download completed:', {
                        qrId,
                        filename: result.filename,
                        fileSize: result.fileSize,
                        regenerated: result.regenerated || false,
                        ip: req.ip,
                        duration: Date.now() - startTime
                    });
                }
            });

        } catch (error) {
            logger.error('QR code download error:', error);
            
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error during QR code download',
                    error: {
                        type: 'server_error',
                        code: 'INTERNAL_ERROR'
                    }
                });
            }
        }
    }

    /**
     * Regenerate QR code image
     * POST /api/qr-codes/:qrId/regenerate
     */
    async regenerateQRCode(req, res) {
        try {
            const startTime = Date.now();
            const qrId = req.params.qrId;
            const userId = req.user?.id || qrCodeDataAccess.demoUserId;

            logger.info('QR code regeneration request:', {
                qrId,
                userId,
                body: req.body
            });

            // Validate QR ID format
            if (!qrId || typeof qrId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'QR ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'qrId',
                        code: 'INVALID_QR_ID'
                    }
                });
            }

            // Regenerate QR code using QR service
            const options = req.body || {};
            const result = await qrService.regenerateQRCode(qrId, options);

            if (!result.success) {
                const statusCode = result.error?.code === 'QR_CODE_NOT_FOUND' ? 404 : 500;
                
                logger.warn('QR code regeneration failed:', {
                    qrId,
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
                        code: result.error?.code || 'QR_REGENERATION_FAILED'
                    }
                });
            }

            // Success response
            logger.info('QR code regenerated successfully:', {
                qrId,
                filename: result.imageInfo.filename,
                fileSize: result.imageInfo.fileSize,
                userId,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    ...result.data,
                    imageInfo: result.imageInfo
                }
            });

        } catch (error) {
            logger.error('QR code regeneration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during QR code regeneration',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Validate QR code (alternative to getQRCodeByQRId)
     * POST /api/qr-codes/:qrId/validate
     */
    async validateQRCode(req, res) {
        try {
            const startTime = Date.now();
            const qrId = req.params.qrId;

            logger.info('QR code validation request:', {
                qrId,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                body: req.body
            });

            // Validate QR ID format
            if (!qrId || typeof qrId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'QR ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'qrId',
                        code: 'INVALID_QR_ID'
                    }
                });
            }

            // Get QR code using data access layer (includes validation)
            const result = await qrCodeDataAccess.getQRCodeByQRId(qrId);

            if (!result.success) {
                const statusCode = result.message.includes('not found') ? 404 : 500;
                logger.warn('QR code validation failed:', {
                    qrId,
                    ip: req.ip,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'not_found',
                        code: statusCode === 404 ? 'QR_CODE_NOT_FOUND' : 'QR_CODE_VALIDATION_FAILED'
                    }
                });
            }

            // Check if QR code is active
            const isValid = result.data.status === 'active';
            const statusMessage = isValid ? 'QR code is valid and active' : 
                                           `QR code is ${result.data.status} and cannot be scanned`;

            // Success response with validation result
            logger.info('QR code validation completed:', {
                qrId: result.data.qr_id,
                isValid,
                status: result.data.status,
                itemName: result.data.item?.name,
                ip: req.ip,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: statusMessage,
                valid: isValid,
                data: {
                    qr_id: result.data.qr_id,
                    status: result.data.status,
                    scan_count: result.data.scan_count,
                    created_at: result.data.created_at,
                    last_scanned: result.data.last_scanned,
                    item: {
                        id: result.data.item.id,
                        name: result.data.item.name,
                        description: result.data.item.description,
                        location: result.data.item.location,
                        media_url: result.data.item.media_url,
                        media_type: result.data.item.media_type
                    },
                    property: {
                        id: result.data.property.id,
                        name: result.data.property.name,
                        property_type: result.data.property.property_type
                    }
                }
            });

        } catch (error) {
            logger.error('QR code validation error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during QR code validation',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Update QR code status
     * PUT /api/qr-codes/:id
     */
    async updateQRCode(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || qrCodeDataAccess.demoUserId;
            const qrCodeId = req.params.id;

            logger.info('QR code update request:', {
                userId,
                qrCodeId,
                body: req.body
            });

            // Validate QR code ID
            if (!qrCodeId || typeof qrCodeId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'QR code ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'id',
                        code: 'INVALID_QR_CODE_ID'
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

            // Update QR code using data access layer
            const result = await qrCodeDataAccess.updateQRCode(qrCodeId, req.body, userId);

            if (!result.success) {
                let statusCode = 500;
                if (result.message.includes('not found') || result.message.includes('access denied')) {
                    statusCode = 404;
                } else if (result.error?.type === 'validation') {
                    statusCode = 400;
                }

                logger.warn('QR code update failed:', {
                    userId,
                    qrCodeId,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: statusCode === 404 ? 'QR_CODE_NOT_FOUND' : 'QR_CODE_UPDATE_FAILED'
                    }
                });
            }

            // Success response
            logger.info('QR code updated successfully:', {
                userId,
                qrCodeId: result.data.id,
                qrId: result.data.qr_id,
                status: result.data.status,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });

        } catch (error) {
            logger.error('QR code update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during QR code update',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Deactivate/delete QR code
     * DELETE /api/qr-codes/:id
     */
    async deleteQRCode(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || qrCodeDataAccess.demoUserId;
            const qrCodeId = req.params.id;
            const hardDelete = req.query.hard === 'true';

            logger.info('QR code deletion request:', {
                userId,
                qrCodeId,
                hardDelete
            });

            // Validate QR code ID
            if (!qrCodeId || typeof qrCodeId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'QR code ID is required and must be a valid string',
                    error: {
                        type: 'validation',
                        field: 'id',
                        code: 'INVALID_QR_CODE_ID'
                    }
                });
            }

            // Delete QR code using data access layer
            const result = await qrCodeDataAccess.deleteQRCode(qrCodeId, userId, hardDelete);

            if (!result.success) {
                const statusCode = result.message.includes('not found') || result.message.includes('access denied') ? 404 : 500;
                logger.warn('QR code deletion failed:', {
                    userId,
                    qrCodeId,
                    hardDelete,
                    error: result.error,
                    message: result.message,
                    duration: Date.now() - startTime
                });

                return res.status(statusCode).json({
                    success: false,
                    message: result.message,
                    error: {
                        type: result.error?.type || 'server_error',
                        code: statusCode === 404 ? 'QR_CODE_NOT_FOUND' : 'QR_CODE_DELETION_FAILED'
                    }
                });
            }

            // Success response
            logger.info('QR code deletion successful:', {
                userId,
                qrCodeId,
                qrId: result.data.qrId,
                hardDelete: result.data.hardDelete,
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });

        } catch (error) {
            logger.error('QR code deletion error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during QR code deletion',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Get QR code analytics
     * GET /api/qr-codes/analytics
     */
    async getQRCodeAnalytics(req, res) {
        try {
            const startTime = Date.now();
            const userId = req.user?.id || qrCodeDataAccess.demoUserId;
            const itemId = req.query.itemId; // Optional item filter

            logger.info('QR code analytics request:', {
                userId,
                itemId
            });

            // Get analytics using data access layer
            const result = await qrCodeDataAccess.getQRCodeAnalytics(itemId, userId);

            if (!result.success) {
                const statusCode = result.message.includes('not found') ? 404 : 500;
                logger.warn('QR code analytics retrieval failed:', {
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
                        code: statusCode === 404 ? 'ITEM_NOT_FOUND' : 'ANALYTICS_RETRIEVAL_FAILED'
                    }
                });
            }

            // Success response
            logger.info('QR code analytics retrieved successfully:', {
                userId,
                itemId,
                totalQRCodes: result.data.totalQRCodes,
                totalScans: result.data.totalScans,
                scope: itemId ? 'item' : 'user',
                duration: Date.now() - startTime
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data,
                meta: {
                    generatedAt: new Date().toISOString(),
                    scope: itemId ? 'item' : 'user',
                    itemId: itemId || null
                }
            });

        } catch (error) {
            logger.error('QR code analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during analytics retrieval',
                error: {
                    type: 'server_error',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    }

    /**
     * Health check endpoint for QR code controller
     * GET /api/qr-codes/health
     */
    async healthCheck(req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'QR code controller is healthy',
                timestamp: new Date().toISOString(),
                service: 'QRCodeController'
            });
        } catch (error) {
            logger.error('QR code controller health check error:', error);
            res.status(500).json({
                success: false,
                message: 'QR code controller health check failed',
                error: {
                    type: 'server_error',
                    code: 'HEALTH_CHECK_FAILED'
                }
            });
        }
    }
}

module.exports = new QRCodeController();