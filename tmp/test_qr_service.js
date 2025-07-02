#!/usr/bin/env node

/**
 * Test Script: QR Generation Service
 * Purpose: Validates QR code generation functionality
 * Step: Task 27 - Create QR Generation Service
 */

const path = require('path');

// Mock logger and database services for testing
global.logger = {
    info: (...args) => console.log('INFO:', ...args),
    warn: (...args) => console.warn('WARN:', ...args),
    error: (...args) => console.error('ERROR:', ...args)
};

// Mock QR code data access
const mockQRCodeDataAccess = {
    async getQRCodesForItem(itemId, userId) {
        console.log(`Mock: Getting QR codes for item ${itemId}`);
        return { success: true, data: [] }; // No existing QR codes
    },
    
    async getQRCodeByQRId(qrId) {
        console.log(`Mock: Getting QR code by ID ${qrId}`);
        return { success: false, data: null }; // QR ID doesn't exist (unique)
    },
    
    async createQRCode(itemId, userId, options) {
        console.log(`Mock: Creating QR code record for item ${itemId}`);
        return {
            success: true,
            data: {
                id: 'mock-uuid-1',
                qr_id: options.customQRId,
                item_id: itemId,
                user_id: userId,
                status: options.status || 'active',
                created_at: new Date().toISOString()
            }
        };
    },
    
    async updateQRCode(qrId, updates, userId) {
        console.log(`Mock: Updating QR code ${qrId} with:`, updates);
        return { success: true, data: { ...updates, updated_at: new Date().toISOString() } };
    },
    
    async deleteQRCode(qrId, userId, hardDelete) {
        console.log(`Mock: Deleting QR code ${qrId}, hard: ${hardDelete}`);
        return { success: true, data: { deleted: true } };
    },
    
    async getQRCodeAnalytics() {
        console.log('Mock: Getting QR code analytics');
        return {
            success: true,
            data: {
                total: 5,
                byStatus: { active: 3, inactive: 1, deleted: 1 },
                totalScans: 42
            }
        };
    }
};

// Override the module resolution for testing
const originalRequire = require;
require = (id) => {
    if (id === '../config/logger') {
        return global.logger;
    }
    if (id === './qrCodeDataAccess') {
        return mockQRCodeDataAccess;
    }
    return originalRequire(id);
};

async function runTests() {
    console.log('🧪 Testing QR Generation Service...\n');
    
    try {
        // Import the service after setting up mocks
        const qrService = originalRequire('../backend/services/qrService');
        
        console.log('✅ QR Service imported successfully\n');
        
        // Test 1: Service initialization
        console.log('📋 Test 1: Service initialization');
        const initResult = await qrService.initialize();
        console.log('Init result:', initResult);
        console.log('');
        
        // Test 2: Generate unique ID
        console.log('📋 Test 2: Generate unique QR ID');
        const mockItemId = 'item-12345678-abcd-efgh';
        const qrId1 = qrService.generateUniqueId(mockItemId);
        const qrId2 = qrService.generateUniqueId(mockItemId);
        console.log('QR ID 1:', qrId1);
        console.log('QR ID 2:', qrId2);
        console.log('IDs are unique:', qrId1 !== qrId2);
        console.log('');
        
        // Test 3: Generate QR URL
        console.log('📋 Test 3: Generate QR URL');
        const qrUrl = qrService.generateQRUrl(qrId1);
        console.log('QR URL:', qrUrl);
        console.log('');
        
        // Test 4: Create QR code image
        console.log('📋 Test 4: Create QR code image');
        const imageResult = await qrService.createQRCode(qrId1);
        console.log('Image creation result:', {
            success: imageResult.success,
            filename: imageResult.filename,
            fileSize: imageResult.fileSize,
            generationTime: imageResult.generationTime + 'ms'
        });
        console.log('');
        
        // Test 5: Generate QR code for item (full workflow)
        console.log('📋 Test 5: Generate QR code for item (full workflow)');
        const fullResult = await qrService.generateQRCodeForItem(
            mockItemId, 
            'user-123',
            { allowMultiple: true }
        );
        console.log('Full generation result:', {
            success: fullResult.success,
            message: fullResult.message,
            qrId: fullResult.data?.qr_id,
            filename: fullResult.imageInfo?.filename,
            totalTime: fullResult.generationTime + 'ms'
        });
        console.log('');
        
        // Test 6: Health check
        console.log('📋 Test 6: Health check');
        const healthResult = await qrService.healthCheck();
        console.log('Health check result:', {
            healthy: healthResult.healthy,
            checks: healthResult.checks
        });
        console.log('');
        
        // Test 7: Get statistics
        console.log('📋 Test 7: Get statistics');
        const statsResult = await qrService.getStatistics();
        console.log('Statistics result:', {
            success: statsResult.success,
            totalFiles: statsResult.data?.files?.totalFiles,
            databaseStats: statsResult.data?.database
        });
        console.log('');
        
        console.log('🎉 All QR Service tests completed successfully!');
        
        return {
            success: true,
            testsRun: 7,
            serviceHealthy: healthResult.healthy
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().then(result => {
        console.log('\n📊 TEST SUMMARY:');
        console.log('Success:', result.success);
        console.log('Tests run:', result.testsRun || 'N/A');
        console.log('Service healthy:', result.serviceHealthy || 'N/A');
        
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests };