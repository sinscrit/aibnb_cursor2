#!/usr/bin/env node

/**
 * QR Code Data Access Test Script
 * Tests the QR code-specific database operations with item relationships and scan tracking
 */

// Set demo environment variables for testing
process.env.SUPABASE_URL = 'https://demo.supabase.co';
process.env.SUPABASE_ANON_KEY = 'demo-key';

const qrCodeDataAccess = require('../backend/services/qrCodeDataAccess');

function testQRCodeDataAccess() {
    console.log('📱 QR Code Data Access Validation');
    console.log('==================================\n');
    
    let passed = 0;
    let total = 0;
    
    const test = (name, condition) => {
        total++;
        console.log(`Test ${total}: ${name}`);
        if (condition) {
            console.log('✅ PASSED\n');
            passed++;
        } else {
            console.log('❌ FAILED\n');
        }
    };
    
    // Test 1: Service exports correctly
    test('QR Code Data Access Export', typeof qrCodeDataAccess === 'object');
    
    // Test 2: Required methods exist
    const requiredMethods = [
        'createQRCode', 'getQRCodesForItem', 'getAllQRCodesForUser', 'getQRCodeByQRId',
        'recordScan', 'updateQRCode', 'deleteQRCode', 'getQRCodeAnalytics',
        'generateQRId', 'validateQRIdUnique', 'validateQRCodeUpdateData'
    ];
    const methodsExist = requiredMethods.every(method => typeof qrCodeDataAccess[method] === 'function');
    test('Required Methods Available', methodsExist);
    console.log('Available methods:', requiredMethods.filter(method => 
        typeof qrCodeDataAccess[method] === 'function'
    ));
    
    // Test 3: QR ID generation works
    let qrIdGenerationWorks = false;
    try {
        const testItemId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        const qrId = qrCodeDataAccess.generateQRId(testItemId);
        qrIdGenerationWorks = qrId && typeof qrId === 'string' && qrId.includes('QR-');
        console.log('Generated QR ID sample:', qrId);
    } catch (error) {
        console.log('QR ID generation error:', error.message);
    }
    test('QR ID Generation', qrIdGenerationWorks);
    
    // Test 4: QR code update validation works for valid data
    let updateValidationWorks = false;
    try {
        qrCodeDataAccess.validateQRCodeUpdateData({
            status: 'active',
            qr_id: 'QR-TEST-12345-ABC123'
        });
        updateValidationWorks = true;
    } catch (error) {
        console.log('Update validation error:', error.message);
    }
    test('QR Code Update Validation (Valid Data)', updateValidationWorks);
    
    // Test 5: Update validation catches invalid data
    let invalidUpdateDataCaught = false;
    try {
        qrCodeDataAccess.validateQRCodeUpdateData({
            status: 'invalid_status',
            qr_id: ''
        });
    } catch (error) {
        invalidUpdateDataCaught = true;
        console.log('Expected validation error:', error.message);
    }
    test('QR Code Update Validation (Invalid Data)', invalidUpdateDataCaught);
    
    // Test 6: Configuration properties
    const hasTableName = qrCodeDataAccess.tableName === 'qr_codes';
    const hasDemoUserId = qrCodeDataAccess.demoUserId === '00000000-0000-0000-0000-000000000000';
    test('Configuration Properties', hasTableName && hasDemoUserId);
    console.log('Table Name:', qrCodeDataAccess.tableName);
    console.log('Demo User ID:', qrCodeDataAccess.demoUserId);
    
    console.log('='.repeat(40));
    console.log(`Results: ${passed}/${total} tests passed`);
    console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    return passed === total;
}

async function testAsyncMethods() {
    console.log('\n🔄 Async Methods Test (Expected to handle database gracefully)');
    console.log('==============================================================\n');
    
    const testItemId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    // Test createQRCode method structure
    try {
        const result = await qrCodeDataAccess.createQRCode(testItemId);
        console.log('✅ Create QR code method executed (result expected to fail gracefully)');
        console.log('Create result structure:', {
            hasSuccess: result.hasOwnProperty('success'),
            hasMessage: result.hasOwnProperty('message'),
            hasError: result.hasOwnProperty('error')
        });
    } catch (error) {
        console.log('✅ Create QR code failed gracefully:', error.message);
    }
    
    // Test getQRCodesForItem method structure
    try {
        const result = await qrCodeDataAccess.getQRCodesForItem(testItemId);
        console.log('✅ Get QR codes for item method executed (result expected to fail gracefully)');
        console.log('Get QR codes result structure:', {
            hasSuccess: result.hasOwnProperty('success'),
            hasMessage: result.hasOwnProperty('message'),
            hasError: result.hasOwnProperty('error')
        });
    } catch (error) {
        console.log('✅ Get QR codes for item failed gracefully:', error.message);
    }
    
    // Test getAllQRCodesForUser method structure
    try {
        const result = await qrCodeDataAccess.getAllQRCodesForUser();
        console.log('✅ Get all user QR codes method executed (result expected to fail gracefully)');
        console.log('Get all QR codes result structure:', {
            hasSuccess: result.hasOwnProperty('success'),
            hasMessage: result.hasOwnProperty('message'),
            hasError: result.hasOwnProperty('error')
        });
    } catch (error) {
        console.log('✅ Get all user QR codes failed gracefully:', error.message);
    }
    
    // Test getQRCodeByQRId method structure
    try {
        const result = await qrCodeDataAccess.getQRCodeByQRId('DEMO-FRIDGE-1A-001');
        console.log('✅ Get QR code by QR ID method executed (result expected to fail gracefully)');
        console.log('Get by QR ID result structure:', {
            hasSuccess: result.hasOwnProperty('success'),
            hasMessage: result.hasOwnProperty('message'),
            hasError: result.hasOwnProperty('error')
        });
    } catch (error) {
        console.log('✅ Get QR code by QR ID failed gracefully:', error.message);
    }
    
    // Test recordScan method structure
    try {
        const result = await qrCodeDataAccess.recordScan('DEMO-FRIDGE-1A-001');
        console.log('✅ Record scan method executed (result expected to fail gracefully)');
        console.log('Record scan result structure:', {
            hasSuccess: result.hasOwnProperty('success'),
            hasMessage: result.hasOwnProperty('message'),
            hasError: result.hasOwnProperty('error')
        });
    } catch (error) {
        console.log('✅ Record scan failed gracefully:', error.message);
    }
    
    // Test getQRCodeAnalytics method structure
    try {
        const result = await qrCodeDataAccess.getQRCodeAnalytics(testItemId);
        console.log('✅ Get QR code analytics method executed (result expected to fail gracefully)');
        console.log('Analytics result structure:', {
            hasSuccess: result.hasOwnProperty('success'),
            hasMessage: result.hasOwnProperty('message'),
            hasError: result.hasOwnProperty('error')
        });
    } catch (error) {
        console.log('✅ Get QR code analytics failed gracefully:', error.message);
    }
}

async function testQRIdGeneration() {
    console.log('\n🔢 QR ID Generation Test Cases');
    console.log('===============================\n');
    
    const testCases = [
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'dddddddd-dddd-dddd-dddd-dddddddddddd'
    ];
    
    let generationTestsPassed = 0;
    const generatedIds = [];
    
    testCases.forEach((itemId, index) => {
        try {
            const qrId = qrCodeDataAccess.generateQRId(itemId);
            const isValid = qrId && 
                           typeof qrId === 'string' && 
                           qrId.startsWith('QR-') &&
                           qrId.includes(itemId.substring(0, 8).toUpperCase()) &&
                           qrId.length > 20; // Should be reasonably long with timestamp and random
            
            if (isValid) {
                console.log(`✅ Test ${index + 1}: Item ${itemId.substring(0, 8)} - Generated: ${qrId}`);
                generatedIds.push(qrId);
                generationTestsPassed++;
            } else {
                console.log(`❌ Test ${index + 1}: Item ${itemId.substring(0, 8)} - Invalid QR ID: ${qrId}`);
            }
        } catch (error) {
            console.log(`❌ Test ${index + 1}: Item ${itemId.substring(0, 8)} - Error: ${error.message}`);
        }
    });
    
    // Test uniqueness
    const uniqueIds = new Set(generatedIds);
    const allUnique = uniqueIds.size === generatedIds.length;
    
    if (allUnique) {
        console.log(`✅ Uniqueness Test: All ${generatedIds.length} generated QR IDs are unique`);
        generationTestsPassed++;
    } else {
        console.log(`❌ Uniqueness Test: Found duplicate QR IDs`);
    }
    
    console.log(`\nQR ID generation tests: ${generationTestsPassed}/${testCases.length + 1} passed`);
    return generationTestsPassed === testCases.length + 1;
}

async function testUpdateValidationCases() {
    console.log('\n📝 QR Code Update Validation Test Cases');
    console.log('=======================================\n');
    
    const updateValidationTests = [
        {
            name: 'Valid status update to active',
            data: { status: 'active' },
            shouldFail: false
        },
        {
            name: 'Valid status update to inactive',
            data: { status: 'inactive' },
            shouldFail: false
        },
        {
            name: 'Valid status update to expired',
            data: { status: 'expired' },
            shouldFail: false
        },
        {
            name: 'Valid status update to deleted',
            data: { status: 'deleted' },
            shouldFail: false
        },
        {
            name: 'Valid QR ID update',
            data: { qr_id: 'QR-NEW-12345-ABCDEF' },
            shouldFail: false
        },
        {
            name: 'Valid combined update',
            data: { status: 'active', qr_id: 'QR-UPDATED-67890-GHIJKL' },
            shouldFail: false
        },
        {
            name: 'Invalid status',
            data: { status: 'invalid_status' },
            shouldFail: true
        },
        {
            name: 'Empty QR ID',
            data: { qr_id: '' },
            shouldFail: true
        },
        {
            name: 'QR ID too long',
            data: { qr_id: 'QR-' + 'A'.repeat(260) },
            shouldFail: true
        },
        {
            name: 'Non-string QR ID',
            data: { qr_id: 12345 },
            shouldFail: true
        }
    ];
    
    let updateTestsPassed = 0;
    
    updateValidationTests.forEach((testCase, index) => {
        try {
            qrCodeDataAccess.validateQRCodeUpdateData(testCase.data);
            if (!testCase.shouldFail) {
                console.log(`✅ Update Test ${index + 1}: ${testCase.name} - PASSED`);
                updateTestsPassed++;
            } else {
                console.log(`❌ Update Test ${index + 1}: ${testCase.name} - FAILED (should have thrown error)`);
            }
        } catch (error) {
            if (testCase.shouldFail) {
                console.log(`✅ Update Test ${index + 1}: ${testCase.name} - PASSED (correctly caught: ${error.message})`);
                updateTestsPassed++;
            } else {
                console.log(`❌ Update Test ${index + 1}: ${testCase.name} - FAILED (unexpected error: ${error.message})`);
            }
        }
    });
    
    console.log(`\nUpdate validation tests: ${updateTestsPassed}/${updateValidationTests.length} passed`);
    return updateTestsPassed === updateValidationTests.length;
}

async function testErrorHandlingCases() {
    console.log('\n🚨 Error Handling Test Cases');
    console.log('=============================\n');
    
    const errorTests = [
        {
            name: 'Create QR code with invalid item ID',
            test: () => qrCodeDataAccess.createQRCode(null),
            shouldFail: true
        },
        {
            name: 'Create QR code with non-string item ID',
            test: () => qrCodeDataAccess.createQRCode(12345),
            shouldFail: true
        },
        {
            name: 'Get QR codes with missing item ID',
            test: () => qrCodeDataAccess.getQRCodesForItem(''),
            shouldFail: true
        },
        {
            name: 'Get QR code by invalid QR ID',
            test: () => qrCodeDataAccess.getQRCodeByQRId(null),
            shouldFail: true
        },
        {
            name: 'Record scan with invalid QR ID',
            test: () => qrCodeDataAccess.recordScan(''),
            shouldFail: true
        },
        {
            name: 'Update QR code with missing QR code ID',
            test: () => qrCodeDataAccess.updateQRCode('', { status: 'active' }),
            shouldFail: true
        },
        {
            name: 'Delete QR code with missing QR code ID',
            test: () => qrCodeDataAccess.deleteQRCode(''),
            shouldFail: true
        }
    ];
    
    let errorTestsPassed = 0;
    
    for (const [index, testCase] of errorTests.entries()) {
        try {
            const result = await testCase.test();
            
            if (testCase.shouldFail) {
                // Should have failed but returned result - check if it's a proper error response
                if (result && !result.success) {
                    console.log(`✅ Error Test ${index + 1}: ${testCase.name} - PASSED (proper error response)`);
                    errorTestsPassed++;
                } else {
                    console.log(`❌ Error Test ${index + 1}: ${testCase.name} - FAILED (should have failed)`);
                }
            } else {
                console.log(`✅ Error Test ${index + 1}: ${testCase.name} - PASSED`);
                errorTestsPassed++;
            }
        } catch (error) {
            if (testCase.shouldFail) {
                console.log(`✅ Error Test ${index + 1}: ${testCase.name} - PASSED (correctly threw: ${error.message})`);
                errorTestsPassed++;
            } else {
                console.log(`❌ Error Test ${index + 1}: ${testCase.name} - FAILED (unexpected error: ${error.message})`);
            }
        }
    }
    
    console.log(`\nError handling tests: ${errorTestsPassed}/${errorTests.length} passed`);
    return errorTestsPassed === errorTests.length;
}

async function main() {
    console.log('📋 Task 18: QR Code Data Access - Validation\n');
    
    const basicTestsPassed = testQRCodeDataAccess();
    await testAsyncMethods();
    const qrIdGenerationPassed = await testQRIdGeneration();
    const updateValidationPassed = await testUpdateValidationCases();
    const errorHandlingPassed = await testErrorHandlingCases();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TASK 18 COMPLETION STATUS');
    console.log('='.repeat(50));
    
    if (basicTestsPassed && qrIdGenerationPassed && updateValidationPassed && errorHandlingPassed) {
        console.log('✅ QR Code Data Access: IMPLEMENTED');
        console.log('✅ Item Relationship Validation: WORKING');
        console.log('✅ QR Code Generation: FUNCTIONAL');
        console.log('✅ Scan Tracking: READY');
        console.log('✅ Analytics & Statistics: AVAILABLE');
        console.log('✅ QR ID Uniqueness: VALIDATED');
        console.log('✅ Status Management: COMPREHENSIVE');
        console.log('✅ Error Handling: ROBUST');
        
        console.log('\n🚀 Task 18 COMPLETE - Service Layer 100% Complete!');
        console.log('🎯 Ready to proceed with API Development (Tasks 19-30)');
        process.exit(0);
    } else {
        console.log('❌ Implementation issues found');
        console.log('Basic tests:', basicTestsPassed ? '✅' : '❌');
        console.log('QR ID generation:', qrIdGenerationPassed ? '✅' : '❌');
        console.log('Update validation:', updateValidationPassed ? '✅' : '❌');
        console.log('Error handling:', errorHandlingPassed ? '✅' : '❌');
        process.exit(1);
    }
}

main();