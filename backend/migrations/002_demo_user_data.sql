-- Migration 002: Demo User Data
-- Date: July 2, 2025
-- Description: Insert hardcoded demo user with sample property/item data for testing

-- ============================================================================
-- DEMO USER DATA (Task 14)
-- ============================================================================

-- Insert demo user with fixed UUID for consistent testing
-- This user will be used for all demo properties and items
INSERT INTO properties (
    id,
    user_id,
    name,
    description,
    address,
    property_type,
    settings
) VALUES (
    '11111111-1111-1111-1111-111111111111', -- Fixed property UUID for demo
    '00000000-0000-0000-0000-000000000000', -- Fixed demo user UUID
    'Demo Apartment Building',
    'A modern apartment building for demonstration purposes. This property contains various items across different units to showcase the inventory management capabilities.',
    '123 Demo Street, Test City, TC 12345',
    'residential',
    '{
        "timezone": "UTC",
        "currency": "USD",
        "notifications": {
            "email": true,
            "qr_scans": true
        },
        "features": {
            "qr_generation": true,
            "analytics": true,
            "media_upload": true
        }
    }'::jsonb
);

-- Insert second demo property - Commercial Property
INSERT INTO properties (
    id,
    user_id,
    name,
    description,
    address,
    property_type,
    settings
) VALUES (
    '22222222-2222-2222-2222-222222222222', -- Fixed property UUID for demo
    '00000000-0000-0000-0000-000000000000', -- Same demo user UUID
    'Demo Office Complex',
    'A small office complex with shared amenities and office equipment to demonstrate commercial property management.',
    '456 Business Ave, Corporate District, CD 67890',
    'commercial',
    '{
        "timezone": "UTC",
        "currency": "USD",
        "business_hours": {
            "monday": "9:00-17:00",
            "tuesday": "9:00-17:00",
            "wednesday": "9:00-17:00",
            "thursday": "9:00-17:00",
            "friday": "9:00-17:00"
        },
        "features": {
            "qr_generation": true,
            "analytics": true,
            "security_tracking": true
        }
    }'::jsonb
);

-- ============================================================================
-- DEMO ITEMS DATA
-- ============================================================================

-- Residential Property Items (Apartment Building)
INSERT INTO items (
    id,
    property_id,
    name,
    description,
    location,
    media_type,
    metadata
) VALUES 
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Refrigerator - Kitchen Unit 1A',
        'Samsung stainless steel refrigerator with ice maker. Energy Star certified. Model: RF263BEAESR',
        'Unit 1A - Kitchen',
        'image',
        '{
            "brand": "Samsung",
            "model": "RF263BEAESR",
            "serial_number": "12345ABCDE",
            "purchase_date": "2023-03-15",
            "warranty_expires": "2025-03-15",
            "energy_rating": "Energy Star",
            "condition": "excellent",
            "value": 1200
        }'::jsonb
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '11111111-1111-1111-1111-111111111111',
        'Washing Machine - Laundry Unit 1A',
        'LG front-loading washing machine with smart capabilities and WiFi connectivity.',
        'Unit 1A - Laundry Room',
        'image',
        '{
            "brand": "LG",
            "model": "WM3900HBA",
            "serial_number": "LG789XYZ",
            "purchase_date": "2023-06-20",
            "warranty_expires": "2024-06-20",
            "features": ["WiFi", "Smart Diagnosis", "Steam Clean"],
            "condition": "good",
            "value": 800
        }'::jsonb
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '11111111-1111-1111-1111-111111111111',
        'Air Conditioning Unit - Living Room 2B',
        'Mitsubishi mini-split AC unit with remote control and energy efficient operation.',
        'Unit 2B - Living Room',
        'image',
        '{
            "brand": "Mitsubishi",
            "model": "MSZ-FH12NA",
            "serial_number": "MIT456DEF",
            "installation_date": "2022-05-10",
            "last_service": "2024-04-15",
            "btu": 12000,
            "condition": "excellent",
            "value": 1500
        }'::jsonb
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '11111111-1111-1111-1111-111111111111',
        'Security Camera - Main Entrance',
        'Hikvision IP security camera with night vision and motion detection capabilities.',
        'Building - Main Entrance',
        'image',
        '{
            "brand": "Hikvision",
            "model": "DS-2CD2347G1-LU",
            "serial_number": "HIK123GHI",
            "installation_date": "2023-01-08",
            "resolution": "4MP",
            "features": ["Night Vision", "Motion Detection", "Audio Recording"],
            "condition": "excellent",
            "value": 300
        }'::jsonb
    );

-- Commercial Property Items (Office Complex)
INSERT INTO items (
    id,
    property_id,
    name,
    description,
    location,
    media_type,
    metadata
) VALUES 
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        '22222222-2222-2222-2222-222222222222',
        'Conference Room Projector',
        'Epson PowerLite professional projector with wireless connectivity for presentations.',
        'Conference Room A',
        'image',
        '{
            "brand": "Epson",
            "model": "PowerLite 2250U",
            "serial_number": "EPS901JKL",
            "purchase_date": "2023-08-12",
            "warranty_expires": "2026-08-12",
            "resolution": "1920x1080",
            "lumens": 5000,
            "condition": "excellent",
            "value": 2200
        }'::jsonb
    ),
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        '22222222-2222-2222-2222-222222222222',
        'Office Printer - Canon ImageRunner',
        'Canon multifunction printer with scanning, copying, and faxing capabilities.',
        'Office Suite 101',
        'image',
        '{
            "brand": "Canon",
            "model": "ImageRunner ADVANCE C3530i",
            "serial_number": "CAN234MNO",
            "purchase_date": "2023-02-28",
            "lease_expires": "2026-02-28",
            "features": ["Print", "Scan", "Copy", "Fax", "Duplex"],
            "monthly_volume": 5000,
            "condition": "good",
            "value": 8500
        }'::jsonb
    ),
    (
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
        '22222222-2222-2222-2222-222222222222',
        'Break Room Coffee Machine',
        'Commercial Keurig coffee machine for office break room with multiple pod options.',
        'Break Room',
        'image',
        '{
            "brand": "Keurig",
            "model": "K-3500",
            "serial_number": "KEU567PQR",
            "purchase_date": "2023-09-05",
            "warranty_expires": "2024-09-05",
            "capacity": "12 cups",
            "features": ["Touchscreen", "Multiple Sizes", "Strong Brew"],
            "condition": "excellent",
            "value": 450
        }'::jsonb
    );

-- Add demo QR codes for some items (these would normally be generated by the application)
INSERT INTO qr_codes (
    id,
    item_id,
    qr_id,
    status,
    scan_count,
    last_scanned
) VALUES 
    (
        'qr111111-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'DEMO-FRIDGE-1A-001',
        'active',
        3,
        '2025-07-01 10:30:00+00'
    ),
    (
        'qr222222-2222-2222-2222-222222222222',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'DEMO-PROJ-CONF-A-001',
        'active',
        1,
        '2025-07-02 14:15:00+00'
    ),
    (
        'qr333333-3333-3333-3333-333333333333',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'DEMO-AC-2B-001',
        'active',
        0,
        NULL
    );

-- Add comment for documentation
COMMENT ON TABLE properties IS 'Properties table - includes demo data for user 00000000-0000-0000-0000-000000000000';
COMMENT ON TABLE items IS 'Items table - includes demo data linked to demo properties';
COMMENT ON TABLE qr_codes IS 'QR codes table - includes demo QR codes for testing scan functionality';