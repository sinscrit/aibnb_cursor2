'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Item } from '@/types/item';
import { QRCode } from '@/types/qrCode';
import { getQRCodesForItem, generateQRCode, downloadQRCode } from '@/lib/api/qrCodes';

interface ItemListProps {
  items: Item[];
  propertyId: string;
  loading?: boolean;
  onDeleteItem: (itemId: string, itemName: string) => Promise<void>;
  onRefresh?: () => void;
  onQRGenerated?: (itemId: string, qrCode: QRCode) => void;
}

export default function ItemList({
  items,
  propertyId,
  loading = false,
  onDeleteItem,
  onRefresh,
  onQRGenerated
}: ItemListProps): React.JSX.Element {
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [itemQRCodes, setItemQRCodes] = useState<Record<string, QRCode[]>>({});
  const [loadingQR, setLoadingQR] = useState<Record<string, boolean>>({});
  const [generatingQR, setGeneratingQR] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load QR codes for all items
  useEffect(() => {
    const loadQRCodes = async (): Promise<void> => {
      if (items.length === 0) return;

      const qrCodePromises = items.map(async (item) => {
        try {
          setLoadingQR(prev => ({ ...prev, [item.id]: true }));
          const qrCodes = await getQRCodesForItem(item.id);
          return { itemId: item.id, qrCodes };
        } catch (error) {
          console.error(`Error loading QR codes for item ${item.id}:`, error);
          return { itemId: item.id, qrCodes: [] };
        } finally {
          setLoadingQR(prev => ({ ...prev, [item.id]: false }));
        }
      });

      const results = await Promise.all(qrCodePromises);
      const qrCodeMap: Record<string, QRCode[]> = {};
      results.forEach(({ itemId, qrCodes }) => {
        qrCodeMap[itemId] = qrCodes;
      });
      setItemQRCodes(qrCodeMap);
    };

    loadQRCodes();
  }, [items]);

  // Auto-clear success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Generate QR code for an item
  const handleGenerateQR = async (item: Item): Promise<void> => {
    try {
      setGeneratingQR(prev => ({ ...prev, [item.id]: true }));
      
      const result = await generateQRCode(item.id);
      
      // Update local state
      setItemQRCodes(prev => ({
        ...prev,
        [item.id]: [...(prev[item.id] || []), result.qrCode]
      }));
      
      setSuccessMessage(`QR code generated successfully for "${item.name}"`);
      
      if (onQRGenerated) {
        onQRGenerated(item.id, result.qrCode);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setSuccessMessage(`Failed to generate QR code for "${item.name}"`);
    } finally {
      setGeneratingQR(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Download QR code
  const handleDownloadQR = async (qrCode: QRCode, itemName: string): Promise<void> => {
    try {
      await downloadQRCode(qrCode.qr_id);
      setSuccessMessage(`QR code downloaded for "${itemName}"`);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      setSuccessMessage(`Failed to download QR code for "${itemName}"`);
    }
  };

  // Get QR code status for an item
  const getQRStatus = (itemId: string): { hasQR: boolean; activeQRs: number; totalQRs: number; latestQR?: QRCode } => {
    const qrCodes = itemQRCodes[itemId] || [];
    const activeQRs = qrCodes.filter(qr => qr.status === 'active');
    const latestQR = qrCodes.length > 0 ? qrCodes.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0] : undefined;
    
    return {
      hasQR: qrCodes.length > 0,
      activeQRs: activeQRs.length,
      totalQRs: qrCodes.length,
      latestQR
    };
  };

  // Handle item deletion with confirmation
  const handleDelete = async (item: Item): Promise<void> => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone and will deactivate any associated QR codes.`)) {
      return;
    }

    setDeletingItemId(item.id);
    try {
      await onDeleteItem(item.id, item.name);
    } catch (error) {
      console.error('Error deleting item:', error);
      // Error handling is done in the parent component
    } finally {
      setDeletingItemId(null);
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

  // Get media type display info
  const getMediaTypeInfo = (mediaType: Item['media_type']): { icon: string; label: string; color: string } => {
    const mediaTypes = {
      image: { icon: '🖼️', label: 'Image', color: 'bg-blue-100 text-blue-800' },
      video: { icon: '🎥', label: 'Video', color: 'bg-purple-100 text-purple-800' },
      document: { icon: '📄', label: 'Document', color: 'bg-green-100 text-green-800' },
      audio: { icon: '🎵', label: 'Audio', color: 'bg-yellow-100 text-yellow-800' },
      other: { icon: '📦', label: 'Other', color: 'bg-gray-100 text-gray-800' }
    };
    
    if (!mediaType || !mediaTypes[mediaType]) {
      return { icon: '📦', label: 'No Media', color: 'bg-gray-100 text-gray-800' };
    }
    
    return mediaTypes[mediaType];
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-12">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first item to this property.</p>
          <div className="mt-6">
            <Link
              href={`/items/${propertyId}/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add First Item
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Success Message */}
      {successMessage && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-blue-400 hover:text-blue-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Items ({items.length})
          </h3>
          <div className="flex items-center space-x-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className={`-ml-1 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            )}
            <Link
              href={`/items/${propertyId}/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </Link>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-gray-200">
        {items.map((item) => {
          const mediaInfo = getMediaTypeInfo(item.media_type);
          const isDeleting = deletingItemId === item.id;
          const qrStatus = getQRStatus(item.id);
          const isLoadingItemQR = loadingQR[item.id] || false;
          const isGeneratingItemQR = generatingQR[item.id] || false;
          
          return (
            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Media Type Icon */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                      {mediaInfo.icon}
                    </div>
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mediaInfo.color}`}>
                        {mediaInfo.label}
                      </span>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-1 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {item.location && (
                        <span className="flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {item.location}
                        </span>
                      )}
                      <span>Created: {formatDate(item.created_at)}</span>
                      {item.media_url && (
                        <span className="text-blue-600">Has Media</span>
                      )}
                      {/* QR Code Status */}
                      {isLoadingItemQR ? (
                        <span className="flex items-center text-gray-400">
                          <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading QR...
                        </span>
                      ) : qrStatus.hasQR ? (
                        <span className={`flex items-center ${qrStatus.activeQRs > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                          </svg>
                          {qrStatus.activeQRs > 0 ? `${qrStatus.activeQRs} Active QR` : `${qrStatus.totalQRs} QR (Inactive)`}
                        </span>
                      ) : (
                        <span className="text-gray-400">No QR Code</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* QR Code Actions */}
                  {qrStatus.hasQR ? (
                    <div className="flex items-center space-x-1">
                      {/* Download QR Button */}
                      {qrStatus.latestQR && (
                        <button
                          onClick={() => handleDownloadQR(qrStatus.latestQR!, item.name)}
                          className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          title="Download QR Code"
                        >
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </button>
                      )}
                      
                      {/* Regenerate QR Button */}
                      <button
                        onClick={() => handleGenerateQR(item)}
                        disabled={isGeneratingItemQR}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate New QR Code"
                      >
                        {isGeneratingItemQR ? (
                          <>
                            <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            New QR
                          </>
                        )}
                      </button>
                      
                      {/* View QR Generation Page */}
                      <Link
                        href={`/qr/generate/${item.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Manage QR Codes"
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manage
                      </Link>
                    </div>
                  ) : (
                    /* Generate First QR Button */
                    <button
                      onClick={() => handleGenerateQR(item)}
                      disabled={isGeneratingItemQR}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Generate QR Code"
                    >
                      {isGeneratingItemQR ? (
                        <>
                          <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                          </svg>
                          Generate QR
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* Regular Actions */}
                  <Link
                    href={`/items/${propertyId}/${item.id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isDeleting}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}