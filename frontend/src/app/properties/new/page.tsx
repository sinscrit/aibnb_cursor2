'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PropertyForm from '@/components/dashboard/PropertyForm';
import { CreatePropertyData } from '@/types/property';
import { createProperty } from '@/lib/api/properties';

export default function NewPropertyPage(): React.JSX.Element {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle property creation
  const handleSubmit = async (formData: CreatePropertyData | Partial<CreatePropertyData>): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validate required fields for creation
      if (!formData.name || !formData.property_type) {
        throw new Error('Name and property type are required');
      }

      // Type assertion since we've validated required fields
      const createData = formData as CreatePropertyData;

      const createdProperty = await createProperty(createData);
      setSuccessMessage(`Property "${createdProperty.name}" created successfully!`);
      
      // Redirect to properties list after a short delay to show success message
      setTimeout(() => {
        router.push('/properties');
      }, 2000);
    } catch (err: unknown) {
      console.error('Property creation error:', err);
      
      // Extract error message from API response
      let errorMessage = 'Failed to create property. Please try again.';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      } else if (err && typeof err === 'object' && 'details' in err) {
        const details = (err as { details: Record<string, unknown> }).details;
        if (details?.message && typeof details.message === 'string') {
          errorMessage = details.message;
        }
      }
      
      setError(errorMessage);
      
      // Re-throw for PropertyForm to handle
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel action
  const handleCancel = (): void => {
    router.push('/properties');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link 
              href="/properties" 
              className="hover:text-gray-700 transition-colors duration-200"
            >
              Properties
            </Link>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">Create New Property</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Property</h1>
              <p className="mt-2 text-gray-600">
                Add a new property to your portfolio to start managing items and generating QR codes.
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Properties
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
                <p className="text-xs text-green-600 mt-1">Redirecting to properties list...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Property Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <PropertyForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitButtonText="Create Property"
              isLoading={isSubmitting}
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">Getting Started</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>After creating your property, you&apos;ll be able to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Add items to your property inventory</li>
                  <li>Generate QR codes for individual items</li>
                  <li>Track item locations and details</li>
                  <li>Manage property settings and information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-6">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-900">Tips for Success</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="space-y-1">
                  <li>• Choose a descriptive name that helps you identify the property</li>
                  <li>• Include a complete address for better organization</li>
                  <li>• Select the most appropriate property type</li>
                  <li>• Add a detailed description to provide context for future reference</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}