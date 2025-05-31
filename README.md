# DigitalDeltaGaming PrisonRP MOTD/Rules System

A full-stack web application for managing the Message of the Day (MOTD), server rules, announcements, staff tools, and analytics for the DigitalDeltaGaming PrisonRP server. This project provides robust features for both public users and server staff, including authentication via Steam and Discord, image uploads, and a modern, responsive dark-themed UI.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Staff Dashboard & Authentication](#staff-dashboard--authentication)
- [Additional Guides](#additional-guides)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

This platform enables DigitalDeltaGaming staff to manage server rules, announcements, player analytics, and more. It provides a user-friendly public-facing portal for players to read server rules and announcements, while staff have access to advanced management tools via a secure dashboard.

- **Public:** View server rules, categories, and announcements in a modern web interface.
- **Staff:** Secure Steam-based login unlocks a dashboard for editing rules, managing announcements, viewing analytics, and more.

---

## Architecture

- **Frontend:** [React 19](https://react.dev/) SPA with styled-components, React Router, and custom dark theme.
- **Backend:** [Node.js](https://nodejs.org/) (Express) REST API with SQLite, Passport (Steam OAuth), Discord integration, rate limiting, and analytics.
- **Database:** SQLite (file-based, portable).
- **Authentication:** Steam OAuth (via Passport), session-based (with staff dashboard behind a secret URL).
- **Deployment:** Suitable for Docker, VM, or traditional hosting. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

---

## Features

- **Rules System:** Hierarchical categories and rules, Markdown support, rich formatting, and active/inactive toggling.
- **Announcements:** Scheduled and instant announcements, auto-expiry, priority sorting.
- **Staff Tools:** Dashboard for rule/announcement management, analytics, image uploads, permission control.
- **Authentication:** Steam OAuth for staff, Discord integration for notifications and analytics.
- **Analytics:** Rule views, staff actions, user engagement statistics.
- **Uploads:** Secure image/file uploads with CORS and access controls.
- **Security:** Rate limiting, session management, CORS, Helmet for HTTP headers.
- **Responsive UI:** Fully responsive, industrial dark theme for immersive experience.

---

## Screenshots

*(Add screenshots here if available)*

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 16.x (recommended: latest LTS)
- [npm](https://www.npmjs.com/) >= 8.x
- *(Optional: [Docker](https://www.docker.com/) for containerized deployment)*

---

### Environment Variables

Copy and modify the provided `.env.example` files in both `backend/` and (if needed) `frontend/`.

#### Backend (`backend/.env`)

```env
PORT=3001
DATABASE_PATH=./database/ddg_prisonrp.db
SESSION_SECRET=your-session-secret
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
STEAM_API_KEY=your-steam-api-key
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
STAFF_SECRET_URL=your-secret-path
```

> See [STEAM_AUTHENTICATION_SETUP.md](STEAM_AUTHENTICATION_SETUP.md) for Steam integration details.

---

### Backend Setup

```sh
cd backend
npm install
npm run dev      # For development (nodemon)
# or
npm start        # For production
```

- The backend will auto-create the SQLite database on first run.
- API available at `http://localhost:3001/api/`

---

### Frontend Setup

```sh
cd frontend
npm install
npm start        # Runs on http://localhost:3000
```

- Uses [React Scripts](https://www.npmjs.com/package/react-scripts).
- For local development, API and auth requests are automatically proxied to the backend (see `frontend/src/setupProxy.js`).

---

## Development Workflow

- **Local development:** Start both backend and frontend in separate terminals. The frontend proxies API calls to the backend.
- **Hot reload:** Supported in both backend (via [nodemon](https://www.npmjs.com/package/nodemon)) and frontend.
- **Linting & Testing:** See scripts in respective package.json files.
- **Database:** SQLite file is generated in `backend/database/`.

---

## Production Deployment

Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for best practices including environment variables, reverse proxy setup, and Docker recommendations.

- Use `npm run build` in `frontend/` to generate production static files.
- Serve the frontend separately (e.g., via Nginx) or combine with backend (see deployment guide).

---

## API Documentation

- Full REST API documentation is available in [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md).
- Key endpoints:
  - `GET /api/rules`, `GET /api/categories`, `GET /api/announcements`
  - `POST /api/auth/steam`, `GET/POST /api/staff/...`
  - `POST /api/images/upload`, `GET /api/analytics`
  - See file for complete list and usage.

---

## Staff Dashboard & Authentication

- Staff dashboard is available at: `http://yourdomain.com/staff/{STAFF_SECRET_URL}/dashboard`
- Requires Steam login (OAuth); only whitelisted users or those with sufficient permission level may access staff tools.
- All authentication and permission logic handled by backend.
- Staff tools include rule/announcement editors, analytics, image uploads, and Discord notifications.

---

## Additional Guides

- [STEAM_AUTHENTICATION_SETUP.md](STEAM_AUTHENTICATION_SETUP.md) – Steam login configuration
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) – End-to-end deployment
- [ENHANCED_STAFF_TOOLS.md](ENHANCED_STAFF_TOOLS.md) – Advanced staff/dashboard features
- [TEST_IMAGE_UPLOAD.md](TEST_IMAGE_UPLOAD.md) – Testing file uploads
- [SETUP_GUIDE.md](SETUP_GUIDE.md) – Legacy setup steps
- [GITHUB_SETUP.md](GITHUB_SETUP.md) – GitHub/CI integration
- [PROJECT_CHECKLIST.md](PROJECT_CHECKLIST.md) – Launch checklist
- [QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md) – Troubleshooting

---

## Project Structure

```
/
  backend/
    server.js                # Express API entry point
    package.json             # Backend dependencies & scripts
    database/                # SQLite DB & migrations
    routes/                  # API route handlers
    middleware/              # Auth, rate limiting, etc.
    public/                  # Static files
    scripts/                 # Utility scripts
    API_DOCUMENTATION.md     # API reference
    ...
  frontend/
    src/
      App.js                 # React SPA entry
      pages/                 # Public & staff dashboard pages
      components/            # Reusable UI components
      services/              # API services
      setupProxy.js          # Local API proxy config
      ...
    public/                  # Static assets
    package.json             # Frontend dependencies & scripts
  resources/                 # (Optional) Project resources/assets
  scripts/                   # DevOps/deployment scripts
  *.md                       # Guides and documentation
```

---

## Contributing

Pull requests and suggestions welcome! Please open an issue or PR for any improvements or bug fixes.

---

## License

ISC. © DigitalDeltaGaming. See [LICENSE](LICENSE) if present.