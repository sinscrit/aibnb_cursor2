/**
 * Test script for Task 3: Supabase Configuration
 * Purpose: Verify Supabase client creation and connection testing
 */

const { getSupabaseClient, testConnection, getConnectionStatus } = require('../backend/config/database');

async function testSupabaseConfig() {
  console.log('=== Testing Supabase Configuration for Task 3 ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  let allTestsPassed = true;

  try {
    // Test 1: Create Supabase client
    console.log('🧪 Test 1: Creating Supabase client...');
    const client = getSupabaseClient();
    
    if (client && typeof client === 'object') {
      console.log('✅ Supabase client created successfully');
    } else {
      console.log('❌ Failed to create Supabase client');
      allTestsPassed = false;
    }
    console.log('');

    // Test 2: Get connection status
    console.log('🧪 Test 2: Getting connection status...');
    const status = getConnectionStatus();
    console.log(`   Development mode: ${status.isDevelopment}`);
    console.log(`   Has client: ${status.hasClient}`);
    console.log(`   URL: ${status.url}`);
    
    if (status.hasClient) {
      console.log('✅ Connection status retrieved successfully');
    } else {
      console.log('❌ Failed to get connection status');
      allTestsPassed = false;
    }
    console.log('');

    // Test 3: Test connection function
    console.log('🧪 Test 3: Testing connection function...');
    const connectionResult = await testConnection();
    console.log(`   Success: ${connectionResult.success}`);
    console.log(`   Message: ${connectionResult.message}`);
    console.log(`   Development mode: ${connectionResult.isDevelopment}`);
    
    if (connectionResult.success) {
      console.log('✅ Connection test completed successfully');
    } else {
      console.log('❌ Connection test failed');
      allTestsPassed = false;
    }
    console.log('');

    // Test 4: Environment variable handling
    console.log('🧪 Test 4: Testing environment variable handling...');
    const originalUrl = process.env.SUPABASE_URL;
    const originalKey = process.env.SUPABASE_ANON_KEY;
    
    // Test with no environment variables (should use defaults)
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    
    const { supabaseConfig } = require('../backend/config/database');
    const testConfig = supabaseConfig.loadConfig();
    
    if (testConfig.isDevelopment === true && testConfig.url.includes('test')) {
      console.log('✅ Environment variable fallback working correctly');
    } else {
      console.log('❌ Environment variable fallback failed');
      allTestsPassed = false;
    }
    
    // Restore original environment variables
    if (originalUrl) process.env.SUPABASE_URL = originalUrl;
    if (originalKey) process.env.SUPABASE_ANON_KEY = originalKey;
    
    console.log('');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    allTestsPassed = false;
  }

  // Summary
  console.log('=== Test Summary ===');
  if (allTestsPassed) {
    console.log('🎉 All Supabase configuration tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Run tests
testSupabaseConfig();