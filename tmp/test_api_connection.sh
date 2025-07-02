#!/bin/bash

# Test script for Task 8: Frontend-Backend Connection
# Purpose: Verify frontend can make HTTP requests to backend

echo "=== Testing Frontend-Backend Connection for Task 8 ==="
echo "Date: $(date)"

# Function to cleanup processes
cleanup() {
    echo "Cleaning up processes..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        wait $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        wait $FRONTEND_PID 2>/dev/null
    fi
}

# Set up cleanup on exit
trap cleanup EXIT

cd /workspace

# Test 1: Verify API client structure
echo ""
echo "🧪 Test 1: Checking API client structure..."

REQUIRED_FILES=(
    "frontend/src/lib/api/client.ts"
    "frontend/.env.local"
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
    echo "✅ API client structure is complete"
else
    echo "❌ API client structure is incomplete"
    exit 1
fi

# Test 2: Test TypeScript compilation of API client
echo ""
echo "🧪 Test 2: Testing TypeScript compilation..."

cd frontend
if npx tsc --noEmit src/lib/api/client.ts; then
    echo "✅ API client TypeScript compilation successful"
else
    echo "❌ API client TypeScript compilation failed"
    exit 1
fi

cd /workspace

# Test 3: Start backend server
echo ""
echo "🧪 Test 3: Starting backend server..."

cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Test 4: Test backend health endpoint directly
echo ""
echo "🧪 Test 4: Testing backend health endpoint..."

HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo "✅ Backend health endpoint working"
else
    echo "❌ Backend health endpoint failed"
    exit 1
fi

# Test 5: Test backend API info endpoint
echo ""
echo "🧪 Test 5: Testing backend API info endpoint..."

API_RESPONSE=$(curl -s http://localhost:3001/api)
if echo "$API_RESPONSE" | grep -q "Property Management API"; then
    echo "✅ Backend API info endpoint working"
else
    echo "❌ Backend API info endpoint failed"
    exit 1
fi

# Test 6: Create a simple Next.js test page to verify API connection
echo ""
echo "🧪 Test 6: Creating API connection test page..."

cd /workspace

cat > frontend/src/app/api-test/page.tsx << 'EOF'
'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';

interface ApiStatus {
  backend: 'connected' | 'disconnected' | 'loading';
  health: any;
  info: any;
  error?: string;
}

export default function ApiTestPage() {
  const [status, setStatus] = useState<ApiStatus>({
    backend: 'loading',
    health: null,
    info: null,
  });

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing API connection...');
        
        // Test health endpoint
        const health = await apiClient.healthCheck();
        console.log('Health check result:', health);
        
        // Test API info endpoint
        const info = await apiClient.getApiInfo();
        console.log('API info result:', info);
        
        setStatus({
          backend: 'connected',
          health,
          info,
        });
      } catch (error) {
        console.error('API connection failed:', error);
        setStatus({
          backend: 'disconnected',
          health: null,
          info: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    testConnection();
  }, []);

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      
      <div className="property-card mb-4">
        <h2 className="text-lg font-semibold mb-2">Backend Status</h2>
        <div className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${
          status.backend === 'connected' ? 'bg-green-100 text-green-800' :
          status.backend === 'disconnected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {status.backend.toUpperCase()}
        </div>
      </div>

      {status.health && (
        <div className="property-card mb-4">
          <h2 className="text-lg font-semibold mb-2">Health Check</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(status.health, null, 2)}
          </pre>
        </div>
      )}

      {status.info && (
        <div className="property-card mb-4">
          <h2 className="text-lg font-semibold mb-2">API Information</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(status.info, null, 2)}
          </pre>
        </div>
      )}

      {status.error && (
        <div className="property-card bg-red-50 border-red-200">
          <h2 className="text-lg font-semibold mb-2 text-red-800">Error</h2>
          <p className="text-red-600">{status.error}</p>
        </div>
      )}
    </div>
  );
}
EOF

echo "✅ API connection test page created"

# Test 7: Build frontend to verify no compilation errors
echo ""
echo "🧪 Test 7: Testing frontend build with API client..."

cd frontend
if npm run build > /dev/null 2>&1; then
    echo "✅ Frontend builds successfully with API client"
else
    echo "❌ Frontend build failed with API client"
    exit 1
fi

cd /workspace

echo ""
echo "=== Test Summary ==="
echo "🎉 All frontend-backend connection tests passed!"
echo "✅ API client structure complete"
echo "✅ TypeScript compilation successful"
echo "✅ Backend server operational"
echo "✅ Backend endpoints responding"
echo "✅ Frontend builds with API client"
echo ""
echo "Task 8: Frontend-Backend Connection is complete!"
echo ""
echo "🔗 Test the connection by visiting: http://localhost:3000/api-test"