# Property Management System - Use Cases

## UC001: Property Creation and Management
**Description**: Property managers can create, view, edit, and delete properties in the system
**Actors**: Property Manager, System Administrator
**Preconditions**: User must be authenticated
**Flow**:
1. User navigates to Properties page
2. User clicks "Add Property" 
3. User fills in property details (name, type, description, address)
4. System validates input and creates property
5. Property appears in the properties list
**Postconditions**: Property is stored in database and accessible for item management
**Reference**: Task 31-34 (Property Management UI)

## UC002: Item Inventory Management  
**Description**: Users can add, edit, and remove items from properties with detailed information
**Actors**: Property Manager, Tenant
**Preconditions**: Property must exist, user must have access
**Flow**:
1. User selects a property
2. User navigates to Items section
3. User adds new item with name, description, location, media type, and optional media URL
4. System validates and stores item information
5. Item appears in the property's item list
**Postconditions**: Item is linked to property and available for QR code generation
**Reference**: Task 35-38 (Item Management UI)

## UC003: QR Code Generation for Items
**Description**: Users can generate QR codes for items to enable easy identification and sharing
**Actors**: Property Manager, Tenant
**Preconditions**: Item must exist in the system
**Flow**:
1. User selects an item from the item list
2. User clicks "Generate QR" or navigates to QR generation page
3. User optionally provides custom QR ID
4. System generates unique QR code with embedded item information
5. QR code is displayed with preview and download options
**Postconditions**: QR code is linked to item and available for download
**Reference**: Task 39-40 (QR Generation UI)

## UC004: QR Code Download and Distribution
**Description**: Users can download QR codes in various formats for printing and distribution
**Actors**: Property Manager, Tenant
**Preconditions**: QR code must be generated for an item
**Flow**:
1. User views item with existing QR code
2. User clicks "Download" button
3. System generates QR code image file
4. File is downloaded to user's device
5. User can print and attach QR code to physical item
**Postconditions**: QR code is available offline for physical attachment
**Reference**: Task 41 (QR API Integration)

## UC005: QR Code Scanning and Item Lookup
**Description**: Anyone can scan QR codes to view item information and details
**Actors**: General Public, Property Visitor, Maintenance Staff
**Preconditions**: QR code must be active and accessible
**Flow**:
1. User scans QR code using mobile device
2. System validates QR code and retrieves item information
3. System displays item details (name, description, location, property info)
4. System records scan event for analytics
5. User can view additional item media if available
**Postconditions**: Scan is logged, user has access to item information
**Reference**: Task 21 (QR Controller), Task 41 (QR API)

## UC006: QR Code Management and Regeneration
**Description**: Users can manage existing QR codes, regenerate new ones, and track usage
**Actors**: Property Manager
**Preconditions**: Item must exist with or without existing QR codes
**Flow**:
1. User views item list with QR code status indicators
2. User can see active/inactive QR code counts
3. User can regenerate new QR codes for items
4. User can download existing QR codes
5. System maintains history of all QR codes per item
**Postconditions**: QR codes are managed efficiently with full audit trail
**Reference**: Task 42 (QR Management Integration)

## UC007: Property and Item Statistics
**Description**: Users can view comprehensive statistics about their properties and items
**Actors**: Property Manager, System Administrator
**Preconditions**: Properties and items must exist in system
**Flow**:
1. User navigates to statistics/analytics section
2. System displays property counts, item distributions, QR code usage
3. User can filter statistics by property, date range, or item type
4. System shows trends and usage patterns
5. User can export statistics for reporting
**Postconditions**: Users have insights into system usage and inventory management
**Reference**: Task 19-21 (API Controllers with statistics endpoints)

## UC008: Multi-Property Item Management
**Description**: Users can manage items across multiple properties with unified interface
**Actors**: Property Manager with multiple properties
**Preconditions**: User must have access to multiple properties
**Flow**:
1. User accesses unified item management interface
2. System displays items from all accessible properties
3. User can filter, search, and sort items across properties
4. User can move items between properties if authorized
5. System maintains property relationships and access control
**Postconditions**: Items are managed efficiently across multiple properties
**Reference**: Task 17-18 (Data Access Layer), Task 38 (Item API Integration)

## UC009: QR Code Analytics and Tracking
**Description**: Property managers can track QR code scan patterns and usage analytics
**Actors**: Property Manager, System Administrator
**Preconditions**: QR codes must be generated and in use
**Flow**:
1. User accesses QR analytics dashboard
2. System displays scan counts, frequency, and geographic patterns
3. User can view scan history by item, QR code, or time period
4. System shows most/least scanned items and trends
5. User can export analytics data for business intelligence
**Postconditions**: Users have insights into QR code effectiveness and item popularity
**Reference**: Task 18 (QR Data Access), Task 21 (QR Analytics endpoints)

## UC010: Bulk Operations and Data Management
**Description**: Users can perform bulk operations on multiple items and QR codes simultaneously
**Actors**: Property Manager, System Administrator
**Preconditions**: Multiple items or QR codes must exist
**Flow**:
1. User selects multiple items from item list
2. User chooses bulk operation (update, delete, generate QR codes)
3. System confirms operation and shows impact preview
4. User confirms bulk operation
5. System processes all selected items and provides status report
**Postconditions**: Bulk operations completed efficiently with comprehensive reporting
**Reference**: Task 38 (Item API), Task 41 (QR API with bulk operations)

---

**Document Updated**: January 4, 2025  
**Total Use Cases**: 10  
**System Coverage**: Complete Sprint 1 MVP functionality  
**Next Version**: Additional use cases for advanced features and integrations