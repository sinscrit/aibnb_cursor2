/**
 * Property Data Access Layer
 * Handles all database operations for properties with validation and error handling
 */

const supabaseService = require('./supabaseService');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class PropertyDataAccess {
    constructor() {
        this.tableName = 'properties';
        this.demoUserId = '00000000-0000-0000-0000-000000000000';
    }

    /**
     * Create a new property
     * @param {Object} propertyData - Property data to create
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Created property result
     */
    async createProperty(propertyData, userId = this.demoUserId) {
        try {
            logger.info('Creating new property:', { name: propertyData.name, userId });

            // Validate required fields
            this.validatePropertyData(propertyData);

            // Prepare property data for insertion
            const insertData = {
                id: uuidv4(),
                user_id: userId,
                name: propertyData.name.trim(),
                description: propertyData.description ? propertyData.description.trim() : null,
                address: propertyData.address ? propertyData.address.trim() : null,
                property_type: propertyData.property_type || 'residential',
                settings: propertyData.settings || {}
            };

            // Insert property into database
            const result = await supabaseService.insert(this.tableName, insertData);

            if (!result.success) {
                throw new Error('Failed to create property in database');
            }

            logger.info('Property created successfully:', { 
                id: result.data[0]?.id, 
                name: result.data[0]?.name 
            });

            return {
                success: true,
                data: result.data[0],
                message: 'Property created successfully'
            };

        } catch (error) {
            logger.error('Error creating property:', error);
            return supabaseService.handleError(error, 'Property creation');
        }
    }

    /**
     * Get properties for a user with optional filtering
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} Properties result
     */
    async getProperties(userId = this.demoUserId, filters = {}) {
        try {
            logger.info('Fetching properties for user:', { userId, filters });

            // Build query options
            const queryOptions = {
                where: { user_id: userId },
                orderBy: {
                    column: filters.sortBy || 'created_at',
                    ascending: filters.sortOrder !== 'desc'
                }
            };

            // Add property type filter if specified
            if (filters.property_type) {
                queryOptions.where.property_type = filters.property_type;
            }

            // Add limit if specified
            if (filters.limit) {
                queryOptions.limit = parseInt(filters.limit);
            }

            const result = await supabaseService.select(this.tableName, queryOptions);

            if (!result.success) {
                throw new Error('Failed to fetch properties from database');
            }

            logger.info('Properties fetched successfully:', { 
                count: result.data.length,
                userId 
            });

            return {
                success: true,
                data: result.data,
                count: result.data.length,
                message: 'Properties retrieved successfully'
            };

        } catch (error) {
            logger.error('Error fetching properties:', error);
            return supabaseService.handleError(error, 'Properties retrieval');
        }
    }

    /**
     * Get a single property by ID
     * @param {string} propertyId - Property ID
     * @param {string} userId - User ID (optional, defaults to demo user for validation)
     * @returns {Promise<Object>} Property result
     */
    async getPropertyById(propertyId, userId = this.demoUserId) {
        try {
            logger.info('Fetching property by ID:', { propertyId, userId });

            if (!propertyId) {
                throw new Error('Property ID is required');
            }

            const result = await supabaseService.findById(this.tableName, propertyId);

            if (!result.success) {
                throw new Error('Failed to fetch property from database');
            }

            if (!result.data) {
                return {
                    success: false,
                    message: 'Property not found',
                    data: null
                };
            }

            // Verify property belongs to user (for security)
            if (result.data.user_id !== userId) {
                return {
                    success: false,
                    message: 'Property not found or access denied',
                    data: null
                };
            }

            logger.info('Property found:', { 
                id: result.data.id, 
                name: result.data.name 
            });

            return {
                success: true,
                data: result.data,
                message: 'Property retrieved successfully'
            };

        } catch (error) {
            logger.error('Error fetching property by ID:', error);
            return supabaseService.handleError(error, 'Property retrieval by ID');
        }
    }

    /**
     * Update a property
     * @param {string} propertyId - Property ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Update result
     */
    async updateProperty(propertyId, updateData, userId = this.demoUserId) {
        try {
            logger.info('Updating property:', { propertyId, userId });

            if (!propertyId) {
                throw new Error('Property ID is required');
            }

            // First verify the property exists and belongs to the user
            const existingProperty = await this.getPropertyById(propertyId, userId);
            if (!existingProperty.success) {
                return existingProperty;
            }

            // Validate update data
            this.validatePropertyUpdateData(updateData);

            // Prepare update data (filter out readonly fields)
            const allowedFields = ['name', 'description', 'address', 'property_type', 'settings'];
            const filteredUpdateData = {};
            
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    if (key === 'name' || key === 'description' || key === 'address') {
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
                { id: propertyId }
            );

            if (!result.success) {
                throw new Error('Failed to update property in database');
            }

            logger.info('Property updated successfully:', { 
                id: propertyId,
                updatedFields: Object.keys(filteredUpdateData)
            });

            return {
                success: true,
                data: result.data[0],
                message: 'Property updated successfully'
            };

        } catch (error) {
            logger.error('Error updating property:', error);
            return supabaseService.handleError(error, 'Property update');
        }
    }

    /**
     * Delete a property (soft delete by checking for related items)
     * @param {string} propertyId - Property ID
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Delete result
     */
    async deleteProperty(propertyId, userId = this.demoUserId) {
        try {
            logger.info('Deleting property:', { propertyId, userId });

            if (!propertyId) {
                throw new Error('Property ID is required');
            }

            // First verify the property exists and belongs to the user
            const existingProperty = await this.getPropertyById(propertyId, userId);
            if (!existingProperty.success) {
                return existingProperty;
            }

            // Check for related items (optional warning - cascade delete will handle this)
            const itemCount = await supabaseService.count('items', { property_id: propertyId });
            
            if (itemCount > 0) {
                logger.warn(`Deleting property with ${itemCount} related items`, { propertyId });
            }

            const result = await supabaseService.delete(this.tableName, { id: propertyId });

            if (!result.success) {
                throw new Error('Failed to delete property from database');
            }

            logger.info('Property deleted successfully:', { 
                id: propertyId,
                relatedItems: itemCount
            });

            return {
                success: true,
                message: `Property deleted successfully${itemCount > 0 ? ` (${itemCount} related items also deleted)` : ''}`,
                data: { 
                    deletedPropertyId: propertyId,
                    relatedItemsDeleted: itemCount
                }
            };

        } catch (error) {
            logger.error('Error deleting property:', error);
            return supabaseService.handleError(error, 'Property deletion');
        }
    }

    /**
     * Get property statistics
     * @param {string} userId - User ID (optional, defaults to demo user)
     * @returns {Promise<Object>} Statistics result
     */
    async getPropertyStats(userId = this.demoUserId) {
        try {
            logger.info('Fetching property statistics for user:', { userId });

            const totalProperties = await supabaseService.count(this.tableName, { user_id: userId });
            
            // Get property type breakdown
            const properties = await this.getProperties(userId);
            const typeBreakdown = {};
            
            if (properties.success) {
                properties.data.forEach(property => {
                    const type = property.property_type || 'unknown';
                    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
                });
            }

            // Get total items across all properties
            const totalItems = await supabaseService.count('items', {});

            const stats = {
                totalProperties,
                propertyTypeBreakdown: typeBreakdown,
                totalItems,
                averageItemsPerProperty: totalProperties > 0 ? Math.round(totalItems / totalProperties * 100) / 100 : 0
            };

            logger.info('Property statistics calculated:', stats);

            return {
                success: true,
                data: stats,
                message: 'Property statistics retrieved successfully'
            };

        } catch (error) {
            logger.error('Error fetching property statistics:', error);
            return supabaseService.handleError(error, 'Property statistics');
        }
    }

    /**
     * Validate property data for creation
     * @param {Object} propertyData - Property data to validate
     * @throws {Error} If validation fails
     */
    validatePropertyData(propertyData) {
        if (!propertyData || typeof propertyData !== 'object') {
            throw new Error('Property data is required');
        }

        if (!propertyData.name || typeof propertyData.name !== 'string' || propertyData.name.trim().length === 0) {
            throw new Error('Property name is required and must be a non-empty string');
        }

        if (propertyData.name.trim().length > 255) {
            throw new Error('Property name must be 255 characters or less');
        }

        if (propertyData.property_type) {
            const validTypes = ['residential', 'commercial', 'industrial', 'mixed_use', 'other'];
            if (!validTypes.includes(propertyData.property_type)) {
                throw new Error(`Property type must be one of: ${validTypes.join(', ')}`);
            }
        }

        if (propertyData.settings && typeof propertyData.settings !== 'object') {
            throw new Error('Property settings must be an object');
        }
    }

    /**
     * Validate property update data
     * @param {Object} updateData - Update data to validate
     * @throws {Error} If validation fails
     */
    validatePropertyUpdateData(updateData) {
        if (!updateData || typeof updateData !== 'object') {
            throw new Error('Update data is required');
        }

        if (updateData.name !== undefined) {
            if (typeof updateData.name !== 'string' || updateData.name.trim().length === 0) {
                throw new Error('Property name must be a non-empty string');
            }
            if (updateData.name.trim().length > 255) {
                throw new Error('Property name must be 255 characters or less');
            }
        }

        if (updateData.property_type !== undefined) {
            const validTypes = ['residential', 'commercial', 'industrial', 'mixed_use', 'other'];
            if (!validTypes.includes(updateData.property_type)) {
                throw new Error(`Property type must be one of: ${validTypes.join(', ')}`);
            }
        }

        if (updateData.settings !== undefined && typeof updateData.settings !== 'object') {
            throw new Error('Property settings must be an object');
        }
    }
}

// Create singleton instance
const propertyDataAccess = new PropertyDataAccess();

module.exports = propertyDataAccess;