#!/usr/bin/env node

/**
 * Bug Fix Script: Check Next.js Metadata Configuration
 * Purpose: Identifies viewport metadata configuration issues causing build warnings
 * Related to: Next.js 15 viewport metadata export requirements
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Bug Fix: Checking Next.js metadata configuration...\n');

const frontendDir = path.join(__dirname, '../frontend/src');

function checkFile(filePath, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for viewport in metadata export
        const hasViewportInMetadata = /metadata.*viewport/s.test(content);
        const hasMetadataExport = /export\s+(const\s+)?metadata/m.test(content);
        const hasViewportExport = /export\s+(const\s+)?viewport/m.test(content);
        
        if (hasViewportInMetadata) {
            console.log(`⚠️  FOUND BUG: ${fileName}`);
            console.log(`   - Contains viewport in metadata export`);
            console.log(`   - Needs to export viewport separately`);
            
            // Extract the viewport value
            const viewportMatch = content.match(/viewport:\s*['"`]([^'"`]+)['"`]/);
            if (viewportMatch) {
                console.log(`   - Current viewport: "${viewportMatch[1]}"`);
            }
            console.log('');
            return { file: fileName, needsFix: true, viewport: viewportMatch ? viewportMatch[1] : null };
        }
        
        if (hasMetadataExport && !hasViewportInMetadata) {
            console.log(`✅ ${fileName} - metadata export without viewport (OK)`);
        }
        
        return { file: fileName, needsFix: false };
    } catch (error) {
        console.log(`❌ Error reading ${fileName}: ${error.message}`);
        return { file: fileName, needsFix: false, error: true };
    }
}

function findTsxFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...findTsxFiles(fullPath));
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

const filesToCheck = findTsxFiles(frontendDir);
const issues = [];

for (const filePath of filesToCheck) {
    const relativePath = path.relative(frontendDir, filePath);
    const result = checkFile(filePath, relativePath);
    if (result.needsFix) {
        issues.push(result);
    }
}

console.log('\n📋 SUMMARY:');
console.log(`Total files checked: ${filesToCheck.length}`);
console.log(`Files needing fixes: ${issues.length}`);

if (issues.length > 0) {
    console.log('\n🔧 REQUIRED FIXES:');
    for (const issue of issues) {
        console.log(`• ${issue.file} - Extract viewport to separate export`);
    }
    
    console.log('\n💡 SOLUTION:');
    console.log('Remove viewport from metadata export and create a separate viewport export:');
    console.log('');
    console.log('// Before (WRONG):');
    console.log('export const metadata = {');
    console.log('  title: "...",');
    console.log('  viewport: "width=device-width, initial-scale=1",');
    console.log('};');
    console.log('');
    console.log('// After (CORRECT):');
    console.log('export const metadata = {');
    console.log('  title: "...",');
    console.log('};');
    console.log('');
    console.log('export const viewport = {');
    console.log('  width: "device-width",');
    console.log('  initialScale: 1,');
    console.log('};');
} else {
    console.log('✅ No metadata configuration issues found!');
}

process.exit(issues.length > 0 ? 1 : 0);