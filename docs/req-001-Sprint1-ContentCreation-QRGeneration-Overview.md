# Request #001: Sprint 1 Implementation Overview

**Reference Request**: Request #001 in `docs/gen_requests.md`  
**Sprint**: Sprint 1 - MVP1 Content Creation & QR Generation  
**Story Points**: 42 points  
**Date**: July 2, 2025 19:36 CEST  

---

## Goals Restatement

**Primary Goal**: Implement Sprint 1 to prove the core content creation workflow and QR code generation using hardcoded "Demo User" approach.

**Success Criteria**: Complete value loop: Create property → Add locations → Add items → Generate QR codes → View content page (via direct URL)

**Architecture Foundation**: Build on hybrid Supabase + Node.js/Express stack as defined in `docs/gen_architecture.md`

---

## Sprint 1 User Stories Breakdown

### Content Creation & Management (16 points):
1. **Story 2.1.1: Property Registration** (5 points, Must Have)
   - Host can create property with name and description
   - Property is immediately available for item assignment
   
2. **Story 2.2.1: Property Listing** (3 points, Must Have)
   - All properties displayed in a list with key information
   - Quick actions available for each property
   
3. **Story 3.1.1: Item Registration** (5 points, Must Have)
   - Items can be added to any property with name, description, location
   - Items are immediately available for QR generation
   
4. **Story 3.1.3: Item Location Tracking** (3 points, Should Have)
   - Location can be room or specific area within property
   - Location is displayed to guests

### QR Code Generation (13 points):
5. **Story 4.1.1: Individual QR Code Generation** (8 points, Must Have)
   - Each QR code has unique UUID identifier
   - Generated codes are immediately functional
   - Generation process under 3 seconds
   
6. **Story 4.2.1: QR Code to Item Mapping** (5 points, Must Have)
   - Each QR code maps to exactly one item
   - Mappings maintained in database with integrity verification

### Content Display (13 points):
7. **Story 6.1.1: Dynamic Content Page Generation** (8 points, Must Have)
   - Pages generated dynamically from QR scans
   - Content loads within 3 seconds, works without registration
   - Content formatted for mobile with item name and description

8. **Story 3.2.3: Item Deletion** (5 points, Must Have)
   - Items can be deleted with confirmation
   - Associated QR codes are deactivated
   - Soft delete preserves data for recovery

---

## Implementation Order & Dependencies

### Phase 1: Foundation Setup (Dependencies: None)
1. **Project Structure & Tech Stack Setup**
   - Initialize Node.js/Express backend
   - Initialize React/Next.js frontend
   - Configure Supabase connection
   - Set up development environment

2. **Database Schema Creation**
   - Create Properties table
   - Create Items table
   - Create QR_Codes table
   - Set up initial hardcoded "Demo User"

### Phase 2: Backend API Development (Dependencies: Phase 1)
3. **Property Management API**
   - Property registration endpoints
   - Property listing endpoints
   - Basic validation and error handling

4. **Item Management API**
   - Item registration endpoints
   - Item location tracking
   - Item deletion endpoints

5. **QR Code Generation System**
   - QR code generation service
   - QR code to item mapping
   - UUID generation and validation

### Phase 3: Frontend Development (Dependencies: Phase 2)
6. **Property Management UI**
   - Property creation forms
   - Property listing views
   - Basic dashboard layout

7. **Item Management UI**
   - Item creation forms
   - Item listing and location management
   - Item deletion confirmation

8. **QR Code Management UI**
   - QR code generation interface
   - QR code download functionality

### Phase 4: Guest Experience (Dependencies: Phases 1-3)
9. **Dynamic Content Pages**
   - QR code scanning validation
   - Content page generation
   - Mobile-responsive display
   - Error handling for invalid codes

### Phase 5: Integration & Testing (Dependencies: All phases)
10. **End-to-End Integration**
    - Complete workflow testing
    - Mobile testing and optimization
    - Performance optimization
    - Bug fixes and polish

---

## Authorized Files and Functions for Modification

### Backend Files (Node.js/Express)

#### Core Application Files:
- **`server.js`** - Main Express application entry point
  - `app.listen()` - Server startup
  - Middleware configuration
  - Route registration

- **`config/database.js`** - Supabase connection configuration
  - `createClient()` - Supabase client initialization
  - Environment variable management

#### API Route Files:
- **`routes/properties.js`** - Property management routes
  - `POST /api/properties` - Create property
  - `GET /api/properties` - List properties

- **`routes/items.js`** - Item management routes  
  - `POST /api/items` - Create item
  - `GET /api/items/:propertyId` - List items
  - `DELETE /api/items/:id` - Delete item

- **`routes/qr-codes.js`** - QR code management routes
  - `POST /api/qr-codes/items/:id` - Generate QR code
  - `GET /api/qr-codes/:qrId` - Validate and get content

#### Controller Files:
- **`controllers/propertyController.js`**
  - `createProperty()` - Property creation logic
  - `getProperties()` - Property listing logic

- **`controllers/itemController.js`**
  - `createItem()` - Item creation logic
  - `getItems()` - Item listing logic
  - `deleteItem()` - Item deletion logic

- **`controllers/qrController.js`**
  - `generateQRCode()` - QR code generation logic
  - `validateQRCode()` - QR code validation logic

#### Service Files:
- **`services/qrService.js`** - QR code generation service
  - `generateUniqueId()` - UUID generation
  - `createQRCode()` - QR code image generation
  - `saveQRMapping()` - Database mapping storage

- **`services/supabaseService.js`** - Database service layer
  - `query()` - Generic database query method
  - `insert()` - Data insertion methods
  - `update()` - Data update methods
  - `delete()` - Data deletion methods

### Frontend Files (React/Next.js)

#### Main Application Files:
- **`pages/_app.tsx`** - Next.js app configuration
- **`pages/index.tsx`** - Dashboard home page

#### Property Management Pages:
- **`pages/properties/index.tsx`** - Property listing page
- **`pages/properties/new.tsx`** - Property creation page

#### Item Management Pages:
- **`pages/items/[propertyId].tsx`** - Items listing page
- **`pages/items/new/[propertyId].tsx`** - Item creation page

#### QR Code Pages:
- **`pages/qr/generate/[itemId].tsx`** - QR generation page

#### Guest Experience Pages:
- **`pages/content/[qrId].tsx`** - Dynamic content page

#### Component Files:
- **`components/dashboard/PropertyList.tsx`**
- **`components/dashboard/PropertyForm.tsx`**
- **`components/dashboard/ItemList.tsx`**
- **`components/dashboard/ItemForm.tsx`**
- **`components/dashboard/QRGenerator.tsx`**
- **`components/guest/ContentPage.tsx`**
- **`components/shared/Layout.tsx`**

#### API Client Files:
- **`lib/api/properties.ts`** - Property API client functions
- **`lib/api/items.ts`** - Item API client functions
- **`lib/api/qrCodes.ts`** - QR code API client functions

### Configuration Files:
- **`package.json`** - Dependencies and scripts
- **`.env.local`** - Environment variables
- **`tailwind.config.js`** - Styling configuration

### Database Files:
- **`migrations/001_initial_schema.sql`** - Database schema
- **`migrations/002_demo_user_data.sql`** - Demo data

---

**Implementation Priority**: High  
**Dependencies**: Supabase project setup required  
**Estimated Duration**: 2-3 weeks for 42 story points  

---

*Document Created*: July 2, 2025 19:36 CEST  
*Reference*: `docs/gen_requests.md` Request #001 