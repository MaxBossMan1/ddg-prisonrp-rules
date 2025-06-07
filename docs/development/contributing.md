# Development Guide & Contributing

Welcome to the DDG PrisonRP Rules Management System development guide. This document covers the development workflow, code standards, and contribution guidelines.

## 🎯 Development Overview

### Tech Stack
- **Frontend**: React 19, styled-components, React Router
- **Backend**: Node.js 18+, Express.js, Passport (Steam OAuth)
- **Database**: SQLite (dev) / PostgreSQL (prod) with custom adapter
- **Build Tools**: React Scripts, nodemon
- **Deployment**: Docker, Cloud Run (GCP), traditional VPS

### Architecture Principles
- **Database Agnostic**: Unified adapter supports SQLite and PostgreSQL
- **Permission-Based**: Hierarchical role system (Owner > Admin > Moderator > Editor)
- **API-First**: RESTful API with clear separation of concerns
- **Responsive Design**: Mobile-first approach with industrial dark theme

## 🚀 Getting Started

### Prerequisites
```bash
# Required
node --version  # Should be 18.0.0+
npm --version   # Should be 8.0.0+
git --version

# Optional for containerized development
docker --version
docker-compose --version
```

### Local Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/ddg-prisonrp-rules.git
   cd ddg-prisonrp-rules
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your development settings
   npm run dev  # Starts with nodemon
   ```

3. **Frontend setup** (new terminal)
   ```bash
   cd frontend
   npm install
   npm start  # Starts on localhost:3000
   ```

4. **Development URLs**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health Check: http://localhost:3001/health
   - Staff Dashboard: http://localhost:3000/staff/{SECRET_URL}/dashboard

## 🏗️ Project Structure

```
ddg-prisonrp-rules/
├── backend/                    # Express.js API
│   ├── database/
│   │   ├── adapter.js         # Database abstraction layer
│   │   ├── schema.sql         # SQLite schema
│   │   └── schema-postgres.sql # PostgreSQL schema
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   └── permissions.js    # Permission checking
│   ├── routes/
│   │   ├── api/              # Public API routes
│   │   ├── auth/            # Steam authentication
│   │   └── staff/           # Staff-only routes
│   ├── uploads/             # File upload storage
│   ├── server.js           # Main server file
│   └── package.json
├── frontend/                   # React 19 application
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # API service layer
│   │   ├── utils/           # Utility functions
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
└── resources/                # Assets and images
```

## 🔧 Development Workflow

### Branch Management
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Keep up to date with main
git fetch origin
git rebase origin/main

# Push feature branch
git push origin feature/your-feature-name
```

### Code Standards

#### Backend (Node.js)
```javascript
// Use async/await for promises
const fetchRules = async (categoryId) => {
  try {
    const rules = await db.all('SELECT * FROM rules WHERE category_id = ?', [categoryId]);
    return rules;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

// Use middleware for common functionality
const requirePermission = (level) => {
  return (req, res, next) => {
    if (req.user.permission_level < level) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

#### Frontend (React)
```javascript
// Use functional components with hooks
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const StyledComponent = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.medium};
`;

const RulesList = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await apiService.getRules();
        setRules(response.data);
      } catch (error) {
        console.error('Failed to fetch rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <StyledComponent>
      {rules.map(rule => (
        <RuleCard key={rule.id} rule={rule} />
      ))}
    </StyledComponent>
  );
};

export default RulesList;
```

### Database Migrations

#### Adding a new column (example)
```javascript
// In backend/database/adapter.js -> runSQLiteMigrations()
try {
  await this.run('ALTER TABLE rules ADD COLUMN new_field TEXT DEFAULT NULL');
  console.log('Migration: Added new_field column to rules');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('new_field column already exists in rules table');
  } else {
    console.error('Unexpected error adding new_field column:', error.message);
  }
}

// For PostgreSQL, update schema-postgres.sql with IF NOT EXISTS
```

### API Development

#### Creating a new endpoint
```javascript
// backend/routes/api/example.js
const express = require('express');
const router = express.Router();

// GET /api/example
router.get('/', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM example_table');
    res.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/example
router.post('/', requireAuth, requirePermission(2), async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }
    
    const result = await db.run(
      'INSERT INTO example_table (title, content, created_by) VALUES (?, ?, ?)',
      [title, content, req.user.id]
    );
    
    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

## 🧪 Testing

### Manual Testing Checklist

#### Backend API
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test public endpoints
curl http://localhost:3001/api/categories
curl http://localhost:3001/api/announcements

# Test authenticated endpoints (after Steam login)
curl -b cookies.txt http://localhost:3001/api/staff/rules
```

#### Frontend Components
1. **Rules Browser**
   - [ ] Categories load correctly
   - [ ] Search functionality works
   - [ ] Rule navigation and highlighting
   - [ ] Mobile responsive design

2. **Staff Dashboard**
   - [ ] Steam authentication flow
   - [ ] Permission-based UI visibility
   - [ ] CRUD operations for rules/announcements
   - [ ] Image upload functionality

### Database Testing
```bash
# SQLite
sqlite3 backend/database/ddg_prisonrp.db
.tables
SELECT COUNT(*) FROM rules;
SELECT * FROM staff_users;

# PostgreSQL (if using)
psql -h localhost -U ddguser -d ddg_prisonrp
\dt
SELECT COUNT(*) FROM rules;
```

## 🎨 UI/UX Guidelines

### Theme System
```javascript
// Consistent color palette
const theme = {
  colors: {
    primary: '#677bae',
    primaryHover: '#8a9dc9',
    background: '#1a1d23',
    cardBackground: '#34495e',
    text: '#ffffff',
    textSecondary: '#bdc3c7',
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c'
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '32px'
  }
};
```

### Responsive Design
```javascript
// Use consistent breakpoints
const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px'
};

// Example responsive component
const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.medium};
  
  @media (min-width: ${breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: ${breakpoints.desktop}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;
```

## 🔐 Security Guidelines

### Authentication & Authorization
```javascript
// Always check permissions in API routes
router.post('/admin-action', requireAuth, requirePermission(3), (req, res) => {
  // Admin-only action
});

// Validate user input
const validateRuleInput = (req, res, next) => {
  const { title, content, category_id } = req.body;
  
  if (!title || title.length > 200) {
    return res.status(400).json({ error: 'Invalid title' });
  }
  
  if (!content || content.length > 10000) {
    return res.status(400).json({ error: 'Invalid content' });
  }
  
  next();
};
```

### Input Sanitization
```javascript
// Frontend: Sanitize HTML content
import DOMPurify from 'dompurify';

const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: []
  });
};
```

## 📊 Performance Guidelines

### Database Optimization
```javascript
// Use indexes for frequently queried columns
// Add to migration:
'CREATE INDEX IF NOT EXISTS idx_rules_category_id ON rules(category_id)',
'CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority DESC)',

// Limit query results
const getRules = async (categoryId, limit = 50) => {
  return db.all(
    'SELECT * FROM rules WHERE category_id = ? ORDER BY order_index LIMIT ?',
    [categoryId, limit]
  );
};
```

### Frontend Optimization
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return (
    <div>
      {/* Expensive rendering logic */}
    </div>
  );
});

// Lazy load components
const StaffDashboard = React.lazy(() => import('./pages/StaffDashboard'));

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => ({
    ...item,
    processedField: expensiveCalculation(item)
  }));
}, [data]);
```

## 🚀 Deployment

### Environment Configuration
```env
# Development
NODE_ENV=development
DATABASE_TYPE=sqlite
STEAM_API_KEY=your_dev_key

# Production
NODE_ENV=production
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Build Process
```bash
# Backend (production)
cd backend
npm install --production
NODE_ENV=production npm start

# Frontend (build for production)
cd frontend
npm run build
# Serve build/ directory with web server
```

## 🤝 Contributing Guidelines

### Pull Request Process

1. **Create descriptive branch name**
   ```bash
   git checkout -b feature/add-rule-templates
   git checkout -b fix/database-connection-issue
   git checkout -b docs/update-api-documentation
   ```

2. **Write clear commit messages**
   ```bash
   git commit -m "feat: add rule template system for common rule types

   - Add template selection in rule creation modal
   - Include 5 predefined templates (General, PvP, Economy, etc.)
   - Update API to handle template-based rule creation
   - Add template preview functionality"
   ```

3. **Update documentation**
   - Update API documentation if adding new endpoints
   - Update README if changing setup process
   - Add comments for complex code sections

4. **Test thoroughly**
   - Test on both SQLite and PostgreSQL if possible
   - Verify permission system works correctly
   - Check mobile responsiveness
   - Test with different user permission levels

### Code Review Checklist

#### For Reviewers
- [ ] Code follows established patterns and conventions
- [ ] Security considerations are addressed
- [ ] Database changes include proper migrations
- [ ] UI changes maintain theme consistency
- [ ] Performance implications are considered
- [ ] Documentation is updated as needed

#### For Contributors
- [ ] Code is well-commented and readable
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] UI is responsive and accessible
- [ ] Database adapter pattern is followed
- [ ] Permission checks are in place where needed

## 📞 Development Support

### Getting Help
- **Documentation**: Check all guides in `docs/`
- **GitHub Issues**: Report bugs or request features
- **Code Questions**: Create discussion in GitHub Discussions

### Development Environment Issues
- Check [troubleshooting guide](../setup/troubleshooting.md)
- Verify Node.js version compatibility
- Ensure database permissions are correct
- Check port availability (3000, 3001)

---

**Happy coding! 🚀**

*This guide is a living document. Please update it as the project evolves.*