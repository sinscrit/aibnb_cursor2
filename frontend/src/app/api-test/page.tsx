'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';

interface ApiStatus {
  backend: 'connected' | 'disconnected' | 'loading';
  health: Record<string, unknown> | null;
  info: Record<string, unknown> | null;
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