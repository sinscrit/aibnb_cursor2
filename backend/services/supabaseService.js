/**
 * Supabase Service Base
 * Generic database service layer for property management system
 * Provides common database operations with error handling and connection management
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');

class SupabaseService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionTestStatus = 'untested';
        
        // Initialize Supabase client
        this.initializeClient();
    }

    /**
     * Initialize Supabase client with environment variables
     */
    initializeClient() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL || 'https://demo.supabase.co';
            const supabaseKey = process.env.SUPABASE_ANON_KEY || 'demo-key';

            if (!supabaseUrl || !supabaseKey) {
                logger.warn('Supabase credentials not found, using demo configuration');
            }

            this.client = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: false
                },
                db: {
                    schema: 'public'
                }
            });

            logger.info('Supabase client initialized successfully');
            this.connectionTestStatus = 'initialized';

        } catch (error) {
            logger.error('Failed to initialize Supabase client:', error);
            this.connectionTestStatus = 'failed';
            throw new Error(`Supabase initialization failed: ${error.message}`);
        }
    }

    /**
     * Test database connection
     * @returns {Promise<Object>} Connection test result
     */
    async testConnection() {
        try {
            logger.info('Testing Supabase connection...');

            if (!this.client) {
                throw new Error('Supabase client not initialized');
            }

            // Simple query to test connection
            const { data, error } = await this.client
                .from('properties')
                .select('count')
                .limit(1);

            if (error) {
                // Connection failed but client exists
                this.isConnected = false;
                this.connectionTestStatus = 'connection_failed';
                logger.warn('Supabase connection test failed:', error.message);
                
                return {
                    success: false,
                    status: 'connection_failed',
                    message: error.message,
                    timestamp: new Date().toISOString()
                };
            }

            // Connection successful
            this.isConnected = true;
            this.connectionTestStatus = 'connected';
            logger.info('Supabase connection test successful');

            return {
                success: true,
                status: 'connected',
                message: 'Database connection successful',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.isConnected = false;
            this.connectionTestStatus = 'error';
            logger.error('Supabase connection test error:', error);

            return {
                success: false,
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Generic query method for database operations
     * @param {string} table - Table name
     * @param {string} operation - Database operation (select, insert, update, delete)
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Query result
     */
    async query(table, operation = 'select', options = {}) {
        try {
            if (!this.client) {
                throw new Error('Supabase client not initialized');
            }

            let query = this.client.from(table);
            let result;

            switch (operation.toLowerCase()) {
                case 'select':
                    query = query.select(options.select || '*');
                    
                    if (options.where) {
                        Object.entries(options.where).forEach(([key, value]) => {
                            query = query.eq(key, value);
                        });
                    }
                    
                    if (options.orderBy) {
                        query = query.order(options.orderBy.column, { 
                            ascending: options.orderBy.ascending !== false 
                        });
                    }
                    
                    if (options.limit) {
                        query = query.limit(options.limit);
                    }
                    
                    result = await query;
                    break;

                case 'insert':
                    if (!options.data) {
                        throw new Error('Insert operation requires data');
                    }
                    
                    query = query.insert(options.data);
                    
                    if (options.select) {
                        query = query.select(options.select);
                    }
                    
                    result = await query;
                    break;

                case 'update':
                    if (!options.data) {
                        throw new Error('Update operation requires data');
                    }
                    
                    if (!options.where) {
                        throw new Error('Update operation requires where clause');
                    }
                    
                    query = query.update(options.data);
                    
                    Object.entries(options.where).forEach(([key, value]) => {
                        query = query.eq(key, value);
                    });
                    
                    if (options.select) {
                        query = query.select(options.select);
                    }
                    
                    result = await query;
                    break;

                case 'delete':
                    if (!options.where) {
                        throw new Error('Delete operation requires where clause');
                    }
                    
                    Object.entries(options.where).forEach(([key, value]) => {
                        query = query.eq(key, value);
                    });
                    
                    result = await query;
                    break;

                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }

            if (result.error) {
                logger.error(`Database ${operation} error on ${table}:`, result.error);
                throw new Error(result.error.message);
            }

            logger.info(`Database ${operation} on ${table} successful:`, {
                table,
                operation,
                recordCount: result.data ? result.data.length : 0
            });

            return {
                success: true,
                data: result.data,
                count: result.count || null,
                status: result.status
            };

        } catch (error) {
            logger.error(`Database query error:`, error);
            throw error;
        }
    }

    /**
     * Insert helper method
     * @param {string} table - Table name
     * @param {Object|Array} data - Data to insert
     * @param {string} select - Columns to return
     * @returns {Promise<Object>} Insert result
     */
    async insert(table, data, select = '*') {
        return this.query(table, 'insert', { data, select });
    }

    /**
     * Update helper method
     * @param {string} table - Table name
     * @param {Object} data - Data to update
     * @param {Object} where - Where conditions
     * @param {string} select - Columns to return
     * @returns {Promise<Object>} Update result
     */
    async update(table, data, where, select = '*') {
        return this.query(table, 'update', { data, where, select });
    }

    /**
     * Delete helper method
     * @param {string} table - Table name
     * @param {Object} where - Where conditions
     * @returns {Promise<Object>} Delete result
     */
    async delete(table, where) {
        return this.query(table, 'delete', { where });
    }

    /**
     * Select helper method
     * @param {string} table - Table name
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Select result
     */
    async select(table, options = {}) {
        return this.query(table, 'select', options);
    }

    /**
     * Find single record by ID
     * @param {string} table - Table name
     * @param {string} id - Record ID
     * @param {string} select - Columns to select
     * @returns {Promise<Object>} Single record result
     */
    async findById(table, id, select = '*') {
        const result = await this.select(table, {
            select,
            where: { id },
            limit: 1
        });

        return {
            ...result,
            data: result.data && result.data.length > 0 ? result.data[0] : null
        };
    }

    /**
     * Count records in table
     * @param {string} table - Table name
     * @param {Object} where - Where conditions
     * @returns {Promise<number>} Record count
     */
    async count(table, where = {}) {
        try {
            let query = this.client.from(table).select('*', { count: 'exact', head: true });
            
            Object.entries(where).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
            
            const result = await query;
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result.count || 0;
            
        } catch (error) {
            logger.error(`Count query error on ${table}:`, error);
            throw error;
        }
    }

    /**
     * Get connection status
     * @returns {Object} Connection status information
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            status: this.connectionTestStatus,
            clientInitialized: !!this.client,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Handle database errors with proper logging and formatting
     * @param {Error} error - Database error
     * @param {string} context - Error context
     * @returns {Object} Formatted error response
     */
    handleError(error, context = 'Database operation') {
        logger.error(`${context} failed:`, error);

        const errorResponse = {
            success: false,
            error: {
                message: error.message,
                context,
                timestamp: new Date().toISOString()
            }
        };

        // Add specific error handling for common Supabase errors
        if (error.message.includes('JWT')) {
            errorResponse.error.type = 'authentication';
            errorResponse.error.suggestion = 'Check Supabase credentials';
        } else if (error.message.includes('permission')) {
            errorResponse.error.type = 'authorization';
            errorResponse.error.suggestion = 'Check database permissions';
        } else if (error.message.includes('duplicate')) {
            errorResponse.error.type = 'constraint';
            errorResponse.error.suggestion = 'Record already exists';
        } else if (error.message.includes('foreign key')) {
            errorResponse.error.type = 'constraint';
            errorResponse.error.suggestion = 'Check foreign key relationships';
        } else {
            errorResponse.error.type = 'unknown';
            errorResponse.error.suggestion = 'Check server logs for details';
        }

        return errorResponse;
    }
}

// Create singleton instance
const supabaseService = new SupabaseService();

module.exports = supabaseService;