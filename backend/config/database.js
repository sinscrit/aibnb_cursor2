const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Database Configuration
 * Handles connection and initialization of Supabase client
 */

// Default test configuration for development
const DEFAULT_CONFIG = {
  url: 'https://test.supabase.co',
  anonKey: 'test-anon-key',
  isDevelopment: true
};

class SupabaseConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment variables
   * @returns {Object} Configuration object
   */
  loadConfig() {
    const url = process.env.SUPABASE_URL || DEFAULT_CONFIG.url;
    const anonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_CONFIG.anonKey;
    
    // Check if we're using real credentials or test credentials
    const isDevelopment = url === DEFAULT_CONFIG.url || anonKey === DEFAULT_CONFIG.anonKey;
    
    return {
      url,
      anonKey,
      isDevelopment,
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        }
      }
    };
  }

  /**
   * Initialize Supabase client
   * @returns {Object} Supabase client instance
   */
  initializeClient() {
    try {
      if (!this.client) {
        console.log('🔌 Initializing Supabase client...');
        
        if (this.config.isDevelopment) {
          console.log('⚠️  Using test/development Supabase configuration');
        }

        this.client = createClient(
          this.config.url, 
          this.config.anonKey, 
          this.config.options
        );

        console.log('✅ Supabase client initialized successfully');
      }
      
      return this.client;
    } catch (error) {
      console.error('❌ Error initializing Supabase client:', error.message);
      throw new Error(`Failed to initialize Supabase: ${error.message}`);
    }
  }

  /**
   * Get Supabase client instance
   * @returns {Object} Supabase client
   */
  getClient() {
    if (!this.client) {
      return this.initializeClient();
    }
    return this.client;
  }

  /**
   * Test database connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      console.log('🧪 Testing Supabase connection...');
      
      const client = this.getClient();
      
      if (this.config.isDevelopment) {
        // For development/test mode, just verify client exists
        console.log('🔧 Development mode: Skipping actual connection test');
        return {
          success: true,
          message: 'Test client created successfully (development mode)',
          isDevelopment: true,
          timestamp: new Date().toISOString()
        };
      }

      // For real Supabase instances, test with a simple query
      const { data, error } = await client
        .from('_test_connection')
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, but connection is working
        console.log('✅ Connection successful (table not found is expected)');
        this.isConnected = true;
        return {
          success: true,
          message: 'Connection successful',
          isDevelopment: false,
          timestamp: new Date().toISOString()
        };
      }

      if (error) {
        throw error;
      }

      console.log('✅ Connection test successful');
      this.isConnected = true;
      return {
        success: true,
        message: 'Connection test successful',
        isDevelopment: false,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      this.isConnected = false;
      return {
        success: false,
        message: error.message,
        isDevelopment: this.config.isDevelopment,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status info
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isDevelopment: this.config.isDevelopment,
      hasClient: !!this.client,
      url: this.config.isDevelopment ? 'test-url' : this.config.url.split('@')[1] || 'configured'
    };
  }
}

// Create and export singleton instance
const supabaseConfig = new SupabaseConfig();

module.exports = {
  supabaseConfig,
  getSupabaseClient: () => supabaseConfig.getClient(),
  testConnection: () => supabaseConfig.testConnection(),
  getConnectionStatus: () => supabaseConfig.getStatus()
};