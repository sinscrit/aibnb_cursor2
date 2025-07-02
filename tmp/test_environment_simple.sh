#!/bin/bash

# Simple test for Task 4: Environment Configuration
# Purpose: Verify core environment variable functionality

echo "=== Simple Environment Configuration Test ==="
echo "Date: $(date)"

cd /workspace/backend

# Test 1: Check .env files exist
echo "🧪 Test 1: Checking environment files..."
if [ -f ".env.example" ]; then
    echo "✅ .env.example exists"
else
    echo "❌ .env.example missing"
    exit 1
fi

if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
else
    echo "⚠️  .env.local missing (using defaults)"
fi

# Test 2: Test environment loading with node
echo ""
echo "🧪 Test 2: Testing environment variable loading..."

cat > test_simple.js << 'EOF'
require('dotenv').config({ path: '.env.local' });

console.log('Environment variables loaded:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- PORT:', process.env.PORT || '3001');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('- DEBUG:', process.env.DEBUG || 'false');

// Verify at least basic variables are set
const required = ['NODE_ENV', 'PORT', 'FRONTEND_URL'];
let missing = [];

required.forEach(key => {
  if (!process.env[key]) {
    missing.push(key);
  }
});

if (missing.length === 0) {
  console.log('✅ All required environment variables loaded successfully');
  process.exit(0);
} else {
  console.log('❌ Missing required variables:', missing);
  process.exit(1);
}
EOF

node test_simple.js
RESULT=$?

# Clean up
rm test_simple.js

cd /workspace

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "🎉 Environment configuration test passed!"
    echo "✅ Environment variables are loading correctly"
    exit 0
else
    echo ""
    echo "💥 Environment configuration test failed!"
    exit 1
fi