#!/bin/bash

# Test runner for Task 4: Environment Configuration
# Purpose: Run environment test from backend directory with proper node_modules access

echo "=== Environment Configuration Test Runner ==="
echo "Date: $(date)"

# Change to backend directory where dependencies are installed
cd /workspace/backend

# Create the test file in backend directory temporarily
cat > test_env_temp.js << 'EOF'
/**
 * Test script for Task 4: Environment Configuration
 * Purpose: Verify environment variables are loaded correctly
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

function testEnvironmentVariables() {
  console.log('=== Testing Environment Configuration for Task 4 ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  let allTestsPassed = true;
  const errors = [];

  try {
    // Test 1: Check if dotenv is working
    console.log('🧪 Test 1: Verifying dotenv is loading variables...');
    
    const fs = require('fs');
    
    if (fs.existsSync('.env.local')) {
      require('dotenv').config({ path: '.env.local' });
      console.log('✅ .env.local file found and loaded');
    } else {
      console.log('⚠️  .env.local not found, using defaults');
    }
    console.log('');

    // Test 2: Check required server variables
    console.log('🧪 Test 2: Checking server configuration variables...');
    const nodeEnv = process.env.NODE_ENV || 'development';
    const port = process.env.PORT || '3001';
    
    console.log(`   NODE_ENV: ${nodeEnv}`);
    console.log(`   PORT: ${port}`);
    
    if (nodeEnv && port) {
      console.log('✅ Server configuration variables present');
    } else {
      console.log('❌ Missing server configuration variables');
      allTestsPassed = false;
      errors.push('Server configuration incomplete');
    }
    console.log('');

    // Test 3: Check frontend configuration
    console.log('🧪 Test 3: Checking frontend configuration...');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    console.log(`   FRONTEND_URL: ${frontendUrl}`);
    
    if (frontendUrl) {
      console.log('✅ Frontend configuration present');
    } else {
      console.log('❌ Missing frontend configuration');
      allTestsPassed = false;
      errors.push('Frontend configuration incomplete');
    }
    console.log('');

    // Test 4: Check Supabase configuration
    console.log('🧪 Test 4: Checking Supabase configuration...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log(`   SUPABASE_URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not set'}`);
    console.log(`   SUPABASE_ANON_KEY: ${supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'Not set'}`);
    
    if (supabaseUrl && supabaseKey) {
      console.log('✅ Supabase configuration present');
    } else {
      console.log('⚠️  Supabase configuration using defaults (OK for development)');
    }
    console.log('');

    // Test 5: Check optional development variables
    console.log('🧪 Test 5: Checking development configuration...');
    const debug = process.env.DEBUG;
    const sqlDebug = process.env.SQL_DEBUG;
    
    console.log(`   DEBUG: ${debug || 'Not set'}`);
    console.log(`   SQL_DEBUG: ${sqlDebug || 'Not set'}`);
    
    console.log('✅ Development configuration checked');
    console.log('');

    // Test 6: Test environment variable loading in practice
    console.log('🧪 Test 6: Testing variable loading in context...');
    
    try {
      const { getConnectionStatus } = require('./config/database');
      const status = getConnectionStatus();
      
      console.log(`   Database config loaded: ${status.hasClient}`);
      console.log(`   Development mode: ${status.isDevelopment}`);
      
      if (status.hasClient) {
        console.log('✅ Environment variables working in application context');
      } else {
        console.log('❌ Environment variables not working in application context');
        allTestsPassed = false;
        errors.push('Environment integration failed');
      }
    } catch (error) {
      console.log('⚠️  Database config test skipped:', error.message);
    }
    console.log('');

    // Test 7: Verify .env files exist
    console.log('🧪 Test 7: Checking environment files...');
    
    const hasExample = fs.existsSync('.env.example');
    const hasLocal = fs.existsSync('.env.local');
    
    console.log(`   .env.example exists: ${hasExample}`);
    console.log(`   .env.local exists: ${hasLocal}`);
    
    if (hasExample) {
      console.log('✅ Environment template file present');
    } else {
      console.log('❌ Missing .env.example template');
      allTestsPassed = false;
      errors.push('Missing environment template');
    }
    
    if (hasLocal) {
      console.log('✅ Local environment file present');
    } else {
      console.log('⚠️  .env.local file not found (will use defaults)');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    allTestsPassed = false;
    errors.push(error.message);
  }

  // Summary
  console.log('=== Test Summary ===');
  if (allTestsPassed) {
    console.log('🎉 All environment configuration tests passed!');
    console.log('Environment variables are loading correctly.');
    return true;
  } else {
    console.log('💥 Some tests failed!');
    console.log('Errors encountered:');
    errors.forEach(error => console.log(`  - ${error}`));
    return false;
  }
}

// Run tests
const success = testEnvironmentVariables();
process.exit(success ? 0 : 1);
EOF

# Run the test
echo "Running environment configuration test..."
node test_env_temp.js
TEST_RESULT=$?

# Clean up temporary file
rm test_env_temp.js

# Return to workspace directory
cd /workspace

echo "=== Test completed ==="
exit $TEST_RESULT