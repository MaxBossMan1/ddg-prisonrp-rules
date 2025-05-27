# DigitalDeltaGaming PrisonRP Rules System

A dynamic web application for managing server rules, announcements, and guidelines for Garry's Mod PrisonRP servers. Built for DigitalDeltaGaming PrisonRP with support for ~1000 users.

![Project Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Backend](https://img.shields.io/badge/Backend-Node.js%2FExpress-green)
![Frontend](https://img.shields.io/badge/Frontend-React-blue)
![Database](https://img.shields.io/badge/Database-SQLite-lightgrey)

## 🎮 Features

### ✅ **Currently Implemented**
- **📋 Dynamic Rule System** - Hierarchical rules with automatic numbering (A.1, A.1.1, A.1.1a)
- **🔍 Real-Time Search** - Instant search with autocomplete and result navigation
- **📱 Responsive Design** - Professional dark industrial theme, mobile-friendly
- **📎 Copy-to-Clipboard** - Click rule codes to copy them instantly
- **🎯 Smart Navigation** - Auto-scroll and highlight specific rules from search
- **❌ Error Handling** - Professional 404 pages for invalid routes
- **📊 Rule Categories** - Organized sections (A-G) with accurate rule counts

### 🚧 **Planned Features**
- **🔐 Steam Authentication** - Staff login with permission levels
- **✏️ Content Management** - WYSIWYG editor for rules and announcements
- **📈 Analytics** - Search history and usage tracking
- **🔄 Version Control** - Rule change tracking and revision history
- **💾 Media Support** - Image/video embedding in rules
- **☁️ Cloud Deployment** - Google Cloud Run with auto-scaling

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Express API    │    │   SQLite DB     │
│   Port 3000     │◄──►│   Port 3001     │◄──►│  Local Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Tech Stack**
- **Backend**: Node.js, Express, SQLite3
- **Frontend**: React, Styled Components, React Router
- **Database**: SQLite with hierarchical schema
- **Authentication**: Steam OpenID (planned)
- **Deployment**: Google Cloud Run (planned)

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+ and npm
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ddg-prisonrp-rules.git
cd ddg-prisonrp-rules
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Initialize the database**
```bash
cd ../backend
npm run init-db
```

5. **Start the application**

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

6. **Open your browser**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📁 Project Structure

```
ddg-prisonrp-rules/
├── README.md                     # This file
├── PROJECT_CHECKLIST.md          # Development progress tracker
├── .gitignore                    # Git ignore rules
├── plan.txt                      # Original project requirements
├── backend/                      # Node.js/Express API
│   ├── package.json
│   ├── server.js                 # Main server file
│   ├── .env.example              # Environment variables template
│   ├── database/
│   │   ├── schema.sql            # Database schema
│   │   ├── init.js               # Database initialization
│   │   └── ddg_prisonrp.db       # SQLite database (auto-generated)
│   ├── routes/                   # API route handlers
│   │   ├── rules.js              # Rules CRUD operations
│   │   └── search.js             # Search functionality
│   └── uploads/                  # Media file storage
└── frontend/                     # React application
    ├── package.json
    ├── src/
    │   ├── App.js                # Main React component
    │   ├── services/
    │   │   └── api.js            # Backend API integration
    │   ├── pages/
    │   │   ├── HomePage.js       # Landing page
    │   │   ├── RulePage.js       # Rule display
    │   │   └── NotFoundPage.js   # 404 error page
    │   └── components/
    │       ├── SearchBar.js      # Global search
    │       ├── CategoryGrid.js   # Rule categories
    │       └── AnnouncementCard.js
    └── public/                   # Static assets
```

## 🎨 Design System

The application uses a **professional dark industrial theme**:

- **Background**: `#1a1d23` (Very dark blue-gray)
- **Cards**: `#34495e` (Steel blue-gray)  
- **Borders**: `#2c3e50` (Darker steel blue)
- **Accent**: `#677bae` (Blue-gray)
- **Text**: `#ecf0f1` (Light gray)

## 📊 Database Schema

### **Key Tables**
- **categories** - Rule sections (A-G)
- **rules** - Individual rules with hierarchy
- **rule_codes** - Automatic numbering system
- **announcements** - Server MOTD/announcements
- **staff_users** - Authentication & permissions
- **search_history** - Analytics tracking

### **Rule Numbering System**
```
A.1     - Main rule
A.1.1   - Sub-rule
A.1.1a  - Revision
```

## 🔌 API Endpoints

### **Rules**
- `GET /api/rules` - Get all rules
- `GET /api/rules/:category` - Get rules by category
- `POST /api/rules` - Create new rule (staff only)
- `PUT /api/rules/:id` - Update rule (staff only)
- `DELETE /api/rules/:id` - Delete rule (staff only)

### **Search**
- `GET /api/search?q=:query` - Search rules and content
- `GET /api/search/suggestions?q=:query` - Get autocomplete suggestions

### **Categories**
- `GET /api/categories` - Get all categories with rule counts

### **Announcements**
- `GET /api/announcements` - Get current announcements

## 🚀 Deployment

### **Local Development**
1. Follow the Quick Start guide above
2. Both servers will run on localhost with hot reloading

### **Production (Planned)**
- **Backend**: Google Cloud Run with auto-scaling
- **Frontend**: Static hosting with CDN
- **Database**: Google Cloud SQL or managed SQLite
- **Media**: Google Cloud Storage
- **Domain**: Custom domain with SSL

## 🤝 Contributing

This is a private project for DigitalDeltaGaming PrisonRP. If you're a staff member:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Development Status

See [PROJECT_CHECKLIST.md](PROJECT_CHECKLIST.md) for detailed development progress and planned features.

### **Current Status**
- ✅ **Backend API** - Complete with rules, search, categories
- ✅ **Frontend UI** - Professional dark theme with all components
- ✅ **Database** - SQLite with hierarchical rule system
- ✅ **Search** - Real-time search with navigation
- 🚧 **Authentication** - Steam OpenID integration in progress
- 🚧 **Staff Panel** - Content management interface planned

## 📝 License

This project is private and proprietary to DigitalDeltaGaming.

## 📞 Support

For issues or questions:
- **Discord**: [DigitalDeltaGaming Discord Server]
- **Issues**: Use GitHub Issues for bug reports and feature requests

---

**Built for the DigitalDeltaGaming PrisonRP Community** 🎮 