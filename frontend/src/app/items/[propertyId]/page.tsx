'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ItemList from '@/components/dashboard/ItemList';
import ItemForm from '@/components/dashboard/ItemForm';
import { Item, CreateItemData } from '@/types/item';
import { Property } from '@/types/property';

export default function ItemManagementPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  // State management
  const [property, setProperty] = useState<Property | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load property and items on component mount
  useEffect(() => {
    loadPropertyAndItems();
  }, [propertyId]);

  // Auto-hide success/error messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Load property details and items
  const loadPropertyAndItems = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, these would be actual API calls
      // For now, we'll use mock data that matches our database structure
      
      // Mock property data
      const mockProperty: Property = {
        id: propertyId,
        user_id: 'demo-user-uuid',
        name: `Property ${propertyId.slice(-4)}`,
        property_type: 'house',
        description: 'A beautiful property for managing items',
        address: '123 Demo Street, Demo City, DC 12345',
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock items data
      const mockItems: Item[] = [
        {
          id: `item-1-${propertyId}`,
          property_id: propertyId,
          name: 'Refrigerator',
          description: 'Kitchen appliance - Samsung stainless steel',
          location: 'Kitchen',
          media_url: null,
          media_type: 'image',
          metadata: { brand: 'Samsung', model: 'RF28R7351SG' },
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: `item-2-${propertyId}`,
          property_id: propertyId,
          name: 'Dining Table',
          description: 'Wooden dining table for 6 people',
          location: 'Dining Room',
          media_url: null,
          media_type: null,
          metadata: {},
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: `item-3-${propertyId}`,
          property_id: propertyId,
          name: 'Warranty Document',
          description: 'AC unit warranty and manual',
          location: 'Office',
          media_url: 'https://example.com/warranty.pdf',
          media_type: 'document',
          metadata: { expires: '2026-12-31' },
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 259200000).toISOString()
        }
      ];

      setProperty(mockProperty);
      setItems(mockItems);
    } catch (err) {
      console.error('Error loading property and items:', err);
      setError('Failed to load property information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle item creation
  const handleCreateItem = async (data: CreateItemData): Promise<void> => {
    try {
      setError(null);
      
      // In a real implementation, this would be an API call
      // For now, we'll simulate creation
      const newItem: Item = {
        id: `item-${Date.now()}`,
        property_id: propertyId,
        name: data.name,
        description: data.description || null,
        location: data.location || null,
        media_url: data.media_url || null,
        media_type: data.media_type || null,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setItems(prev => [newItem, ...prev]);
      setShowCreateForm(false);
      setSuccess(`Item "${data.name}" has been created successfully!`);
    } catch (err) {
      console.error('Error creating item:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item';
      setError(errorMessage);
      throw err; // Re-throw to let the form handle it
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (itemId: string, itemName: string): Promise<void> => {
    try {
      setError(null);
      
      // In a real implementation, this would be an API call
      // For now, we'll simulate deletion
      setItems(prev => prev.filter(item => item.id !== itemId));
      setSuccess(`Item "${itemName}" has been deleted successfully.`);
    } catch (err) {
      console.error('Error deleting item:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
      throw err; // Re-throw to let the list handle it
    }
  };

  // Handle form cancellation
  const handleCancelCreate = (): void => {
    setShowCreateForm(false);
    setError(null);
  };

  // Handle refresh
  const handleRefresh = (): void => {
    loadPropertyAndItems();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                href="/properties"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Properties
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  {property?.name || 'Loading...'}
                </span>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-900 md:ml-2">Items</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Items for {property?.name}
            </h1>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {property?.address || 'No address provided'}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {items.length} items
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showCreateForm ? 'Cancel' : 'Add Item'}
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccess(null)}
                  className="inline-flex text-green-400 hover:text-green-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Create Item Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">Add New Item</h2>
              <p className="text-sm text-gray-500">
                Add an item to {property?.name} and manage it with QR codes.
              </p>
            </div>
                         <ItemForm
               propertyId={propertyId}
               onSubmit={handleCreateItem as (data: CreateItemData | import('@/types/item').UpdateItemData) => Promise<void>}
               onCancel={handleCancelCreate}
               submitButtonText="Create Item"
             />
          </div>
        )}

        {/* Items List */}
        <ItemList
          items={items}
          propertyId={propertyId}
          loading={loading}
          onDeleteItem={handleDeleteItem}
          onRefresh={handleRefresh}
        />

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href={`/properties/${propertyId}`}
              className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Property Details</p>
                <p className="text-sm text-gray-500">View property information</p>
              </div>
            </Link>
            
            <button
              onClick={() => router.push(`/qr/batch/${propertyId}`)}
              className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="h-8 w-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Generate QR Codes</p>
                <p className="text-sm text-gray-500">Bulk generate for all items</p>
              </div>
            </button>
            
            <Link
              href="/properties"
              className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="h-8 w-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">All Properties</p>
                <p className="text-sm text-gray-500">Go back to properties list</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Item Management Tips</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Add detailed descriptions to help identify items quickly</li>
                                     <li>Use specific locations (e.g., &quot;Kitchen - Upper Cabinet&quot; instead of just &quot;Kitchen&quot;)</li>
                  <li>Upload media URLs to attach photos or documents to your items</li>
                  <li>Generate QR codes to easily access item information when scanning</li>
                  <li>Use the edit function to update item information as needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}