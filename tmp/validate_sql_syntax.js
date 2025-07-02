#!/usr/bin/env node

/**
 * SQL Syntax Validation Script
 * Validates SQL migration files for basic syntax errors
 */

const fs = require('fs');
const path = require('path');

function validateSQLSyntax(sqlContent, filename) {
    console.log(`\n🔍 Validating SQL syntax for: ${filename}`);
    
    const errors = [];
    const warnings = [];
    
    // Basic SQL syntax checks
    const lines = sqlContent.split('\n');
    let inMultiLineComment = false;
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        
        // Skip empty lines and single-line comments
        if (!trimmedLine || trimmedLine.startsWith('--')) {
            return;
        }
        
        // Handle multi-line comments
        if (trimmedLine.includes('/*')) {
            inMultiLineComment = true;
        }
        if (trimmedLine.includes('*/')) {
            inMultiLineComment = false;
            return;
        }
        if (inMultiLineComment) {
            return;
        }
        
        // Check for common SQL syntax issues
        
        // 1. Unclosed parentheses check
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        if (openParens > closeParens + 1) {
            warnings.push(`Line ${lineNum}: Potential unclosed parentheses`);
        }
        
        // 2. Missing semicolon check (for statements that should end with ;)
        if (trimmedLine.match(/^(CREATE|ALTER|INSERT|UPDATE|DELETE|DROP)/i) && 
            !trimmedLine.endsWith(';') && 
            !trimmedLine.endsWith(',') && 
            !trimmedLine.includes('(')) {
            warnings.push(`Line ${lineNum}: Statement may be missing semicolon`);
        }
        
        // 3. Reserved word usage check
        const reservedWords = ['USER', 'ORDER', 'GROUP', 'SELECT', 'INSERT', 'UPDATE', 'DELETE'];
        reservedWords.forEach(word => {
            if (trimmedLine.match(new RegExp(`\\b${word}\\b(?!\\s*\\()`, 'i'))) {
                // Only warn if it's not followed by parentheses (function call)
                const regex = new RegExp(`\\b${word}\\s+\\w+`, 'i');
                if (regex.test(trimmedLine)) {
                    warnings.push(`Line ${lineNum}: Potential use of reserved word '${word}' as identifier`);
                }
            }
        });
        
        // 4. Basic constraint syntax check
        if (trimmedLine.includes('CONSTRAINT') && !trimmedLine.match(/CONSTRAINT\s+\w+/i)) {
            errors.push(`Line ${lineNum}: Invalid CONSTRAINT syntax`);
        }
        
        // 5. UUID extension check
        if (trimmedLine.includes('uuid_generate_v4') && !sqlContent.includes('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')) {
            errors.push(`Line ${lineNum}: uuid_generate_v4() used but uuid-ossp extension not enabled`);
        }
    });
    
    // Structural checks
    
    // 1. Check for balanced CREATE TABLE statements
    const createTableCount = (sqlContent.match(/CREATE TABLE/gi) || []).length;
    const tableEndCount = (sqlContent.match(/\);\s*$/gm) || []).length;
    
    // 2. Check for proper UUID primary key setup
    if (sqlContent.includes('UUID PRIMARY KEY') && !sqlContent.includes('uuid-ossp')) {
        errors.push('UUID PRIMARY KEY used but uuid-ossp extension may not be enabled');
    }
    
    // 3. Check for timestamp trigger setup
    if (sqlContent.includes('updated_at') && !sqlContent.includes('update_updated_at_column')) {
        warnings.push('updated_at column found but no trigger function for auto-update');
    }
    
    // Results
    console.log(`📊 Validation Results:`);
    console.log(`   Lines analyzed: ${lines.length}`);
    console.log(`   Tables found: ${createTableCount}`);
    
    if (errors.length === 0 && warnings.length === 0) {
        console.log(`✅ No syntax issues found`);
        return true;
    }
    
    if (errors.length > 0) {
        console.log(`❌ Errors found (${errors.length}):`);
        errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (warnings.length > 0) {
        console.log(`⚠️  Warnings found (${warnings.length}):`);
        warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    return errors.length === 0; // Return true if no errors (warnings OK)
}

function main() {
    console.log('🔧 SQL Migration Syntax Validator');
    console.log('==================================');
    
    const migrationDir = path.join(__dirname, '..', 'backend', 'migrations');
    
    if (!fs.existsSync(migrationDir)) {
        console.log(`❌ Migration directory not found: ${migrationDir}`);
        process.exit(1);
    }
    
    const sqlFiles = fs.readdirSync(migrationDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    
    if (sqlFiles.length === 0) {
        console.log(`⚠️  No SQL files found in ${migrationDir}`);
        process.exit(0);
    }
    
    let allValid = true;
    
    sqlFiles.forEach(file => {
        const filePath = path.join(migrationDir, file);
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        const isValid = validateSQLSyntax(sqlContent, file);
        allValid = allValid && isValid;
    });
    
    console.log('\n' + '='.repeat(50));
    
    if (allValid) {
        console.log('🎉 All SQL files passed validation!');
        process.exit(0);
    } else {
        console.log('💥 Some SQL files have syntax issues. Please review and fix.');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}