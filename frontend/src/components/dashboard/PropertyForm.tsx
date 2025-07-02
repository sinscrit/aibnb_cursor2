'use client';

import React, { useState } from 'react';
import { Property, CreatePropertyData, UpdatePropertyData } from '@/types/property';

interface PropertyFormProps {
  property?: Property; // For editing existing property
  onSubmit: (data: CreatePropertyData | UpdatePropertyData) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  address: string;
  property_type: Property['property_type'];
  settings: Record<string, unknown>;
}

interface FormErrors {
  name?: string;
  description?: string;
  address?: string;
  property_type?: string;
  general?: string;
}

export default function PropertyForm({
  property,
  onSubmit,
  onCancel,
  submitButtonText = 'Create Property',
  isLoading = false
}: PropertyFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    name: property?.name || '',
    description: property?.description || '',
    address: property?.address || '',
    property_type: property?.property_type || 'house',
    settings: property?.settings || {}
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Property type options
  const propertyTypes: Array<{ value: Property['property_type']; label: string; description: string }> = [
    { value: 'house', label: 'House', description: 'Single-family residential home' },
    { value: 'apartment', label: 'Apartment', description: 'Multi-unit residential building' },
    { value: 'office', label: 'Office', description: 'Commercial office space' },
    { value: 'warehouse', label: 'Warehouse', description: 'Industrial storage facility' },
    { value: 'other', label: 'Other', description: 'Other type of property' }
  ];

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Property name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Property name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Property name must be less than 100 characters';
    }

    // Description validation (optional but with length limits)
    if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Address validation (optional but with length limits)
    if (formData.address.trim().length > 200) {
      newErrors.address = 'Address must be less than 200 characters';
    }

    // Property type validation
    if (!formData.property_type) {
      newErrors.property_type = 'Property type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing (only for fields that can have errors)
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare submission data
      const submissionData: CreatePropertyData | UpdatePropertyData = {
        name: formData.name.trim(),
        property_type: formData.property_type,
        ...(formData.description.trim() && { description: formData.description.trim() }),
        ...(formData.address.trim() && { address: formData.address.trim() }),
        ...(Object.keys(formData.settings).length > 0 && { settings: formData.settings })
      };

      await onSubmit(submissionData);
      
      // If successful and this is a create form, reset the form
      if (!property) {
        setFormData({
          name: '',
          description: '',
          address: '',
          property_type: 'house',
          settings: {}
        });
      }
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save property';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Property Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Property Name *
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={isFormDisabled}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.name
                  ? 'border-red-300 text-red-900 placeholder-red-300'
                  : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Enter property name"
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label htmlFor="property_type" className="block text-sm font-medium text-gray-700">
            Property Type *
          </label>
          <div className="mt-1">
            <select
              id="property_type"
              name="property_type"
              required
              value={formData.property_type}
              onChange={handleInputChange('property_type')}
              disabled={isFormDisabled}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.property_type
                  ? 'border-red-300 text-red-900'
                  : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
              {propertyTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
            {errors.property_type && (
              <p className="mt-2 text-sm text-red-600">{errors.property_type}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange('description')}
              disabled={isFormDisabled}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.description
                  ? 'border-red-300 text-red-900 placeholder-red-300'
                  : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Enter property description (optional)"
              maxLength={500}
            />
            <div className="mt-1 flex justify-between">
              <div>
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <div className="mt-1">
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange('address')}
              disabled={isFormDisabled}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.address
                  ? 'border-red-300 text-red-900 placeholder-red-300'
                  : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Enter property address (optional)"
              maxLength={200}
            />
            <div className="mt-1 flex justify-between">
              <div>
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address}</p>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {formData.address.length}/200 characters
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isFormDisabled}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isFormDisabled}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {property ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </form>
    </div>
  );
}