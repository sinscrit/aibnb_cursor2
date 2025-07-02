/**
 * QR Code Generation Service
 * Handles QR code image generation, storage, and management
 */

const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');
const qrCodeDataAccess = require('./qrCodeDataAccess');

class QRService {
    constructor() {
        this.outputDir = process.env.QR_OUTPUT_DIR || path.join(__dirname, '../public/qr-codes');
        this.baseUrl = process.env.QR_BASE_URL || 'http://localhost:3001';
        this.defaultOptions = {
            type: 'png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 256,
            errorCorrectionLevel: 'M'
        };
    }

    /**
     * Initialize QR service - create directories if needed
     */
    async initialize() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            logger.info('QR Service initialized:', {
                outputDir: this.outputDir,
                baseUrl: this.baseUrl
            });
            return true;
        } catch (error) {
            logger.error('QR Service initialization failed:', error);
            return false;
        }
    }

    /**
     * Generate unique QR ID with improved format
     * @param {string} itemId - Item ID for context
     * @returns {string} Unique QR code identifier
     */
    generateUniqueId(itemId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const itemPrefix = itemId.substring(0, 8).toUpperCase();
        return `QR-${itemPrefix}-${timestamp}-${random}`;
    }

    /**
     * Generate QR code URL for scanning
     * @param {string} qrId - QR code identifier
     * @returns {string} Scannable URL
     */
    generateQRUrl(qrId) {
        return `${this.baseUrl}/api/qr-codes/${qrId}`;
    }

    /**
     * Create QR code image file
     * @param {string} qrId - QR code identifier  
     * @param {Object} options - QR generation options
     * @returns {Promise<Object>} QR code generation result
     */
    async createQRCode(qrId, options = {}) {
        try {
            const startTime = Date.now();
            logger.info('Creating QR code image:', { qrId });

            // Merge options with defaults
            const qrOptions = { ...this.defaultOptions, ...options };
            
            // Generate URL that will be encoded in QR code
            const qrUrl = this.generateQRUrl(qrId);
            
            // Generate filename
            const filename = `${qrId}.${qrOptions.type}`;
            const filePath = path.join(this.outputDir, filename);
            
            // Generate QR code image
            await QRCode.toFile(filePath, qrUrl, qrOptions);
            
            // Generate data URL for immediate display
            const dataUrl = await QRCode.toDataURL(qrUrl, qrOptions);
            
            // Get file stats
            const stats = await fs.stat(filePath);
            
            const result = {
                success: true,
                qrId,
                filename,
                filePath,
                url: qrUrl,
                downloadUrl: `/api/qr-codes/${qrId}/download`,
                dataUrl,
                fileSize: stats.size,
                options: qrOptions,
                generatedAt: new Date().toISOString(),
                generationTime: Date.now() - startTime
            };

            logger.info('QR code image created successfully:', {
                qrId,
                filename,
                fileSize: stats.size,
                generationTime: result.generationTime
            });

            return result;
        } catch (error) {
            logger.error('QR code image creation failed:', {
                qrId,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: {
                    type: 'generation_error',
                    message: error.message,
                    code: 'QR_GENERATION_FAILED'
                }
            };
        }
    }

    /**
     * Generate QR code for an item (complete workflow)
     * @param {string} itemId - Item ID
     * @param {string} userId - User ID
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Complete QR code creation result
     */
    async generateQRCodeForItem(itemId, userId, options = {}) {
        try {
            const startTime = Date.now();
            logger.info('Generating QR code for item:', { itemId, userId });

            // Check if QR code already exists for this item (unless allowing multiple)
            if (!options.allowMultiple) {
                const existingQRs = await qrCodeDataAccess.getQRCodesForItem(itemId, userId);
                if (existingQRs.success && existingQRs.data.length > 0) {
                    const activeQR = existingQRs.data.find(qr => qr.status === 'active');
                    if (activeQR) {
                        return {
                            success: false,
                            message: 'QR code already exists for this item',
                            existingQRCode: activeQR,
                            error: {
                                type: 'constraint',
                                code: 'QR_CODE_EXISTS'
                            }
                        };
                    }
                }
            }

            // Generate unique QR ID
            let qrId = options.customQRId || this.generateUniqueId(itemId);
            
            // Ensure QR ID is unique in database
            let attempts = 0;
            while (attempts < 5) {
                const existing = await qrCodeDataAccess.getQRCodeByQRId(qrId);
                if (!existing.success || !existing.data) {
                    break; // QR ID is unique
                }
                qrId = this.generateUniqueId(itemId);
                attempts++;
            }

            if (attempts >= 5) {
                return {
                    success: false,
                    message: 'Failed to generate unique QR ID after multiple attempts',
                    error: {
                        type: 'generation_error',
                        code: 'UNIQUE_ID_GENERATION_FAILED'
                    }
                };
            }

            // Create QR code record in database
            const dbResult = await qrCodeDataAccess.createQRCode(itemId, userId, {
                customQRId: qrId,
                status: options.status || 'active'
            });

            if (!dbResult.success) {
                return {
                    success: false,
                    message: 'Failed to create QR code database record',
                    error: dbResult.error
                };
            }

            // Generate QR code image
            const imageResult = await this.createQRCode(qrId, options);

            if (!imageResult.success) {
                // Clean up database record if image generation failed
                await qrCodeDataAccess.deleteQRCode(dbResult.data.id, userId, true);
                return {
                    success: false,
                    message: 'Failed to generate QR code image',
                    error: imageResult.error
                };
            }

            // Update database record with image information
            const updateResult = await qrCodeDataAccess.updateQRCode(dbResult.data.id, {
                qr_image_url: imageResult.downloadUrl,
                qr_data_url: imageResult.dataUrl,
                qr_file_path: imageResult.filename
            }, userId);

            const result = {
                success: true,
                message: 'QR code generated successfully',
                data: {
                    ...dbResult.data,
                    qr_image_url: imageResult.downloadUrl,
                    qr_data_url: imageResult.dataUrl,
                    qr_file_path: imageResult.filename
                },
                imageInfo: {
                    filename: imageResult.filename,
                    fileSize: imageResult.fileSize,
                    downloadUrl: imageResult.downloadUrl,
                    dataUrl: imageResult.dataUrl
                },
                generationTime: Date.now() - startTime
            };

            logger.info('QR code generation completed:', {
                itemId,
                qrId: result.data.qr_id,
                filename: imageResult.filename,
                totalTime: result.generationTime
            });

            return result;
        } catch (error) {
            logger.error('QR code generation for item failed:', {
                itemId,
                userId,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                message: 'QR code generation failed',
                error: {
                    type: 'generation_error',
                    message: error.message,
                    code: 'QR_GENERATION_FAILED'
                }
            };
        }
    }

    /**
     * Regenerate QR code image for existing QR code
     * @param {string} qrId - Existing QR code ID
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Regeneration result
     */
    async regenerateQRCode(qrId, options = {}) {
        try {
            logger.info('Regenerating QR code image:', { qrId });

            // Check if QR code exists
            const existing = await qrCodeDataAccess.getQRCodeByQRId(qrId);
            if (!existing.success || !existing.data) {
                return {
                    success: false,
                    message: 'QR code not found',
                    error: {
                        type: 'not_found',
                        code: 'QR_CODE_NOT_FOUND'
                    }
                };
            }

            // Delete old image file if it exists
            const oldFilename = existing.data.qr_file_path;
            if (oldFilename) {
                try {
                    const oldFilePath = path.join(this.outputDir, oldFilename);
                    await fs.unlink(oldFilePath);
                    logger.info('Old QR code image deleted:', { oldFilename });
                } catch (error) {
                    logger.warn('Failed to delete old QR code image:', { oldFilename, error: error.message });
                }
            }

            // Generate new image
            const imageResult = await this.createQRCode(qrId, options);
            
            if (!imageResult.success) {
                return imageResult;
            }

            return {
                success: true,
                message: 'QR code regenerated successfully',
                data: {
                    ...existing.data,
                    qr_image_url: imageResult.downloadUrl,
                    qr_data_url: imageResult.dataUrl,
                    qr_file_path: imageResult.filename,
                    regenerated_at: new Date().toISOString()
                },
                imageInfo: {
                    filename: imageResult.filename,
                    fileSize: imageResult.fileSize,
                    downloadUrl: imageResult.downloadUrl,
                    dataUrl: imageResult.dataUrl
                }
            };
        } catch (error) {
            logger.error('QR code regeneration failed:', {
                qrId,
                error: error.message
            });

            return {
                success: false,
                message: 'QR code regeneration failed',
                error: {
                    type: 'generation_error',
                    message: error.message,
                    code: 'QR_REGENERATION_FAILED'
                }
            };
        }
    }

    /**
     * Get QR code file for download
     * @param {string} qrId - QR code identifier
     * @returns {Promise<Object>} File information and path
     */
    async getQRCodeFile(qrId) {
        try {
            // Get QR code info from database
            const qrResult = await qrCodeDataAccess.getQRCodeByQRId(qrId);
            if (!qrResult.success || !qrResult.data) {
                return {
                    success: false,
                    message: 'QR code not found',
                    error: {
                        type: 'not_found',
                        code: 'QR_CODE_NOT_FOUND'
                    }
                };
            }

            const filename = qrResult.data.qr_file_path || `${qrId}.png`;
            const filePath = path.join(this.outputDir, filename);

            // Check if file exists
            try {
                const stats = await fs.stat(filePath);
                return {
                    success: true,
                    filePath,
                    filename,
                    fileSize: stats.size,
                    contentType: 'image/png',
                    qrData: qrResult.data
                };
            } catch (error) {
                // File doesn't exist, try to regenerate
                logger.warn('QR code file not found, attempting regeneration:', { qrId, filePath });
                
                const regenResult = await this.regenerateQRCode(qrId);
                if (regenResult.success) {
                    return {
                        success: true,
                        filePath: path.join(this.outputDir, regenResult.imageInfo.filename),
                        filename: regenResult.imageInfo.filename,
                        fileSize: regenResult.imageInfo.fileSize,
                        contentType: 'image/png',
                        qrData: regenResult.data,
                        regenerated: true
                    };
                }

                return {
                    success: false,
                    message: 'QR code file not found and regeneration failed',
                    error: {
                        type: 'file_not_found',
                        code: 'QR_FILE_NOT_FOUND'
                    }
                };
            }
        } catch (error) {
            logger.error('Get QR code file failed:', {
                qrId,
                error: error.message
            });

            return {
                success: false,
                message: 'Failed to get QR code file',
                error: {
                    type: 'file_error',
                    message: error.message,
                    code: 'QR_FILE_ERROR'
                }
            };
        }
    }

    /**
     * Delete QR code and associated files
     * @param {string} qrId - QR code identifier
     * @param {string} userId - User ID
     * @param {boolean} hardDelete - Whether to permanently delete
     * @returns {Promise<Object>} Deletion result
     */
    async deleteQRCode(qrId, userId, hardDelete = false) {
        try {
            logger.info('Deleting QR code:', { qrId, hardDelete });

            // Get QR code info for file cleanup
            const qrResult = await qrCodeDataAccess.getQRCodeByQRId(qrId);
            
            // Delete from database
            const dbResult = await qrCodeDataAccess.deleteQRCode(qrId, userId, hardDelete);
            
            if (!dbResult.success) {
                return dbResult;
            }

            // Delete image file if hard delete or if we have file info
            if (hardDelete && qrResult.success && qrResult.data && qrResult.data.qr_file_path) {
                try {
                    const filePath = path.join(this.outputDir, qrResult.data.qr_file_path);
                    await fs.unlink(filePath);
                    logger.info('QR code image file deleted:', { filename: qrResult.data.qr_file_path });
                } catch (error) {
                    logger.warn('Failed to delete QR code image file:', {
                        filename: qrResult.data.qr_file_path,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                message: hardDelete ? 'QR code permanently deleted' : 'QR code deactivated',
                data: {
                    ...dbResult.data,
                    fileDeleted: hardDelete
                }
            };
        } catch (error) {
            logger.error('QR code deletion failed:', {
                qrId,
                error: error.message
            });

            return {
                success: false,
                message: 'QR code deletion failed',
                error: {
                    type: 'deletion_error',
                    message: error.message,
                    code: 'QR_DELETION_FAILED'
                }
            };
        }
    }

    /**
     * Get QR service statistics
     * @returns {Promise<Object>} Service statistics
     */
    async getStatistics() {
        try {
            // Get database statistics
            const analyticsResult = await qrCodeDataAccess.getQRCodeAnalytics();
            
            // Get file system statistics
            let fileStats = {
                totalFiles: 0,
                totalSize: 0,
                oldestFile: null,
                newestFile: null
            };

            try {
                const files = await fs.readdir(this.outputDir);
                const qrFiles = files.filter(file => file.endsWith('.png') && file.startsWith('QR-'));
                
                fileStats.totalFiles = qrFiles.length;
                
                for (const file of qrFiles) {
                    const filePath = path.join(this.outputDir, file);
                    const stats = await fs.stat(filePath);
                    fileStats.totalSize += stats.size;
                    
                    if (!fileStats.oldestFile || stats.birthtime < fileStats.oldestFile.birthtime) {
                        fileStats.oldestFile = { name: file, birthtime: stats.birthtime };
                    }
                    
                    if (!fileStats.newestFile || stats.birthtime > fileStats.newestFile.birthtime) {
                        fileStats.newestFile = { name: file, birthtime: stats.birthtime };
                    }
                }
            } catch (error) {
                logger.warn('Failed to get file statistics:', error.message);
            }

            return {
                success: true,
                data: {
                    database: analyticsResult.success ? analyticsResult.data : null,
                    files: fileStats,
                    service: {
                        outputDir: this.outputDir,
                        baseUrl: this.baseUrl,
                        defaultOptions: this.defaultOptions
                    },
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('QR service statistics failed:', error);
            
            return {
                success: false,
                message: 'Failed to get QR service statistics',
                error: {
                    type: 'statistics_error',
                    message: error.message,
                    code: 'QR_STATS_FAILED'
                }
            };
        }
    }

    /**
     * Health check for QR service
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        try {
            const checks = {
                directory: false,
                database: false,
                generation: false
            };

            // Check output directory
            try {
                await fs.access(this.outputDir);
                checks.directory = true;
            } catch (error) {
                logger.warn('QR output directory not accessible:', error.message);
            }

            // Check database connection
            const analyticsResult = await qrCodeDataAccess.getQRCodeAnalytics();
            checks.database = analyticsResult.success;

            // Test QR generation
            try {
                const testUrl = 'https://example.com/test';
                const testDataUrl = await QRCode.toDataURL(testUrl);
                checks.generation = testDataUrl.startsWith('data:image/png;base64,');
            } catch (error) {
                logger.warn('QR generation test failed:', error.message);
            }

            const healthy = Object.values(checks).every(check => check);

            return {
                success: true,
                healthy,
                checks,
                timestamp: new Date().toISOString(),
                service: 'QRService'
            };
        } catch (error) {
            logger.error('QR service health check failed:', error);
            
            return {
                success: false,
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                service: 'QRService'
            };
        }
    }
}

// Initialize and export service instance
const qrService = new QRService();

// Initialize on startup
qrService.initialize().catch(error => {
    logger.error('QR Service startup initialization failed:', error);
});

module.exports = qrService;