#!/bin/bash

# Test script for Task 5: Basic Project Structure
# Purpose: Verify all directories exist and basic server health

echo "=== Testing Basic Project Structure for Task 5 ==="
echo "Date: $(date)"

cd /workspace

# Test 1: Verify directory structure
echo ""
echo "🧪 Test 1: Checking backend directory structure..."

REQUIRED_DIRS=(
    "backend/config"
    "backend/controllers" 
    "backend/routes"
    "backend/services"
    "backend/middleware"
    "backend/migrations"
    "backend/logs"
    "backend/docs"
    "tmp"
)

ALL_DIRS_EXIST=true

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir exists"
    else
        echo "❌ $dir missing"
        ALL_DIRS_EXIST=false
    fi
done

if [ "$ALL_DIRS_EXIST" = true ]; then
    echo "✅ All required directories exist"
else
    echo "❌ Some directories are missing"
    exit 1
fi

# Test 2: Verify core configuration files
echo ""
echo "🧪 Test 2: Checking core configuration files..."

REQUIRED_FILES=(
    "backend/package.json"
    "backend/server.js"
    "backend/config/database.js"
    "backend/config/logger.js"
    "backend/middleware/errorHandler.js"
    "backend/.env.example"
    "backend/.env.local"
)

ALL_FILES_EXIST=true

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        ALL_FILES_EXIST=false
    fi
done

if [ "$ALL_FILES_EXIST" = true ]; then
    echo "✅ All required configuration files exist"
else
    echo "❌ Some configuration files are missing"
    exit 1
fi

# Test 3: Test basic server functionality with new middleware
echo ""
echo "🧪 Test 3: Testing server with new middleware..."

cd backend

# Start server in background
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo "✅ Health endpoint working with new middleware"
else
    echo "❌ Health endpoint failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Test 404 handling with new error middleware
echo "Testing 404 error handling..."
NOT_FOUND_RESPONSE=$(curl -s http://localhost:3001/nonexistent)
if echo "$NOT_FOUND_RESPONSE" | grep -q "Can't find"; then
    echo "✅ 404 error handling working with new middleware"
else
    echo "❌ 404 error handling failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Test API info endpoint
echo "Testing API info endpoint..."
API_RESPONSE=$(curl -s http://localhost:3001/api)
if echo "$API_RESPONSE" | grep -q "Property Management API"; then
    echo "✅ API info endpoint working"
else
    echo "❌ API info endpoint failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Stop server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "✅ Server functionality test completed"

# Test 4: Test logging functionality
echo ""
echo "🧪 Test 4: Testing logging functionality..."

# Create a simple test to verify logger works
cat > test_logger.js << 'EOF'
const logger = require('./config/logger');

console.log('Testing logger functionality...');

// Test different log levels
logger.info('Test info message');
logger.warn('Test warning message');
logger.error('Test error message');
logger.debug('Test debug message');

// Test logger methods
if (typeof logger.info === 'function' && 
    typeof logger.warn === 'function' && 
    typeof logger.error === 'function' && 
    typeof logger.debug === 'function') {
    console.log('✅ Logger methods available');
    process.exit(0);
} else {
    console.log('❌ Logger methods not available');
    process.exit(1);
}
EOF

node test_logger.js
LOGGER_RESULT=$?

# Clean up
rm test_logger.js

if [ $LOGGER_RESULT -eq 0 ]; then
    echo "✅ Logging functionality working"
else
    echo "❌ Logging functionality failed"
    exit 1
fi

# Test 5: Test error handling functionality
echo ""
echo "🧪 Test 5: Testing error handling functionality..."

cat > test_error_handler.js << 'EOF'
const { AppError, catchAsync } = require('./middleware/errorHandler');

console.log('Testing error handling functionality...');

// Test AppError class
try {
    const error = new AppError('Test error', 400);
    if (error.statusCode === 400 && error.message === 'Test error') {
        console.log('✅ AppError class working');
    } else {
        console.log('❌ AppError class failed');
        process.exit(1);
    }
} catch (err) {
    console.log('❌ AppError class failed:', err.message);
    process.exit(1);
}

// Test catchAsync function
try {
    const asyncFn = catchAsync(async (req, res, next) => {
        // Simulated async function
        return Promise.resolve('success');
    });
    
    if (typeof asyncFn === 'function') {
        console.log('✅ catchAsync function working');
        process.exit(0);
    } else {
        console.log('❌ catchAsync function failed');
        process.exit(1);
    }
} catch (err) {
    console.log('❌ Error handling test failed:', err.message);
    process.exit(1);
}
EOF

node test_error_handler.js
ERROR_HANDLER_RESULT=$?

# Clean up
rm test_error_handler.js

if [ $ERROR_HANDLER_RESULT -eq 0 ]; then
    echo "✅ Error handling functionality working"
else
    echo "❌ Error handling functionality failed"
    exit 1
fi

cd /workspace

echo ""
echo "=== Test Summary ==="
echo "🎉 All project structure tests passed!"
echo "✅ Directory structure complete"
echo "✅ Configuration files present"  
echo "✅ Server functionality working"
echo "✅ Logging system operational"
echo "✅ Error handling implemented"
echo ""
echo "Basic project structure setup is complete!"