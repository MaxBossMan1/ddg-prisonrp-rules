# DigitalDeltaGaming PrisonRP Rules Management System

A modern, full-stack web application for managing server rules, announcements, and staff tools for the DigitalDeltaGaming PrisonRP server.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node.js-18%2B-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19-blue)](https://reactjs.org/)

## 🎯 Project Overview

This platform provides a comprehensive solution for managing PrisonRP server operations:

- **Public Interface**: Clean, responsive rules browser for players
- **Staff Dashboard**: Advanced management tools with role-based permissions
- **Multi-Database Support**: SQLite for development, PostgreSQL for production
- **Modern Architecture**: React 19 frontend with Node.js/Express backend

## ✨ Key Features

### For Players
- 📋 Hierarchical rules browser with search functionality  
- 📢 Server announcements with priority system
- 🎨 Modern dark theme optimized for gaming
- 📱 Fully responsive design

### For Staff
- 🔐 Steam OAuth authentication with permission levels
- 📝 Rich text editor for rules and announcements
- 🖼️ Image upload and management system
- 📊 Activity logging and change tracking
- ⏰ Announcement scheduling system
- 🎛️ User management with hierarchical permissions

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React 19      │◄──►│  Express API    │◄──►│ SQLite/PostgreSQL│
│   Frontend      │    │   Backend       │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │              ┌─────────────────┐              │
        └──────────────►│ Steam OAuth     │              │
                        │ Authentication  │              │
                        └─────────────────┘              │
                                 │                       │
                        ┌─────────────────┐              │
                        │ Discord         │              │
                        │ Integration     │              │
                        └─────────────────┘              │
                                                         │
                                                ┌─────────────────┐
                                                │ File Upload     │
                                                │ System          │
                                                └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.0.0 or higher
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ddg-prisonrp-rules
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Staff Dashboard: http://localhost:3000/staff/{SECRET_URL}/dashboard

## 📁 Project Structure

```
ddg-prisonrp-rules/
├── backend/                    # Express.js API server
│   ├── database/              # Database schemas and adapters
│   │   ├── adapter.js         # Multi-database abstraction layer
│   │   ├── schema.sql         # SQLite schema
│   │   └── schema-postgres.sql # PostgreSQL schema
│   ├── middleware/            # Authentication & security middleware
│   ├── routes/               # API route handlers
│   ├── uploads/              # File upload storage
│   └── server.js             # Main server entry point
├── frontend/                  # React 19 application
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/           # Page components
│       ├── services/        # API service layer
│       └── utils/           # Utility functions
├── docs/                     # Documentation
│   ├── setup/               # Setup and installation guides
│   ├── deployment/          # Deployment guides
│   ├── development/         # Development documentation
│   └── api/                 # API documentation
├── scripts/                  # Utility scripts
└── resources/               # Project assets and images
```

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration  
DATABASE_TYPE=sqlite                    # or 'postgres'
DATABASE_PATH=./database/ddg_prisonrp.db # SQLite path
DATABASE_URL=postgresql://...           # PostgreSQL connection string

# Authentication
STEAM_API_KEY=your_steam_api_key
SESSION_SECRET=your_session_secret

# Application URLs
FRONTEND_URL=http://localhost:3000
STAFF_SECRET_URL=your_secret_staff_path

# Discord Integration (optional)
DISCORD_WEBHOOK_URL=your_webhook_url
```

### Database Support

The application supports dual database configuration:

- **SQLite**: Perfect for development and small deployments
- **PostgreSQL**: Recommended for production and cloud deployments

The `DatabaseAdapter` class automatically handles the differences between database types.

## 🚀 Deployment

### Production Deployment Options

1. **Serverless (Google Cloud)** - Recommended for cost-effectiveness
   - See: [`docs/deployment/serverless-guide.md`](docs/deployment/serverless-guide.md)

2. **Traditional VPS/VM**
   - See: [`docs/deployment/vps-guide.md`](docs/deployment/vps-guide.md)

3. **Docker Container**
   - See: [`docs/deployment/docker-guide.md`](docs/deployment/docker-guide.md)

### Quick Docker Deployment

```bash
# Build and run with Docker
docker build -t ddg-prisonrp .
docker run -p 3001:3001 -e NODE_ENV=production ddg-prisonrp
```

## 🔐 Authentication & Permissions

### Permission Levels

1. **Owner** (Level 4) - Full system access
2. **Admin** (Level 3) - Can manage users and content
3. **Moderator** (Level 2) - Can approve/reject content
4. **Editor** (Level 1) - Can create drafts for approval

### Steam Authentication Setup

1. Get Steam Web API key from [Steam Developer](https://steamcommunity.com/dev/apikey)
2. Configure your Steam app settings
3. Add staff users through the admin panel

See: [`docs/setup/steam-authentication.md`](docs/setup/steam-authentication.md)

## 📖 Documentation

- **[Setup Guide](docs/setup/)** - Installation and configuration
- **[API Documentation](docs/api/)** - REST API reference  
- **[Development Guide](docs/development/)** - Contributing and development workflow
- **[Deployment Guide](docs/deployment/)** - Production deployment options

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in [`docs/`](docs/)
- Review the troubleshooting guide: [`docs/setup/troubleshooting.md`](docs/setup/troubleshooting.md)

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by DigitalDeltaGaming**