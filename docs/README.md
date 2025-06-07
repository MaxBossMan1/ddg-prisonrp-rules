# DDG PrisonRP Documentation

Welcome to the complete documentation for the DDG PrisonRP Rules Management System. This documentation covers everything from initial setup to advanced deployment strategies.

## 📚 Documentation Structure

### 🚀 Getting Started
- **[Setup Guides](setup/)** - Installation and initial configuration
  - [Steam Authentication Setup](setup/STEAM_AUTHENTICATION_SETUP.md) - Configure Steam OAuth login
  - [Setup Guide](setup/SETUP_GUIDE.md) - Basic installation instructions
  - [Troubleshooting Guide](setup/troubleshooting.md) - Common issues and solutions

### 🔧 Development
- **[Development Guides](development/)** - Contributing and development workflow
  - [Contributing Guide](development/contributing.md) - Code standards, workflow, and contribution guidelines
  - [GitHub Setup](development/GITHUB_SETUP.md) - Repository and CI/CD configuration

### 🚀 Deployment
- **[Deployment Options](deployment/)** - Production deployment strategies
  - [Serverless Deployment (Google Cloud)](deployment/SERVERLESS_DEPLOYMENT_GUIDE.md) - Cost-effective cloud deployment
  - [VPS Deployment](deployment/vps-guide.md) - Traditional server deployment
  - [Docker Deployment](deployment/docker-guide.md) - Containerized deployment
  - [Legacy Deployment Guide](deployment/DEPLOYMENT_GUIDE.md) - Original deployment documentation

### 📡 API Reference
- **[API Documentation](api/)** - Complete REST API reference
  - [API Documentation](api/API_DOCUMENTATION.md) - Comprehensive API endpoint reference

### 📝 Project Information
- [Changelog](../CHANGELOG.md) - Version history and release notes
- [Version Information](../VERSION.md) - Current version details

## 🎯 Quick Start Guide

### For New Developers
1. Read the [Contributing Guide](development/contributing.md)
2. Follow the [Setup Guide](setup/SETUP_GUIDE.md)
3. Configure [Steam Authentication](setup/STEAM_AUTHENTICATION_SETUP.md)
4. Check [Troubleshooting](setup/troubleshooting.md) if needed

### For Deployment
1. Choose your deployment method:
   - **Serverless**: [Google Cloud Guide](deployment/SERVERLESS_DEPLOYMENT_GUIDE.md) (Recommended)
   - **Traditional**: [VPS Guide](deployment/vps-guide.md)
   - **Container**: [Docker Guide](deployment/docker-guide.md)
2. Configure environment variables
3. Set up Steam authentication
4. Deploy and test

### For Integration
1. Review the [API Documentation](api/API_DOCUMENTATION.md)
2. Understand the authentication flow
3. Test endpoints with your application

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DDG PrisonRP System                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   React 19  │◄──►│  Express    │◄──►│ SQLite/     │     │
│  │   Frontend  │    │   Backend   │    │ PostgreSQL  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                            │                               │
│                    ┌─────────────┐                         │
│                    │   Steam     │                         │
│                    │    OAuth    │                         │
│                    └─────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Key Features

### For Players
- **Rules Browser**: Clean, searchable interface for server rules
- **Announcements**: Server updates and important information
- **Mobile Responsive**: Works on all devices
- **Dark Theme**: Gaming-optimized dark interface

### For Staff
- **Steam Authentication**: Secure login via Steam
- **Permission System**: 4-tier hierarchy (Owner > Admin > Moderator > Editor)
- **Rich Text Editor**: Markdown support with image uploads
- **Activity Logging**: Complete audit trail of changes
- **User Management**: Staff user creation and permission control

### Technical
- **Multi-Database**: SQLite for development, PostgreSQL for production
- **Containerized**: Docker support for easy deployment
- **Serverless Ready**: Optimized for cloud platforms
- **API-First**: RESTful API with comprehensive documentation

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React 19, styled-components | User interface |
| Backend | Node.js 18+, Express.js | API server |
| Database | SQLite / PostgreSQL | Data storage |
| Authentication | Passport.js, Steam OAuth | User authentication |
| Deployment | Docker, Google Cloud Run | Application hosting |
| File Storage | Local filesystem / Cloud Storage | Image and file uploads |

## 📊 System Requirements

### Development
- **Node.js**: 18.0.0 or higher
- **NPM**: 8.0.0 or higher
- **Git**: Latest version
- **OS**: Windows, macOS, or Linux

### Production (Minimum)
- **CPU**: 1 core (2+ recommended)
- **RAM**: 1GB (2GB+ recommended)
- **Storage**: 10GB SSD
- **Network**: Static IP address

### Production (Recommended)
- **CPU**: 2+ cores
- **RAM**: 4GB+
- **Storage**: 20GB+ SSD
- **Bandwidth**: Unmetered or 1TB+

## 🔍 Common Use Cases

### Rules Management
- Create hierarchical rule categories (A, B, C, etc.)
- Add main rules and sub-rules with rich formatting
- Include images and media in rule descriptions
- Set rule activation status and ordering

### Staff Operations
- Manage announcements with priority levels
- Schedule announcements for future publication
- Track all staff actions in activity log
- Control user permissions and access levels

### Integration
- Embed rules in external applications
- Sync announcements with Discord
- Export rule data for other systems
- Monitor system health via API endpoints

## 🆘 Getting Help

### Documentation Issues
If you find errors or gaps in the documentation:
1. Check the [troubleshooting guide](setup/troubleshooting.md)
2. Search existing GitHub issues
3. Create a new issue with the `documentation` label

### Technical Support
For technical issues:
1. Review the relevant guide in this documentation
2. Check the [troubleshooting section](setup/troubleshooting.md)
3. Look at recent issues in the GitHub repository
4. Create a detailed issue report

### Feature Requests
For new features or improvements:
1. Check if it's already in the [project roadmap](../CHANGELOG.md)
2. Review existing feature requests
3. Create a new issue with the `enhancement` label

## 📝 Contributing to Documentation

We welcome improvements to the documentation! To contribute:

1. **Fork the repository**
2. **Create a documentation branch**: `git checkout -b docs/improve-setup-guide`
3. **Make your changes** following the existing format
4. **Test your changes** by following the instructions you wrote
5. **Submit a pull request** with a clear description

### Documentation Standards
- Use clear, concise language
- Include code examples where appropriate
- Test all commands and procedures
- Keep formatting consistent with existing docs
- Update the table of contents when adding new sections

---

**Last Updated**: January 2025  
**Documentation Version**: 1.0.0  
**Project Version**: 0.7.0

*This documentation is maintained by the DDG development team and community contributors.*