'use client';

import React, { useState, useEffect } from 'react';
import { QRCode, QRCodeGenerationResult, CreateQRCodeData } from '@/types/qrCode';
import { Item } from '@/types/item';

interface QRGeneratorProps {
  item: Item;
  existingQR?: QRCode | null;
  onQRGenerated?: (result: QRCodeGenerationResult) => void;
  onError?: (error: string) => void;
}

export default function QRGenerator({
  item,
  existingQR,
  onQRGenerated,
  onError
}: QRGeneratorProps): React.JSX.Element {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [qrResult, setQrResult] = useState<QRCodeGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [customQRId, setCustomQRId] = useState<string>('');

  // Initialize with existing QR if available
  useEffect(() => {
    if (existingQR) {
      // Mock the result structure for existing QR codes
      const mockResult: QRCodeGenerationResult = {
        qrCode: existingQR,
        imageUrl: `/api/qr-codes/${existingQR.qr_id}/image`,
        downloadUrl: `/api/qr-codes/${existingQR.qr_id}/download`
      };
      setQrResult(mockResult);
      setShowPreview(true);
    }
  }, [existingQR]);

  // Generate unique QR ID
  const generateQRId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const itemPrefix = item.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'ITEM';
    return `QR-${itemPrefix}-${timestamp}-${random}`;
  };

  // Handle QR code generation
  const handleGenerateQR = async (): Promise<void> => {
    try {
      setIsGenerating(true);
      setError(null);

      // Prepare generation data
      const qrData: CreateQRCodeData = {
        item_id: item.id,
        custom_qr_id: customQRId.trim() || undefined,
        status: 'active',
        metadata: {
          generated_at: new Date().toISOString(),
          item_name: item.name,
          property_id: item.property_id
        }
      };

      // In a real implementation, this would be an API call
      // For now, simulate QR generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const generatedQRId = customQRId.trim() || generateQRId();
      
      const newQRCode: QRCode = {
        id: `qr-${Date.now()}`,
        item_id: item.id,
        qr_id: generatedQRId,
        status: 'active',
        scan_count: 0,
        last_scanned_at: null,
        metadata: qrData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result: QRCodeGenerationResult = {
        qrCode: newQRCode,
        imageUrl: `/api/qr-codes/${generatedQRId}/image`,
        downloadUrl: `/api/qr-codes/${generatedQRId}/download`
      };

      setQrResult(result);
      setShowPreview(true);
      
      if (onQRGenerated) {
        onQRGenerated(result);
      }

    } catch (err) {
      console.error('Error generating QR code:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle QR code regeneration
  const handleRegenerateQR = async (): Promise<void> => {
    setQrResult(null);
    setShowPreview(false);
    await handleGenerateQR();
  };

  // Handle download
  const handleDownload = (): void => {
    if (qrResult) {
      // In a real implementation, this would trigger file download
      window.open(qrResult.downloadUrl, '_blank');
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">QR Code Generator</h3>
          <p className="text-sm text-gray-500">
            Generate a QR code for &quot;{item.name}&quot;
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            qrResult ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {qrResult ? 'Generated' : 'Not Generated'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Information */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Item Details</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-gray-500">Name:</span>
            <p className="text-sm text-gray-900">{item.name}</p>
          </div>
          {item.location && (
            <div>
              <span className="text-xs font-medium text-gray-500">Location:</span>
              <p className="text-sm text-gray-900">{item.location}</p>
            </div>
          )}
          {item.description && (
            <div className="sm:col-span-2">
              <span className="text-xs font-medium text-gray-500">Description:</span>
              <p className="text-sm text-gray-900">{item.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Generation Form */}
      {!qrResult && (
        <div className="mb-6">
          <label htmlFor="customQRId" className="block text-sm font-medium text-gray-700 mb-2">
            Custom QR ID (Optional)
          </label>
          <input
            id="customQRId"
            type="text"
            value={customQRId}
            onChange={(e) => setCustomQRId(e.target.value)}
            disabled={isGenerating}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
            placeholder="Leave empty for auto-generated ID"
            maxLength={50}
          />
          <p className="mt-1 text-xs text-gray-500">
            If not provided, a unique ID will be generated automatically
          </p>
        </div>
      )}

      {/* QR Preview */}
      {showPreview && qrResult && (
        <div className="mb-6">
          <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
            <div className="inline-block bg-white p-4 rounded-lg shadow-sm">
              {/* QR Code Preview - In real implementation, this would show actual QR image */}
              <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                  </svg>
                  <p className="text-xs text-gray-500">QR Code Preview</p>
                  <p className="text-xs font-mono text-gray-700 mt-1">{qrResult.qrCode.qr_id}</p>
                </div>
              </div>
            </div>
            
            {/* QR Info */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-900">
                QR ID: {qrResult.qrCode.qr_id}
              </p>
              <p className="text-xs text-gray-500">
                Generated: {formatDate(qrResult.qrCode.created_at)}
              </p>
              <p className="text-xs text-gray-500">
                Status: <span className="font-medium capitalize">{qrResult.qrCode.status}</span>
              </p>
              <p className="text-xs text-gray-500">
                Scans: {qrResult.qrCode.scan_count}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between space-x-3">
        <div className="flex space-x-3">
          {!qrResult ? (
            <button
              onClick={handleGenerateQR}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                  </svg>
                  Generate QR Code
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleRegenerateQR}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          )}
        </div>

        {qrResult && (
          <div className="flex space-x-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
            
            <button
              onClick={() => {
                if (qrResult) {
                  navigator.clipboard.writeText(qrResult.qrCode.qr_id);
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy ID
            </button>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Usage Instructions</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Generate a QR code to create a scannable link to this item</li>
          <li>• Use the download button to save the QR code image</li>
          <li>• Print and attach QR codes to physical items for easy scanning</li>
          <li>• Anyone scanning the code will see item details and location</li>
          <li>• Regenerate if you need a new QR code for the same item</li>
        </ul>
      </div>
    </div>
  );
}