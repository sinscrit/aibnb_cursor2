#!/bin/bash

# Test script for Task 2: Express.js Server
# Purpose: Verify server starts and responds to basic routes

echo "=== Testing Express.js Server for Task 2 ==="
echo "Date: $(date)"

# Start server in background
cd /workspace/backend
echo "Starting server..."
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo "✅ Health endpoint working"
else
    echo "❌ Health endpoint failed"
fi

# Test API info endpoint
echo "Testing API info endpoint..."
API_RESPONSE=$(curl -s http://localhost:3001/api)
if echo "$API_RESPONSE" | grep -q "Property Management API"; then
    echo "✅ API info endpoint working"
else
    echo "❌ API info endpoint failed"
fi

# Test 404 handling
echo "Testing 404 handling..."
NOT_FOUND_RESPONSE=$(curl -s http://localhost:3001/nonexistent)
if echo "$NOT_FOUND_RESPONSE" | grep -q "Route not found"; then
    echo "✅ 404 handling working"
else
    echo "❌ 404 handling failed"
fi

# Kill server
echo "Stopping server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo "=== Server test completed ==="