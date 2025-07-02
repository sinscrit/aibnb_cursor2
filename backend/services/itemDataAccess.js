/**
 * Item Data Access Layer
 * Handles all database operations for items with property relationship validation
 */

const supabaseService = require('./supabaseService');
const propertyDataAccess = require('./propertyDataAccess');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class ItemDataAccess {
    constructor() {
        this.tableName = 'items';
        this.demoUserId = '00000000-0000-0000-0000-000000000000';
    }

    /**
     * Create a new item
     * @param {Object} itemData - Item data to create
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Created item result
     */
    async createItem(itemData, userId = this.demoUserId) {
        try {
            logger.info('Creating new item:', { 
                name: itemData.name, 
                propertyId: itemData.property_id,
                userId 
            });

            // Validate required fields
            this.validateItemData(itemData);

            // Verify property exists and belongs to user
            const propertyCheck = await propertyDataAccess.getPropertyById(itemData.property_id, userId);
            if (!propertyCheck.success) {
                return {
                    success: false,
                    message: 'Property not found or access denied',
                    error: { type: 'authorization', suggestion: 'Verify property ID and ownership' }
                };
            }

            // Prepare item data for insertion
            const insertData = {
                id: uuidv4(),
                property_id: itemData.property_id,
                name: itemData.name.trim(),
                description: itemData.description ? itemData.description.trim() : null,
                location: itemData.location ? itemData.location.trim() : null,
                media_url: itemData.media_url || null,
                media_type: itemData.media_type || 'image',
                metadata: itemData.metadata || {}
            };

            // Insert item into database
            const result = await supabaseService.insert(this.tableName, insertData);

            if (!result.success) {
                throw new Error('Failed to create item in database');
            }

            logger.info('Item created successfully:', { 
                id: result.data[0]?.id, 
                name: result.data[0]?.name,
                propertyId: result.data[0]?.property_id
            });

            return {
                success: true,
                data: result.data[0],
                message: 'Item created successfully'
            };

        } catch (error) {
            logger.error('Error creating item:', error);
            return supabaseService.handleError(error, 'Item creation');
        }
    }

    /**
     * Get items for a property with optional filtering
     * @param {string} propertyId - Property ID
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} Items result
     */
    async getItems(propertyId, userId = this.demoUserId, filters = {}) {
        try {
            logger.info('Fetching items for property:', { propertyId, userId, filters });

            if (!propertyId) {
                throw new Error('Property ID is required');
            }

            // Verify property exists and belongs to user
            const propertyCheck = await propertyDataAccess.getPropertyById(propertyId, userId);
            if (!propertyCheck.success) {
                return {
                    success: false,
                    message: 'Property not found or access denied',
                    data: []
                };
            }

            // Build query options
            const queryOptions = {
                where: { property_id: propertyId },
                orderBy: {
                    column: filters.sortBy || 'created_at',
                    ascending: filters.sortOrder !== 'desc'
                }
            };

            // Add media type filter if specified
            if (filters.media_type) {
                queryOptions.where.media_type = filters.media_type;
            }

            // Add location filter if specified
            if (filters.location) {
                // Note: This would need a LIKE query in production
                queryOptions.where.location = filters.location;
            }

            // Add limit if specified
            if (filters.limit) {
                queryOptions.limit = parseInt(filters.limit);
            }

            const result = await supabaseService.select(this.tableName, queryOptions);

            if (!result.success) {
                throw new Error('Failed to fetch items from database');
            }

            logger.info('Items fetched successfully:', { 
                count: result.data.length,
                propertyId 
            });

            return {
                success: true,
                data: result.data,
                count: result.data.length,
                message: 'Items retrieved successfully',
                property: propertyCheck.data
            };

        } catch (error) {
            logger.error('Error fetching items:', error);
            return supabaseService.handleError(error, 'Items retrieval');
        }
    }

    /**
     * Get all items for a user across all properties
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} Items result
     */
    async getAllItemsForUser(userId = this.demoUserId, filters = {}) {
        try {
            logger.info('Fetching all items for user:', { userId, filters });

            // Get all user properties first
            const propertiesResult = await propertyDataAccess.getProperties(userId);
            if (!propertiesResult.success) {
                return propertiesResult;
            }

            const propertyIds = propertiesResult.data.map(prop => prop.id);
            
            if (propertyIds.length === 0) {
                return {
                    success: true,
                    data: [],
                    count: 0,
                    message: 'No items found (no properties)'
                };
            }

            // Build query for items across all user properties
            // Note: In production, this would use IN clause or join
            let allItems = [];
            
            for (const propertyId of propertyIds) {
                const itemsResult = await this.getItems(propertyId, userId, filters);
                if (itemsResult.success) {
                    allItems = allItems.concat(itemsResult.data);
                }
            }

            // Sort items if specified
            if (filters.sortBy) {
                allItems.sort((a, b) => {
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
                allItems = allItems.slice(0, parseInt(filters.limit));
            }

            logger.info('All items fetched successfully:', { 
                count: allItems.length,
                properties: propertyIds.length,
                userId 
            });

            return {
                success: true,
                data: allItems,
                count: allItems.length,
                message: 'All user items retrieved successfully',
                properties: propertiesResult.data
            };

        } catch (error) {
            logger.error('Error fetching all user items:', error);
            return supabaseService.handleError(error, 'All user items retrieval');
        }
    }

    /**
     * Get a single item by ID
     * @param {string} itemId - Item ID
     * @param {string} userId - User ID (optional, defaults to demo user for validation)
     * @returns {Promise<Object>} Item result
     */
    async getItemById(itemId, userId = this.demoUserId) {
        try {
            logger.info('Fetching item by ID:', { itemId, userId });

            if (!itemId) {
                throw new Error('Item ID is required');
            }

            const result = await supabaseService.findById(this.tableName, itemId);

            if (!result.success) {
                throw new Error('Failed to fetch item from database');
            }

            if (!result.data) {
                return {
                    success: false,
                    message: 'Item not found',
                    data: null
                };
            }

            // Verify item's property belongs to user (for security)
            const propertyCheck = await propertyDataAccess.getPropertyById(result.data.property_id, userId);
            if (!propertyCheck.success) {
                return {
                    success: false,
                    message: 'Item not found or access denied',
                    data: null
                };
            }

            logger.info('Item found:', { 
                id: result.data.id, 
                name: result.data.name,
                propertyId: result.data.property_id
            });

            return {
                success: true,
                data: result.data,
                message: 'Item retrieved successfully',
                property: propertyCheck.data
            };

        } catch (error) {
            logger.error('Error fetching item by ID:', error);
            return supabaseService.handleError(error, 'Item retrieval by ID');
        }
    }

    /**
     * Update an item
     * @param {string} itemId - Item ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Update result
     */
    async updateItem(itemId, updateData, userId = this.demoUserId) {
        try {
            logger.info('Updating item:', { itemId, userId });

            if (!itemId) {
                throw new Error('Item ID is required');
            }

            // First verify the item exists and user has access
            const existingItem = await this.getItemById(itemId, userId);
            if (!existingItem.success) {
                return existingItem;
            }

            // Validate update data
            this.validateItemUpdateData(updateData);

            // If property_id is being changed, verify new property belongs to user
            if (updateData.property_id && updateData.property_id !== existingItem.data.property_id) {
                const newPropertyCheck = await propertyDataAccess.getPropertyById(updateData.property_id, userId);
                if (!newPropertyCheck.success) {
                    return {
                        success: false,
                        message: 'New property not found or access denied',
                        data: null
                    };
                }
            }

            // Prepare update data (filter out readonly fields)
            const allowedFields = ['name', 'description', 'location', 'media_url', 'media_type', 'metadata', 'property_id'];
            const filteredUpdateData = {};
            
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    if (key === 'name' || key === 'description' || key === 'location') {
                        filteredUpdateData[key] = updateData[key] ? updateData[key].trim() : updateData[key];
                    } else {
                        filteredUpdateData[key] = updateData[key];
                    }
                }
            });

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
                { id: itemId }
            );

            if (!result.success) {
                throw new Error('Failed to update item in database');
            }

            logger.info('Item updated successfully:', { 
                id: itemId,
                updatedFields: Object.keys(filteredUpdateData)
            });

            return {
                success: true,
                data: result.data[0],
                message: 'Item updated successfully'
            };

        } catch (error) {
            logger.error('Error updating item:', error);
            return supabaseService.handleError(error, 'Item update');
        }
    }

    /**
     * Delete an item (with QR code cleanup)
     * @param {string} itemId - Item ID
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Delete result
     */
    async deleteItem(itemId, userId = this.demoUserId) {
        try {
            logger.info('Deleting item:', { itemId, userId });

            if (!itemId) {
                throw new Error('Item ID is required');
            }

            // First verify the item exists and user has access
            const existingItem = await this.getItemById(itemId, userId);
            if (!existingItem.success) {
                return existingItem;
            }

            // Check for related QR codes (cascade delete will handle this)
            const qrCodeCount = await supabaseService.count('qr_codes', { item_id: itemId });
            
            if (qrCodeCount > 0) {
                logger.warn(`Deleting item with ${qrCodeCount} related QR codes`, { itemId });
            }

            const result = await supabaseService.delete(this.tableName, { id: itemId });

            if (!result.success) {
                throw new Error('Failed to delete item from database');
            }

            logger.info('Item deleted successfully:', { 
                id: itemId,
                relatedQRCodes: qrCodeCount
            });

            return {
                success: true,
                message: `Item deleted successfully${qrCodeCount > 0 ? ` (${qrCodeCount} related QR codes also deleted)` : ''}`,
                data: { 
                    deletedItemId: itemId,
                    relatedQRCodesDeleted: qrCodeCount,
                    itemName: existingItem.data.name
                }
            };

        } catch (error) {
            logger.error('Error deleting item:', error);
            return supabaseService.handleError(error, 'Item deletion');
        }
    }

    /**
     * Get item statistics for a property or user
     * @param {string} propertyId - Property ID (optional, if not provided, gets stats for all user properties)
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Statistics result
     */
    async getItemStats(propertyId = null, userId = this.demoUserId) {
        try {
            logger.info('Fetching item statistics:', { propertyId, userId });

            let stats = {};

            if (propertyId) {
                // Stats for specific property
                const totalItems = await supabaseService.count(this.tableName, { property_id: propertyId });
                
                const items = await this.getItems(propertyId, userId);
                const mediaTypeBreakdown = {};
                const locationBreakdown = {};
                
                if (items.success) {
                    items.data.forEach(item => {
                        const mediaType = item.media_type || 'unknown';
                        mediaTypeBreakdown[mediaType] = (mediaTypeBreakdown[mediaType] || 0) + 1;
                        
                        const location = item.location || 'unspecified';
                        locationBreakdown[location] = (locationBreakdown[location] || 0) + 1;
                    });
                }

                // Get QR code stats for property items
                const totalQRCodes = await supabaseService.count('qr_codes', {});

                stats = {
                    propertyId,
                    totalItems,
                    mediaTypeBreakdown,
                    locationBreakdown,
                    totalQRCodes,
                    qrCodeCoverage: totalItems > 0 ? Math.round((totalQRCodes / totalItems) * 100) : 0
                };
            } else {
                // Stats for all user properties
                const allItems = await this.getAllItemsForUser(userId);
                const totalItems = allItems.success ? allItems.data.length : 0;
                
                const mediaTypeBreakdown = {};
                const propertyBreakdown = {};
                
                if (allItems.success) {
                    allItems.data.forEach(item => {
                        const mediaType = item.media_type || 'unknown';
                        mediaTypeBreakdown[mediaType] = (mediaTypeBreakdown[mediaType] || 0) + 1;
                        
                        propertyBreakdown[item.property_id] = (propertyBreakdown[item.property_id] || 0) + 1;
                    });
                }

                const totalQRCodes = await supabaseService.count('qr_codes', {});

                stats = {
                    userId,
                    totalItems,
                    mediaTypeBreakdown,
                    propertyBreakdown,
                    totalQRCodes,
                    qrCodeCoverage: totalItems > 0 ? Math.round((totalQRCodes / totalItems) * 100) : 0,
                    properties: allItems.success ? allItems.properties : []
                };
            }

            logger.info('Item statistics calculated:', stats);

            return {
                success: true,
                data: stats,
                message: 'Item statistics retrieved successfully'
            };

        } catch (error) {
            logger.error('Error fetching item statistics:', error);
            return supabaseService.handleError(error, 'Item statistics');
        }
    }

    /**
     * Validate item data for creation
     * @param {Object} itemData - Item data to validate
     * @throws {Error} If validation fails
     */
    validateItemData(itemData) {
        if (!itemData || typeof itemData !== 'object') {
            throw new Error('Item data is required');
        }

        if (!itemData.property_id || typeof itemData.property_id !== 'string') {
            throw new Error('Property ID is required and must be a string');
        }

        if (!itemData.name || typeof itemData.name !== 'string' || itemData.name.trim().length === 0) {
            throw new Error('Item name is required and must be a non-empty string');
        }

        if (itemData.name.trim().length > 255) {
            throw new Error('Item name must be 255 characters or less');
        }

        if (itemData.location && itemData.location.length > 500) {
            throw new Error('Item location must be 500 characters or less');
        }

        if (itemData.media_type) {
            const validTypes = ['image', 'video', 'document', 'audio', 'other'];
            if (!validTypes.includes(itemData.media_type)) {
                throw new Error(`Media type must be one of: ${validTypes.join(', ')}`);
            }
        }

        if (itemData.metadata && typeof itemData.metadata !== 'object') {
            throw new Error('Item metadata must be an object');
        }

        if (itemData.media_url && typeof itemData.media_url !== 'string') {
            throw new Error('Media URL must be a string');
        }
    }

    /**
     * Validate item update data
     * @param {Object} updateData - Update data to validate
     * @throws {Error} If validation fails
     */
    validateItemUpdateData(updateData) {
        if (!updateData || typeof updateData !== 'object') {
            throw new Error('Update data is required');
        }

        if (updateData.property_id !== undefined && 
            (!updateData.property_id || typeof updateData.property_id !== 'string')) {
            throw new Error('Property ID must be a valid string');
        }

        if (updateData.name !== undefined) {
            if (typeof updateData.name !== 'string' || updateData.name.trim().length === 0) {
                throw new Error('Item name must be a non-empty string');
            }
            if (updateData.name.trim().length > 255) {
                throw new Error('Item name must be 255 characters or less');
            }
        }

        if (updateData.location !== undefined && updateData.location && updateData.location.length > 500) {
            throw new Error('Item location must be 500 characters or less');
        }

        if (updateData.media_type !== undefined) {
            const validTypes = ['image', 'video', 'document', 'audio', 'other'];
            if (!validTypes.includes(updateData.media_type)) {
                throw new Error(`Media type must be one of: ${validTypes.join(', ')}`);
            }
        }

        if (updateData.metadata !== undefined && typeof updateData.metadata !== 'object') {
            throw new Error('Item metadata must be an object');
        }

        if (updateData.media_url !== undefined && updateData.media_url && typeof updateData.media_url !== 'string') {
            throw new Error('Media URL must be a string');
        }
    }
}

// Create singleton instance
const itemDataAccess = new ItemDataAccess();

module.exports = itemDataAccess;