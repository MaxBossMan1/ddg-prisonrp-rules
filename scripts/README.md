# DDG PrisonRP - Development Scripts

This directory contains development tools and scripts for the DigitalDeltaGaming PrisonRP Rules System.

## 📋 Available Scripts

### Version Management (`version.js`)

A comprehensive version management tool for maintaining consistent versions across the project.

#### Usage

```bash
# Check current version information
node scripts/version.js
node scripts/version.js check

# Update version across all files
node scripts/version.js update 1.0.1

# Show help
node scripts/version.js help
```

#### Features

- **Version Synchronization**: Ensures backend and frontend versions match
- **Automatic Updates**: Updates `package.json` files and `VERSION.md`
- **Changelog Integration**: Reads and displays latest release information
- **Validation**: Enforces semantic versioning format
- **Git Integration**: Provides commands for tagging releases

#### Example Output

```
🎯 DDG PrisonRP Rules System - Version Information

📦 Backend Version:  1.0.0
⚛️  Frontend Version: 1.0.0
🔄 Versions Match:   ✅ Yes

📋 Latest Release: v1.0.0 (2024-01-27)

📚 Documentation:
   📖 Full History: CHANGELOG.md
   🔍 Quick Ref:    VERSION.md
   🔗 API Docs:     backend/API_DOCUMENTATION.md
```

---

## 🛠️ Future Scripts

Additional development tools planned for future versions:

### Database Management (`db.js`)
- Database migrations and schema updates
- Sample data generation and seeding
- Backup and restore operations

### Deployment Tools (`deploy.js`)
- Production deployment automation
- Environment configuration validation
- Health checks and monitoring

### Testing Utilities (`test.js`)
- Automated API endpoint testing
- Frontend component testing
- Integration test suites

### Development Setup (`setup.js`)
- One-command development environment setup
- Dependency validation and installation
- Configuration file generation

---

## 📝 Contributing

When adding new scripts to this directory:

1. **Follow naming convention**: Use descriptive, lowercase names with `.js` extension
2. **Add help documentation**: Include `--help` or `help` command support
3. **Error handling**: Provide clear error messages and exit codes
4. **Update this README**: Add documentation for new scripts
5. **Test thoroughly**: Ensure scripts work across different environments

### Script Template

```javascript
#!/usr/bin/env node

/**
 * Script Description
 * Usage: node scripts/script-name.js [options]
 */

const main = () => {
    const args = process.argv.slice(2);
    
    if (args.includes('help') || args.includes('--help')) {
        console.log('Usage information...');
        return;
    }
    
    // Script logic here
};

main();
```

---

## 🔗 Related Documentation

- [Project Checklist](../PROJECT_CHECKLIST.md) - Complete project status
- [Changelog](../CHANGELOG.md) - Version history and release notes
- [Version Info](../VERSION.md) - Current version reference
- [API Documentation](../backend/API_DOCUMENTATION.md) - Backend API reference
- [Setup Guide](../SETUP_GUIDE.md) - Development environment setup

---

**Last Updated**: 2024-01-27  
**Maintained By**: DDG Development Team 