-- Migration 001: Initial Schema - Properties Table
-- Date: July 2, 2025
-- Description: Create initial database schema for property management system

-- Enable UUID extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    -- Primary key with UUID
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User identification (for multi-tenant support)
    user_id UUID NOT NULL,
    
    -- Basic property information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    
    -- Property type enumeration
    property_type VARCHAR(50) NOT NULL DEFAULT 'residential',
    
    -- JSON column for flexible settings storage
    settings JSONB DEFAULT '{}',
    
    -- Timestamps for audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints
ALTER TABLE properties
ADD CONSTRAINT properties_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT properties_property_type_valid CHECK (
    property_type IN ('residential', 'commercial', 'industrial', 'mixed_use', 'other')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(name);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for properties table
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE properties IS 'Stores property information for the property management system';
COMMENT ON COLUMN properties.id IS 'Unique identifier for the property (UUID)';
COMMENT ON COLUMN properties.user_id IS 'ID of the user who owns this property';
COMMENT ON COLUMN properties.name IS 'Display name of the property';
COMMENT ON COLUMN properties.description IS 'Detailed description of the property';
COMMENT ON COLUMN properties.address IS 'Physical address of the property';
COMMENT ON COLUMN properties.property_type IS 'Type of property (residential, commercial, etc.)';
COMMENT ON COLUMN properties.settings IS 'JSON object for property-specific settings and preferences';
COMMENT ON COLUMN properties.created_at IS 'Timestamp when the property record was created';
COMMENT ON COLUMN properties.updated_at IS 'Timestamp when the property record was last updated';

-- ============================================================================
-- ITEMS TABLE SCHEMA (Task 12)
-- ============================================================================

-- Create items table with foreign key relationship to properties
CREATE TABLE IF NOT EXISTS items (
    -- Primary key with UUID
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key relationship to properties table
    property_id UUID NOT NULL,
    
    -- Basic item information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(500), -- Room, floor, specific location within property
    
    -- Media storage
    media_url TEXT, -- URL to image/video of the item
    media_type VARCHAR(50) DEFAULT 'image', -- 'image', 'video', 'document', etc.
    
    -- Flexible metadata storage for item-specific data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps for audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint with cascading delete
    CONSTRAINT fk_items_property_id 
        FOREIGN KEY (property_id) 
        REFERENCES properties(id) 
        ON DELETE CASCADE
);

-- Add constraints for items table
ALTER TABLE items
ADD CONSTRAINT items_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT items_media_type_valid CHECK (
    media_type IN ('image', 'video', 'document', 'audio', 'other')
);

-- Create indexes for performance on items table
CREATE INDEX IF NOT EXISTS idx_items_property_id ON items(property_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_location ON items(location);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_media_type ON items(media_type);

-- Create trigger for items table updated_at
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for items table documentation
COMMENT ON TABLE items IS 'Stores individual items/inventory within properties';
COMMENT ON COLUMN items.id IS 'Unique identifier for the item (UUID)';
COMMENT ON COLUMN items.property_id IS 'Reference to the property this item belongs to';
COMMENT ON COLUMN items.name IS 'Display name of the item';
COMMENT ON COLUMN items.description IS 'Detailed description of the item';
COMMENT ON COLUMN items.location IS 'Specific location of the item within the property';
COMMENT ON COLUMN items.media_url IS 'URL to media file (image, video, etc.) of the item';
COMMENT ON COLUMN items.media_type IS 'Type of media file (image, video, document, etc.)';
COMMENT ON COLUMN items.metadata IS 'JSON object for item-specific metadata and custom fields';
COMMENT ON COLUMN items.created_at IS 'Timestamp when the item record was created';
COMMENT ON COLUMN items.updated_at IS 'Timestamp when the item record was last updated';

-- ============================================================================
-- QR CODES TABLE SCHEMA (Task 13)
-- ============================================================================

-- Create qr_codes table with foreign key relationship to items
CREATE TABLE IF NOT EXISTS qr_codes (
    -- Primary key with UUID
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key relationship to items table
    item_id UUID NOT NULL,
    
    -- Unique QR code identifier (the actual code that gets scanned)
    qr_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- QR code status
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    
    -- Analytics and tracking
    scan_count INTEGER DEFAULT 0,
    last_scanned TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps for audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint with cascading delete
    CONSTRAINT fk_qr_codes_item_id 
        FOREIGN KEY (item_id) 
        REFERENCES items(id) 
        ON DELETE CASCADE
);

-- Add constraints for qr_codes table
ALTER TABLE qr_codes
ADD CONSTRAINT qr_codes_qr_id_not_empty CHECK (length(trim(qr_id)) > 0),
ADD CONSTRAINT qr_codes_status_valid CHECK (
    status IN ('active', 'inactive', 'expired', 'deleted')
),
ADD CONSTRAINT qr_codes_scan_count_non_negative CHECK (scan_count >= 0);

-- Create indexes for performance on qr_codes table
CREATE INDEX IF NOT EXISTS idx_qr_codes_item_id ON qr_codes(item_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_id ON qr_codes(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON qr_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_last_scanned ON qr_codes(last_scanned);

-- Create trigger for qr_codes table updated_at
CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for qr_codes table documentation
COMMENT ON TABLE qr_codes IS 'Stores QR codes generated for items with tracking and analytics';
COMMENT ON COLUMN qr_codes.id IS 'Unique identifier for the QR code record (UUID)';
COMMENT ON COLUMN qr_codes.item_id IS 'Reference to the item this QR code belongs to';
COMMENT ON COLUMN qr_codes.qr_id IS 'Unique QR code identifier that gets encoded in the QR image';
COMMENT ON COLUMN qr_codes.status IS 'Current status of the QR code (active, inactive, expired, deleted)';
COMMENT ON COLUMN qr_codes.scan_count IS 'Number of times this QR code has been scanned';
COMMENT ON COLUMN qr_codes.last_scanned IS 'Timestamp of the most recent scan';
COMMENT ON COLUMN qr_codes.created_at IS 'Timestamp when the QR code record was created';
COMMENT ON COLUMN qr_codes.updated_at IS 'Timestamp when the QR code record was last updated';