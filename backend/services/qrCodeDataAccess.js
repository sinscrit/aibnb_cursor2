/**
 * QR Code Data Access Layer
 * Handles all database operations for QR codes with item relationship validation and scan tracking
 */

const supabaseService = require('./supabaseService');
const itemDataAccess = require('./itemDataAccess');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class QRCodeDataAccess {
    constructor() {
        this.tableName = 'qr_codes';
        this.demoUserId = '00000000-0000-0000-0000-000000000000';
    }

    /**
     * Generate a unique QR code identifier
     * @param {string} itemId - Item ID for prefixing
     * @returns {string} Unique QR code identifier
     */
    generateQRId(itemId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const itemPrefix = itemId.substring(0, 8).toUpperCase();
        return `QR-${itemPrefix}-${timestamp}-${random}`;
    }

    /**
     * Create a new QR code for an item
     * @param {string} itemId - Item ID
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @param {Object} options - QR code options
     * @returns {Promise<Object>} Created QR code result
     */
    async createQRCode(itemId, userId = this.demoUserId, options = {}) {
        try {
            logger.info('Creating new QR code for item:', { itemId, userId, options });

            if (!itemId || typeof itemId !== 'string') {
                throw new Error('Item ID is required and must be a string');
            }

            // Verify item exists and user has access
            const itemCheck = await itemDataAccess.getItemById(itemId, userId);
            if (!itemCheck.success) {
                return {
                    success: false,
                    message: 'Item not found or access denied',
                    error: { type: 'authorization', suggestion: 'Verify item ID and ownership' }
                };
            }

            // Check if item already has an active QR code
            const existingQRCodes = await this.getQRCodesForItem(itemId, userId);
            if (existingQRCodes.success && existingQRCodes.data.length > 0) {
                const activeQRCode = existingQRCodes.data.find(qr => qr.status === 'active');
                if (activeQRCode && !options.allowMultiple) {
                    return {
                        success: false,
                        message: 'Item already has an active QR code',
                        data: activeQRCode,
                        error: { 
                            type: 'constraint', 
                            suggestion: 'Use existing QR code or set allowMultiple option' 
                        }
                    };
                }
            }

            // Generate unique QR code identifier
            const qrId = options.customQRId || this.generateQRId(itemId);

            // Verify QR ID is unique
            const uniqueCheck = await this.validateQRIdUnique(qrId);
            if (!uniqueCheck) {
                throw new Error('Generated QR ID is not unique, please try again');
            }

            // Prepare QR code data for insertion
            const insertData = {
                id: uuidv4(),
                item_id: itemId,
                qr_id: qrId,
                status: options.status || 'active',
                scan_count: 0,
                last_scanned: null
            };

            // Insert QR code into database
            const result = await supabaseService.insert(this.tableName, insertData);

            if (!result.success) {
                throw new Error('Failed to create QR code in database');
            }

            logger.info('QR code created successfully:', { 
                id: result.data[0]?.id, 
                qrId: result.data[0]?.qr_id,
                itemId: result.data[0]?.item_id
            });

            return {
                success: true,
                data: {
                    ...result.data[0],
                    item: itemCheck.data,
                    property: itemCheck.property
                },
                message: 'QR code created successfully'
            };

        } catch (error) {
            logger.error('Error creating QR code:', error);
            return supabaseService.handleError(error, 'QR code creation');
        }
    }

    /**
     * Get QR codes for an item
     * @param {string} itemId - Item ID
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} QR codes result
     */
    async getQRCodesForItem(itemId, userId = this.demoUserId, filters = {}) {
        try {
            logger.info('Fetching QR codes for item:', { itemId, userId, filters });

            if (!itemId) {
                throw new Error('Item ID is required');
            }

            // Verify item exists and user has access
            const itemCheck = await itemDataAccess.getItemById(itemId, userId);
            if (!itemCheck.success) {
                return {
                    success: false,
                    message: 'Item not found or access denied',
                    data: []
                };
            }

            // Build query options
            const queryOptions = {
                where: { item_id: itemId },
                orderBy: {
                    column: filters.sortBy || 'created_at',
                    ascending: filters.sortOrder !== 'desc'
                }
            };

            // Add status filter if specified
            if (filters.status) {
                queryOptions.where.status = filters.status;
            }

            // Add limit if specified
            if (filters.limit) {
                queryOptions.limit = parseInt(filters.limit);
            }

            const result = await supabaseService.select(this.tableName, queryOptions);

            if (!result.success) {
                throw new Error('Failed to fetch QR codes from database');
            }

            logger.info('QR codes fetched successfully:', { 
                count: result.data.length,
                itemId 
            });

            return {
                success: true,
                data: result.data,
                count: result.data.length,
                message: 'QR codes retrieved successfully',
                item: itemCheck.data
            };

        } catch (error) {
            logger.error('Error fetching QR codes for item:', error);
            return supabaseService.handleError(error, 'QR codes retrieval');
        }
    }

    /**
     * Get all QR codes for a user across all properties
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} QR codes result
     */
    async getAllQRCodesForUser(userId = this.demoUserId, filters = {}) {
        try {
            logger.info('Fetching all QR codes for user:', { userId, filters });

            // Get all user items first
            const itemsResult = await itemDataAccess.getAllItemsForUser(userId);
            if (!itemsResult.success) {
                return itemsResult;
            }

            const itemIds = itemsResult.data.map(item => item.id);
            
            if (itemIds.length === 0) {
                return {
                    success: true,
                    data: [],
                    count: 0,
                    message: 'No QR codes found (no items)'
                };
            }

            // Build query for QR codes across all user items
            let allQRCodes = [];
            
            for (const itemId of itemIds) {
                const qrCodesResult = await this.getQRCodesForItem(itemId, userId, filters);
                if (qrCodesResult.success) {
                    // Add item information to each QR code
                    const enhancedQRCodes = qrCodesResult.data.map(qr => ({
                        ...qr,
                        item: qrCodesResult.item
                    }));
                    allQRCodes = allQRCodes.concat(enhancedQRCodes);
                }
            }

            // Sort QR codes if specified
            if (filters.sortBy) {
                allQRCodes.sort((a, b) => {
                    const aVal = a[filters.sortBy];
                    const bVal = b[filters.sortBy];
                    if (filters.sortOrder === 'desc') {
                        return bVal > aVal ? 1 : -1;
                    }
                    return aVal > bVal ? 1 : -1;
                });
            }

            // Apply limit if specified
            if (filters.limit) {
                allQRCodes = allQRCodes.slice(0, parseInt(filters.limit));
            }

            logger.info('All QR codes fetched successfully:', { 
                count: allQRCodes.length,
                items: itemIds.length,
                userId 
            });

            return {
                success: true,
                data: allQRCodes,
                count: allQRCodes.length,
                message: 'All user QR codes retrieved successfully',
                items: itemsResult.data
            };

        } catch (error) {
            logger.error('Error fetching all user QR codes:', error);
            return supabaseService.handleError(error, 'All user QR codes retrieval');
        }
    }

    /**
     * Get QR code by QR ID (for scanning/validation)
     * @param {string} qrId - QR code identifier
     * @returns {Promise<Object>} QR code result with item and property info
     */
    async getQRCodeByQRId(qrId) {
        try {
            logger.info('Fetching QR code by QR ID:', { qrId });

            if (!qrId || typeof qrId !== 'string') {
                throw new Error('QR ID is required and must be a string');
            }

            const result = await supabaseService.select(this.tableName, {
                where: { qr_id: qrId },
                limit: 1
            });

            if (!result.success) {
                throw new Error('Failed to fetch QR code from database');
            }

            if (!result.data || result.data.length === 0) {
                return {
                    success: false,
                    message: 'QR code not found',
                    data: null
                };
            }

            const qrCode = result.data[0];

            // Get associated item and property information
            const itemResult = await itemDataAccess.getItemById(qrCode.item_id, this.demoUserId);
            
            if (!itemResult.success) {
                logger.warn('QR code found but associated item not accessible:', { 
                    qrId, 
                    itemId: qrCode.item_id 
                });
                return {
                    success: false,
                    message: 'QR code found but associated item not accessible',
                    data: null
                };
            }

            logger.info('QR code found with full context:', { 
                qrId: qrCode.qr_id,
                itemId: qrCode.item_id,
                itemName: itemResult.data.name
            });

            return {
                success: true,
                data: {
                    ...qrCode,
                    item: itemResult.data,
                    property: itemResult.property
                },
                message: 'QR code retrieved successfully'
            };

        } catch (error) {
            logger.error('Error fetching QR code by QR ID:', error);
            return supabaseService.handleError(error, 'QR code retrieval by QR ID');
        }
    }

    /**
     * Record a QR code scan (increment scan count and update last scanned)
     * @param {string} qrId - QR code identifier
     * @param {Object} scanData - Additional scan data (optional)
     * @returns {Promise<Object>} Scan recording result
     */
    async recordScan(qrId, scanData = {}) {
        try {
            logger.info('Recording QR code scan:', { qrId, scanData });

            // Get current QR code data
            const qrCodeResult = await this.getQRCodeByQRId(qrId);
            if (!qrCodeResult.success) {
                return qrCodeResult;
            }

            const qrCode = qrCodeResult.data;

            // Check if QR code is active
            if (qrCode.status !== 'active') {
                return {
                    success: false,
                    message: `QR code is ${qrCode.status} and cannot be scanned`,
                    data: qrCode
                };
            }

            // Update scan count and timestamp
            const updateData = {
                scan_count: (qrCode.scan_count || 0) + 1,
                last_scanned: new Date().toISOString()
            };

            const result = await supabaseService.update(
                this.tableName, 
                updateData, 
                { id: qrCode.id }
            );

            if (!result.success) {
                throw new Error('Failed to update scan count in database');
            }

            logger.info('QR code scan recorded successfully:', { 
                qrId: qrCode.qr_id,
                newScanCount: updateData.scan_count,
                itemName: qrCode.item.name
            });

            return {
                success: true,
                data: {
                    ...result.data[0],
                    item: qrCode.item,
                    property: qrCode.property
                },
                message: 'QR code scan recorded successfully',
                scanInfo: {
                    scanCount: updateData.scan_count,
                    lastScanned: updateData.last_scanned,
                    scanData
                }
            };

        } catch (error) {
            logger.error('Error recording QR code scan:', error);
            return supabaseService.handleError(error, 'QR code scan recording');
        }
    }

    /**
     * Update QR code status or regenerate QR ID
     * @param {string} qrCodeId - QR code database ID
     * @param {Object} updateData - Update data
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Update result
     */
    async updateQRCode(qrCodeId, updateData, userId = this.demoUserId) {
        try {
            logger.info('Updating QR code:', { qrCodeId, updateData, userId });

            if (!qrCodeId) {
                throw new Error('QR code ID is required');
            }

            // Get current QR code and verify access
            const existingQRCode = await supabaseService.findById(this.tableName, qrCodeId);
            if (!existingQRCode.success || !existingQRCode.data) {
                return {
                    success: false,
                    message: 'QR code not found',
                    data: null
                };
            }

            // Verify user has access to the associated item
            const itemCheck = await itemDataAccess.getItemById(existingQRCode.data.item_id, userId);
            if (!itemCheck.success) {
                return {
                    success: false,
                    message: 'QR code not found or access denied',
                    data: null
                };
            }

            // Validate update data
            this.validateQRCodeUpdateData(updateData);

            // Prepare update data (filter out readonly fields)
            const allowedFields = ['status', 'qr_id'];
            const filteredUpdateData = {};
            
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    filteredUpdateData[key] = updateData[key];
                }
            });

            // If regenerating QR ID, ensure it's unique
            if (filteredUpdateData.qr_id) {
                const uniqueCheck = await this.validateQRIdUnique(filteredUpdateData.qr_id);
                if (!uniqueCheck) {
                    return {
                        success: false,
                        message: 'New QR ID is not unique',
                        data: null
                    };
                }
            }

            if (Object.keys(filteredUpdateData).length === 0) {
                return {
                    success: false,
                    message: 'No valid fields to update',
                    data: null
                };
            }

            const result = await supabaseService.update(
                this.tableName, 
                filteredUpdateData, 
                { id: qrCodeId }
            );

            if (!result.success) {
                throw new Error('Failed to update QR code in database');
            }

            logger.info('QR code updated successfully:', { 
                id: qrCodeId,
                updatedFields: Object.keys(filteredUpdateData)
            });

            return {
                success: true,
                data: {
                    ...result.data[0],
                    item: itemCheck.data,
                    property: itemCheck.property
                },
                message: 'QR code updated successfully'
            };

        } catch (error) {
            logger.error('Error updating QR code:', error);
            return supabaseService.handleError(error, 'QR code update');
        }
    }

    /**
     * Delete/deactivate a QR code
     * @param {string} qrCodeId - QR code database ID
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @param {boolean} hardDelete - Whether to permanently delete (default: false, sets to inactive)
     * @returns {Promise<Object>} Delete result
     */
    async deleteQRCode(qrCodeId, userId = this.demoUserId, hardDelete = false) {
        try {
            logger.info('Deleting QR code:', { qrCodeId, userId, hardDelete });

            if (!qrCodeId) {
                throw new Error('QR code ID is required');
            }

            // Get current QR code and verify access
            const existingQRCode = await supabaseService.findById(this.tableName, qrCodeId);
            if (!existingQRCode.success || !existingQRCode.data) {
                return {
                    success: false,
                    message: 'QR code not found',
                    data: null
                };
            }

            // Verify user has access to the associated item
            const itemCheck = await itemDataAccess.getItemById(existingQRCode.data.item_id, userId);
            if (!itemCheck.success) {
                return {
                    success: false,
                    message: 'QR code not found or access denied',
                    data: null
                };
            }

            let result;
            let message;

            if (hardDelete) {
                // Permanently delete the QR code
                result = await supabaseService.delete(this.tableName, { id: qrCodeId });
                message = 'QR code permanently deleted';
            } else {
                // Soft delete by setting status to inactive
                result = await supabaseService.update(
                    this.tableName, 
                    { status: 'inactive' }, 
                    { id: qrCodeId }
                );
                message = 'QR code deactivated';
            }

            if (!result.success) {
                throw new Error(`Failed to ${hardDelete ? 'delete' : 'deactivate'} QR code in database`);
            }

            logger.info(`QR code ${hardDelete ? 'deleted' : 'deactivated'} successfully:`, { 
                id: qrCodeId,
                qrId: existingQRCode.data.qr_id
            });

            return {
                success: true,
                message,
                data: { 
                    deletedQRCodeId: qrCodeId,
                    qrId: existingQRCode.data.qr_id,
                    itemName: itemCheck.data.name,
                    hardDelete
                }
            };

        } catch (error) {
            logger.error('Error deleting QR code:', error);
            return supabaseService.handleError(error, 'QR code deletion');
        }
    }

    /**
     * Get QR code analytics and statistics
     * @param {string} itemId - Item ID (optional, if not provided, gets stats for all user items)
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Analytics result
     */
    async getQRCodeAnalytics(itemId = null, userId = this.demoUserId) {
        try {
            logger.info('Fetching QR code analytics:', { itemId, userId });

            let analytics = {};

            if (itemId) {
                // Analytics for specific item
                const qrCodes = await this.getQRCodesForItem(itemId, userId);
                
                if (!qrCodes.success) {
                    return qrCodes;
                }

                const statusBreakdown = {};
                let totalScans = 0;
                let activeQRCodes = 0;
                let lastScanDate = null;

                qrCodes.data.forEach(qr => {
                    const status = qr.status || 'unknown';
                    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
                    
                    if (status === 'active') {
                        activeQRCodes++;
                    }
                    
                    totalScans += qr.scan_count || 0;
                    
                    if (qr.last_scanned) {
                        const scanDate = new Date(qr.last_scanned);
                        if (!lastScanDate || scanDate > lastScanDate) {
                            lastScanDate = scanDate;
                        }
                    }
                });

                analytics = {
                    itemId,
                    totalQRCodes: qrCodes.data.length,
                    activeQRCodes,
                    statusBreakdown,
                    totalScans,
                    averageScansPerQR: qrCodes.data.length > 0 ? Math.round((totalScans / qrCodes.data.length) * 100) / 100 : 0,
                    lastScanDate: lastScanDate ? lastScanDate.toISOString() : null,
                    item: qrCodes.item
                };
            } else {
                // Analytics for all user QR codes
                const allQRCodes = await this.getAllQRCodesForUser(userId);
                
                if (!allQRCodes.success) {
                    return allQRCodes;
                }

                const statusBreakdown = {};
                const itemBreakdown = {};
                let totalScans = 0;
                let activeQRCodes = 0;
                let lastScanDate = null;

                allQRCodes.data.forEach(qr => {
                    const status = qr.status || 'unknown';
                    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
                    
                    if (status === 'active') {
                        activeQRCodes++;
                    }
                    
                    totalScans += qr.scan_count || 0;
                    
                    if (qr.item) {
                        itemBreakdown[qr.item.id] = {
                            name: qr.item.name,
                            qrCodes: (itemBreakdown[qr.item.id]?.qrCodes || 0) + 1,
                            scans: (itemBreakdown[qr.item.id]?.scans || 0) + (qr.scan_count || 0)
                        };
                    }
                    
                    if (qr.last_scanned) {
                        const scanDate = new Date(qr.last_scanned);
                        if (!lastScanDate || scanDate > lastScanDate) {
                            lastScanDate = scanDate;
                        }
                    }
                });

                analytics = {
                    userId,
                    totalQRCodes: allQRCodes.data.length,
                    activeQRCodes,
                    statusBreakdown,
                    itemBreakdown,
                    totalScans,
                    averageScansPerQR: allQRCodes.data.length > 0 ? Math.round((totalScans / allQRCodes.data.length) * 100) / 100 : 0,
                    lastScanDate: lastScanDate ? lastScanDate.toISOString() : null,
                    items: allQRCodes.items
                };
            }

            logger.info('QR code analytics calculated:', { 
                scope: itemId ? 'item' : 'user',
                totalQRCodes: analytics.totalQRCodes,
                totalScans: analytics.totalScans
            });

            return {
                success: true,
                data: analytics,
                message: 'QR code analytics retrieved successfully'
            };

        } catch (error) {
            logger.error('Error fetching QR code analytics:', error);
            return supabaseService.handleError(error, 'QR code analytics');
        }
    }

    /**
     * Validate QR ID uniqueness
     * @param {string} qrId - QR ID to validate
     * @returns {Promise<boolean>} True if unique, false otherwise
     */
    async validateQRIdUnique(qrId) {
        try {
            const existingCount = await supabaseService.count(this.tableName, { qr_id: qrId });
            return existingCount === 0;
        } catch (error) {
            logger.error('Error validating QR ID uniqueness:', error);
            return false;
        }
    }

    /**
     * Validate QR code update data
     * @param {Object} updateData - Update data to validate
     * @throws {Error} If validation fails
     */
    validateQRCodeUpdateData(updateData) {
        if (!updateData || typeof updateData !== 'object') {
            throw new Error('Update data is required');
        }

        if (updateData.status !== undefined) {
            const validStatuses = ['active', 'inactive', 'expired', 'deleted'];
            if (!validStatuses.includes(updateData.status)) {
                throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
            }
        }

        if (updateData.qr_id !== undefined) {
            if (!updateData.qr_id || typeof updateData.qr_id !== 'string' || updateData.qr_id.trim().length === 0) {
                throw new Error('QR ID must be a non-empty string');
            }
            if (updateData.qr_id.length > 255) {
                throw new Error('QR ID must be 255 characters or less');
            }
        }
    }
}

// Create singleton instance
const qrCodeDataAccess = new QRCodeDataAccess();

module.exports = qrCodeDataAccess;