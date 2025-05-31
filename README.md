# DigitalDeltaGaming PrisonRP Rules System

A comprehensive, dynamic web platform for managing game server rules, announcements, and staff guidelines for Garry's Mod PrisonRP. Designed for high scalability (1000+ users), professional staff management, and seamless user experience.

![Project Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Backend](https://img.shields.io/badge/Backend-Node.js%2FExpress-green)
![Frontend](https://img.shields.io/badge/Frontend-React-blue)
![Database](https://img.shields.io/badge/Database-SQLite-lightgrey)

---

## 📚 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Quick Start](#quick-start)
  - [Setup & Configuration](#setup--configuration)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Operations & Maintenance](#operations--maintenance)
- [Development & Contribution](#development--contribution)
- [Documentation & Guides](#documentation--guides)
- [Support](#support)
- [License](#license)

---

## 📝 Overview

This project powers the official rules, guidelines, and staff tools for DigitalDeltaGaming PrisonRP. It provides:

- **Hierarchical** rule management (A.1, A.1.1, etc.)
- **Real-time search** and navigation for users and staff
- **Announcement** and MOTD management
- **Staff authentication** (Steam OpenID, planned)
- **Responsive, professional UI** with dark industrial theme

The system is built for reliability, scalability, and easy maintenance—tailored for Garry's Mod PrisonRP server operations.

---

## 🎮 Features

### ✅ Implemented

- **Dynamic Rule System:** Hierarchical, auto-numbered rules and guidelines
- **Real-Time Search:** Instant, autocomplete-powered full-text search
- **Responsive UI:** Dark, mobile-friendly, accessible design
- **Copy-to-Clipboard:** Clickable rule codes for fast referencing
- **Smart Navigation:** Direct linking to rules from search or URLs
- **Professional Error Handling:** Custom 404/invalid route pages
- **Categorized Content:** Organized by server section (A-G), accurate counts
- **Announcements Module:** Server-wide messages/MOTDs

### 🚧 Planned/Roadmap

- **Steam Authentication:** Staff login & permission levels ([STEAM_AUTHENTICATION_SETUP.md](STEAM_AUTHENTICATION_SETUP.md))
- **Content Management:** WYSIWYG rule/announcement editor
- **Analytics & History:** Search stats, rule revision tracking
- **Media Support:** Embedded images/videos in rules
- **Cloud Deployment:** Google Cloud Run, managed DB/storage
- **Enhanced Staff Tools:** Moderation, audit logs ([ENHANCED_STAFF_TOOLS.md](ENHANCED_STAFF_TOOLS.md))

---

## 🏗️ Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  React App   │    │ Express API  │    │  SQLite DB   │
│  (Port 3000) │◄──►│ (Port 3001)  │◄──►│ Local/Cloud  │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, SQLite3
- **Frontend:** React, Styled Components, React Router
- **Database:** SQLite (file-based, migration-ready)
- **Authentication:** Steam OpenID (in progress)
- **Deployment:** Google Cloud Run (planned), Docker support
- **CI/CD:** [Refer to GITHUB_SETUP.md](GITHUB_SETUP.md)

---

## 🚀 Getting Started

### Quick Start

> For detailed setup, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

#### Prerequisites

- Node.js 16+ and npm
- Git

#### Installation

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

6. **Access the app**
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Backend API: [http://localhost:3001](http://localhost:3001)

#### Environment Variables

- See `backend/.env.example` for configuration options.

---

### Setup & Configuration

- **Initial Setup:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Deployment:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Steam Authentication:** [STEAM_AUTHENTICATION_SETUP.md](STEAM_AUTHENTICATION_SETUP.md)
- **Quick Fixes:** [QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md)
- **Cloud Config:** [update-cloud-config.sh](update-cloud-config.sh)

---

## 📁 Project Structure

```
ddg-prisonrp-rules/
├── README.md
├── SETUP_GUIDE.md
├── DEPLOYMENT_GUIDE.md
├── ENHANCED_STAFF_TOOLS.md
├── STEAM_AUTHENTICATION_SETUP.md
├── PROJECT_CHECKLIST.md
├── backend/
│   ├── server.js
│   ├── database/
│   │   ├── schema.sql
│   │   ├── init.js
│   │   └── ddg_prisonrp.db
│   ├── routes/
│   │   ├── rules.js
│   │   └── search.js
│   └── uploads/
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── services/
    │   │   └── api.js
    │   ├── pages/
    │   │   ├── HomePage.js
    │   │   ├── RulePage.js
    │   │   └── NotFoundPage.js
    │   └── components/
    └── public/
```
*(See each subdirectory for more details on structure and file roles.)*

---

## 🎨 Design System

- **Theme:** Dark Industrial
    - **Background:** `#1a1d23`
    - **Cards:** `#34495e`
    - **Borders:** `#2c3e50`
    - **Accent:** `#677bae`
    - **Text:** `#ecf0f1`
- **Typography:** Clear, highly readable
- **Responsiveness:** Mobile-first, flexible grid layouts

---

## 📊 Database Schema

### Key Tables

- `categories`: Rule sections (A-G)
- `rules`: Hierarchical rule entries
- `rule_codes`: Manages auto-numbering (A.1, A.1.1, etc.)
- `announcements`: Server announcements/MOTDs
- `staff_users`: Staff authentication, permissions
- `search_history`: Analytics (planned)

#### Rule Numbering Example

```
A.1     - Main rule
A.1.1   - Sub-rule
A.1.1a  - Revision
```

---

## 🔌 API Reference

### Rules

- `GET /api/rules` — Retrieve all rules
- `GET /api/rules/:category` — Rules by category (A-G)
- `POST /api/rules` — Create rule (staff only)
- `PUT /api/rules/:id` — Update rule (staff only)
- `DELETE /api/rules/:id` — Delete rule (staff only)

### Search

- `GET /api/search?q=:query` — Full-text rule search
- `GET /api/search/suggestions?q=:query` — Autocomplete suggestions

### Categories

- `GET /api/categories` — List categories with rule counts

### Announcements

- `GET /api/announcements` — Current server announcements

*(See backend/routes for handler logic.)*

---

## 🚀 Deployment

- **Local:** See [Quick Start](#quick-start) above
- **Production:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Cloud/CI:** Google Cloud Run (planned), Docker, custom scripts included
- **Commands:** See [DEPLOY_COMMAND.md](DEPLOY_COMMAND.md), [server-setup.sh](server-setup.sh), [start-ddg-remote.sh](start-ddg-remote.sh), [deploy-fix.sh](deploy-fix.sh)

---

## ⚙️ Operations & Maintenance

- **Versioning:** [VERSION.md](VERSION.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Testing:** [TEST_IMAGE_UPLOAD.md](TEST_IMAGE_UPLOAD.md)
- **Staff Tools:** [ENHANCED_STAFF_TOOLS.md](ENHANCED_STAFF_TOOLS.md)
- **Issue Tracking:** Use GitHub Issues

---

## 🤝 Development & Contribution

### Contributing

This is a private project for DigitalDeltaGaming PrisonRP staff. To contribute:

1. **Fork** the repository
2. **Create** a feature branch:
    ```bash
    git checkout -b feature/your-feature
    ```
3. **Commit** your changes:
    ```bash
    git commit -am "Add your feature"
    ```
4. **Push** and **create a Pull Request**

See [PROJECT_CHECKLIST.md](PROJECT_CHECKLIST.md) for planned features and progress.

---

## 📖 Documentation & Guides

- **Setup:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Deployment:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Steam Auth:** [STEAM_AUTHENTICATION_SETUP.md](STEAM_AUTHENTICATION_SETUP.md)
- **Troubleshooting:** [QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md)
- **Staff Tools:** [ENHANCED_STAFF_TOOLS.md](ENHANCED_STAFF_TOOLS.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Version:** [VERSION.md](VERSION.md)

---

## 📞 Support

For help, feature requests, or bug reports:

- **Discord:** DigitalDeltaGaming Discord Server
- **GitHub Issues:** Use for all technical issues and requests

---

## 📝 License

This project is **private and proprietary** to DigitalDeltaGaming. All rights reserved.

---

**Built by and for the DigitalDeltaGaming PrisonRP Community.** 🎮