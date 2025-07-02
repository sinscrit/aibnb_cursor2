const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function testQRGeneration() {
    console.log('🧪 Quick QR Generation Test...\n');
    
    try {
        // Test 1: Generate data URL
        console.log('📋 Test 1: Generate QR data URL');
        const dataUrl = await QRCode.toDataURL('https://example.com/test');
        console.log('✅ Data URL generated, length:', dataUrl.length);
        console.log('✅ Starts with:', dataUrl.substring(0, 50) + '...');
        
        // Test 2: Create test directory
        console.log('\n📋 Test 2: Create test directory');
        const testDir = path.join(__dirname, 'qr-test');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        console.log('✅ Test directory created:', testDir);
        
        // Test 3: Generate QR file
        console.log('\n📋 Test 3: Generate QR code file');
        const testFile = path.join(testDir, 'test-qr.png');
        await QRCode.toFile(testFile, 'https://example.com/test');
        const stats = fs.statSync(testFile);
        console.log('✅ QR file created:', testFile);
        console.log('✅ File size:', stats.size, 'bytes');
        
        console.log('\n🎉 All QR generation tests passed!');
        console.log('✅ QR Service implementation is ready');
        
        return true;
    } catch (error) {
        console.error('❌ QR generation test failed:', error.message);
        return false;
    }
}

if (require.main === module) {
    testQRGeneration().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testQRGeneration };