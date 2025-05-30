#!/usr/bin/env node

/**
 * Version Management Script for DDG PrisonRP Rules System
 * Usage: node scripts/version.js [check|update]
 */

const fs = require('fs');
const path = require('path');

// File paths
const BACKEND_PACKAGE = path.join(__dirname, '../backend/package.json');
const FRONTEND_PACKAGE = path.join(__dirname, '../frontend/package.json');
const VERSION_FILE = path.join(__dirname, '../VERSION.md');
const CHANGELOG_FILE = path.join(__dirname, '../CHANGELOG.md');

// Current version info
const getCurrentVersion = () => {
    try {
        const backendPkg = JSON.parse(fs.readFileSync(BACKEND_PACKAGE, 'utf8'));
        const frontendPkg = JSON.parse(fs.readFileSync(FRONTEND_PACKAGE, 'utf8'));
        
        return {
            backend: backendPkg.version,
            frontend: frontendPkg.version,
            match: backendPkg.version === frontendPkg.version
        };
    } catch (error) {
        console.error('Error reading package files:', error.message);
        process.exit(1);
    }
};

// Display version information
const displayVersionInfo = () => {
    console.log('\n🎯 DDG PrisonRP Rules System - Version Information\n');
    
    const versions = getCurrentVersion();
    
    console.log(`📦 Backend Version:  ${versions.backend}`);
    console.log(`⚛️  Frontend Version: ${versions.frontend}`);
    console.log(`🔄 Versions Match:   ${versions.match ? '✅ Yes' : '❌ No'}\n`);
    
    if (!versions.match) {
        console.log('⚠️  WARNING: Backend and frontend versions do not match!');
        console.log('   Consider updating both to the same version.\n');
    }
    
    // Read latest changelog entry
    try {
        const changelog = fs.readFileSync(CHANGELOG_FILE, 'utf8');
        const latestEntry = changelog.split('## [')[1];
        if (latestEntry) {
            const versionMatch = latestEntry.match(/^([^\]]+)\]/);
            const dateMatch = latestEntry.match(/- (\d{4}-\d{2}-\d{2})/);
            
            if (versionMatch && dateMatch) {
                console.log(`📋 Latest Release: v${versionMatch[1]} (${dateMatch[1]})`);
            }
        }
    } catch (error) {
        console.log('📋 Latest Release: Could not read changelog');
    }
    
    console.log('\n📚 Documentation:');
    console.log('   📖 Full History: CHANGELOG.md');
    console.log('   🔍 Quick Ref:    VERSION.md');
    console.log('   🔗 API Docs:     backend/API_DOCUMENTATION.md\n');
};

// Update version in all files
const updateVersion = (newVersion) => {
    if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
        console.error('❌ Please provide a valid semantic version (e.g., 1.0.1)');
        process.exit(1);
    }
    
    try {
        // Update backend package.json
        const backendPkg = JSON.parse(fs.readFileSync(BACKEND_PACKAGE, 'utf8'));
        backendPkg.version = newVersion;
        fs.writeFileSync(BACKEND_PACKAGE, JSON.stringify(backendPkg, null, 2) + '\n');
        
        // Update frontend package.json  
        const frontendPkg = JSON.parse(fs.readFileSync(FRONTEND_PACKAGE, 'utf8'));
        frontendPkg.version = newVersion;
        fs.writeFileSync(FRONTEND_PACKAGE, JSON.stringify(frontendPkg, null, 2) + '\n');
        
        // Update VERSION.md
        let versionMd = fs.readFileSync(VERSION_FILE, 'utf8');
        versionMd = versionMd.replace(
            /\*\*v[\d.]+\*\*/,
            `**v${newVersion}**`
        );
        versionMd = versionMd.replace(
            /- \*\*Version\*\*: [\d.]+/g,
            `- **Version**: ${newVersion}`
        );
        versionMd = versionMd.replace(
            /\*Released: [^*]+\*/,
            `*Released: ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
            })}*`
        );
        fs.writeFileSync(VERSION_FILE, versionMd);
        
        console.log(`✅ Successfully updated version to ${newVersion}`);
        console.log('\n📝 Next steps:');
        console.log('   1. Update CHANGELOG.md with new version entry');
        console.log('   2. Commit changes with: git commit -m "Release v' + newVersion + '"');
        console.log('   3. Create git tag: git tag v' + newVersion);
        
    } catch (error) {
        console.error('❌ Error updating version:', error.message);
        process.exit(1);
    }
};

// Main script logic
const main = () => {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'check':
        case undefined:
            displayVersionInfo();
            break;
            
        case 'update':
            const newVersion = args[1];
            updateVersion(newVersion);
            break;
            
        case 'help':
        case '--help':
        case '-h':
            console.log('\n🎯 DDG PrisonRP Version Management\n');
            console.log('Usage:');
            console.log('  node scripts/version.js [command] [version]\n');
            console.log('Commands:');
            console.log('  check          Show current version information (default)');
            console.log('  update <ver>   Update version in all files (e.g., 1.0.1)');
            console.log('  help           Show this help message\n');
            console.log('Examples:');
            console.log('  node scripts/version.js');
            console.log('  node scripts/version.js check');
            console.log('  node scripts/version.js update 1.0.1\n');
            break;
            
        default:
            console.error(`❌ Unknown command: ${command}`);
            console.log('Run "node scripts/version.js help" for usage information.');
            process.exit(1);
    }
};

// Run the script
main(); 