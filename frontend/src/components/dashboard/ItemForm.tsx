'use client';

import React, { useState } from 'react';
import { Item, CreateItemData, UpdateItemData } from '@/types/item';

interface ItemFormProps {
  item?: Item; // For editing existing item
  propertyId: string;
  onSubmit: (data: CreateItemData | UpdateItemData) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  location: string;
  media_url: string;
  media_type: Item['media_type'];
  metadata: Record<string, unknown>;
}

interface FormErrors {
  name?: string;
  description?: string;
  location?: string;
  media_url?: string;
  media_type?: string;
  general?: string;
}

// Common location suggestions for properties
const LOCATION_SUGGESTIONS = [
  'Living Room',
  'Kitchen',
  'Bedroom',
  'Bathroom',
  'Office',
  'Garage',
  'Basement',
  'Attic',
  'Storage Room',
  'Laundry Room',
  'Dining Room',
  'Guest Room',
  'Balcony',
  'Patio',
  'Garden',
  'Entrance',
  'Hallway',
  'Closet',
  'Pantry',
  'Workshop'
];

export default function ItemForm({
  item,
  propertyId,
  onSubmit,
  onCancel,
  submitButtonText = 'Create Item',
  isLoading = false
}: ItemFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    name: item?.name || '',
    description: item?.description || '',
    location: item?.location || '',
    media_url: item?.media_url || '',
    media_type: item?.media_type || null,
    metadata: item?.metadata || {}
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState<boolean>(false);
  const [filteredLocationSuggestions, setFilteredLocationSuggestions] = useState<string[]>([]);

  // Media type options
  const mediaTypes: Array<{ value: Item['media_type']; label: string; description: string }> = [
    { value: null, label: 'No Media', description: 'Item without media attachment' },
    { value: 'image', label: 'Image', description: 'Photos, screenshots, diagrams' },
    { value: 'video', label: 'Video', description: 'Video files, recordings' },
    { value: 'document', label: 'Document', description: 'PDFs, manuals, receipts' },
    { value: 'audio', label: 'Audio', description: 'Audio files, recordings' },
    { value: 'other', label: 'Other', description: 'Other file types' }
  ];

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Item name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Item name must be less than 100 characters';
    }

    // Description validation (optional but with length limits)
    if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Location validation (optional but with length limits)
    if (formData.location.trim().length > 100) {
      newErrors.location = 'Location must be less than 100 characters';
    }

    // Media URL validation (optional but must be valid URL if provided)
    if (formData.media_url.trim()) {
      try {
        new URL(formData.media_url.trim());
      } catch {
        newErrors.media_url = 'Please enter a valid URL';
      }
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

    // Handle location suggestions
    if (field === 'location') {
      if (value.trim().length > 0) {
        const filtered = LOCATION_SUGGESTIONS.filter(suggestion =>
          suggestion.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredLocationSuggestions(filtered);
        setShowLocationSuggestions(true);
      } else {
        setShowLocationSuggestions(false);
      }
    }
  };

  // Handle location suggestion selection
  const handleLocationSelect = (location: string): void => {
    setFormData(prev => ({ ...prev, location }));
    setShowLocationSuggestions(false);
    setErrors(prev => ({ ...prev, location: undefined }));
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
      const submissionData: CreateItemData | UpdateItemData = {
        name: formData.name.trim(),
        ...(formData.description.trim() && { description: formData.description.trim() }),
        ...(formData.location.trim() && { location: formData.location.trim() }),
        ...(formData.media_url.trim() && { media_url: formData.media_url.trim() }),
        ...(formData.media_type && { media_type: formData.media_type }),
        ...(Object.keys(formData.metadata).length > 0 && { metadata: formData.metadata })
      };

      // Add property_id for creation
      if (!item) {
        (submissionData as CreateItemData).property_id = propertyId;
      }

      await onSubmit(submissionData);
      
      // If successful and this is a create form, reset the form
      if (!item) {
        setFormData({
          name: '',
          description: '',
          location: '',
          media_url: '',
          media_type: null,
          metadata: {}
        });
      }
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save item';
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

        {/* Item Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Item Name *
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
              placeholder="Enter item name"
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name}</p>
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
              placeholder="Enter item description (optional)"
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

        {/* Location with Suggestions */}
        <div className="relative">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <div className="mt-1">
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange('location')}
              onFocus={() => {
                if (formData.location.trim().length > 0) {
                  const filtered = LOCATION_SUGGESTIONS.filter(suggestion =>
                    suggestion.toLowerCase().includes(formData.location.toLowerCase())
                  );
                  setFilteredLocationSuggestions(filtered);
                  setShowLocationSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow for selection
                setTimeout(() => setShowLocationSuggestions(false), 200);
              }}
              disabled={isFormDisabled}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.location
                  ? 'border-red-300 text-red-900 placeholder-red-300'
                  : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Enter location (e.g., Living Room, Kitchen)"
              maxLength={100}
            />
            
            {/* Location Suggestions Dropdown */}
            {showLocationSuggestions && filteredLocationSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {filteredLocationSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-900"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleLocationSelect(suggestion);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            <div className="mt-1 flex justify-between">
              <div>
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location}</p>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {formData.location.length}/100 characters
              </p>
            </div>
          </div>
        </div>

        {/* Media Type */}
        <div>
          <label htmlFor="media_type" className="block text-sm font-medium text-gray-700">
            Media Type
          </label>
          <div className="mt-1">
            <select
              id="media_type"
              name="media_type"
              value={formData.media_type || ''}
              onChange={handleInputChange('media_type')}
              disabled={isFormDisabled}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.media_type
                  ? 'border-red-300 text-red-900'
                  : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
              {mediaTypes.map(type => (
                <option key={type.value || 'null'} value={type.value || ''}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
            {errors.media_type && (
              <p className="mt-2 text-sm text-red-600">{errors.media_type}</p>
            )}
          </div>
        </div>

        {/* Media URL */}
        <div>
          <label htmlFor="media_url" className="block text-sm font-medium text-gray-700">
            Media URL
          </label>
          <div className="mt-1">
            <input
              id="media_url"
              name="media_url"
              type="url"
              value={formData.media_url}
              onChange={handleInputChange('media_url')}
              disabled={isFormDisabled}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.media_url
                  ? 'border-red-300 text-red-900 placeholder-red-300'
                  : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Enter media URL (optional)"
            />
            {errors.media_url && (
              <p className="mt-2 text-sm text-red-600">{errors.media_url}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Link to photos, documents, or other media related to this item
            </p>
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
                {item ? 'Updating...' : 'Creating...'}
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