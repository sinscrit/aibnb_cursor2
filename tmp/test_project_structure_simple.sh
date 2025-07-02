#!/bin/bash

# Simplified test script for Task 5: Basic Project Structure
# Purpose: Verify directories, files, and basic functionality without port conflicts

echo "=== Testing Basic Project Structure for Task 5 (Simplified) ==="
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

# Test 3: Test middleware functionality without starting server
echo ""
echo "🧪 Test 3: Testing middleware functionality..."

cd backend

# Test logger functionality
cat > test_middleware.js << 'EOF'
console.log('Testing middleware components...');

try {
    // Test logger
    const logger = require('./config/logger');
    logger.info('Test log message');
    console.log('✅ Logger working');
    
    // Test error handler
    const { AppError, catchAsync } = require('./middleware/errorHandler');
    const error = new AppError('Test error', 400);
    console.log('✅ Error handler working');
    
    // Test database config
    const { getConnectionStatus } = require('./config/database');
    const status = getConnectionStatus();
    console.log('✅ Database config working');
    
    console.log('✅ All middleware components functional');
    process.exit(0);
} catch (err) {
    console.log('❌ Middleware test failed:', err.message);
    process.exit(1);
}
EOF

node test_middleware.js
MIDDLEWARE_RESULT=$?

# Clean up
rm test_middleware.js

if [ $MIDDLEWARE_RESULT -eq 0 ]; then
    echo "✅ Middleware functionality working"
else
    echo "❌ Middleware functionality failed"
    exit 1
fi

# Test 4: Test server configuration (syntax check only)
echo ""
echo "🧪 Test 4: Testing server configuration..."

# Check server.js syntax
node -c server.js
SYNTAX_RESULT=$?

if [ $SYNTAX_RESULT -eq 0 ]; then
    echo "✅ Server.js syntax is valid"
else
    echo "❌ Server.js has syntax errors"
    exit 1
fi

# Test 5: Verify package dependencies
echo ""
echo "🧪 Test 5: Checking package dependencies..."

if npm list --depth=0 > /dev/null 2>&1; then
    echo "✅ All package dependencies are installed"
else
    echo "❌ Some package dependencies are missing"
    exit 1
fi

cd /workspace

echo ""
echo "=== Test Summary ==="
echo "🎉 All project structure tests passed!"
echo "✅ Directory structure complete"
echo "✅ Configuration files present"  
echo "✅ Middleware components functional"
echo "✅ Server configuration valid"
echo "✅ Package dependencies installed"
echo ""
echo "Task 5: Basic project structure setup is complete!"