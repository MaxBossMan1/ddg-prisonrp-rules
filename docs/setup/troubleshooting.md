# Troubleshooting Guide

This guide covers common issues and solutions for the DDG PrisonRP Rules Management System.

## 🎯 Quick Diagnostics

### Check System Status

1. **Verify services are running**
   ```bash
   # Check backend process
   curl http://localhost:3001/health
   
   # Check frontend
   curl http://localhost:3000
   
   # Check database connection
   ls -la backend/database/
   ```

2. **Check logs for errors**
   ```bash
   # Backend logs (development)
   npm run dev
   
   # Backend logs (production with PM2)
   pm2 logs ddg-prisonrp-backend
   
   # Frontend logs
   npm start
   ```

## 🔧 Common Backend Issues

### Database Connection Problems

#### **Issue: "ENOENT: no such file or directory" (SQLite)**
```
Error: ENOENT: no such file or directory, open './database/ddg_prisonrp.db'
```

**Solution:**
```bash
# Create database directory
mkdir -p backend/database

# Check permissions
chmod 755 backend/database

# Run database initialization
cd backend
npm run init-db  # If available, or start server to auto-create
```

#### **Issue: PostgreSQL connection refused**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. **Check PostgreSQL service**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Verify connection string**
   ```bash
   # Test connection manually
   psql -h localhost -U ddguser -d ddg_prisonrp
   ```

3. **Check environment variables**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:port/database
   ```

### Steam Authentication Issues

#### **Issue: Steam login redirects to error page**

**Common causes and solutions:**

1. **Invalid Steam API Key**
   ```bash
   # Verify your Steam API key at:
   # https://steamcommunity.com/dev/apikey
   
   # Check .env file
   grep STEAM_API_KEY backend/.env
   ```

2. **Wrong return URL**
   ```env
   # Ensure these match your domain in .env:
   STEAM_REALM=https://yourdomain.com
   STEAM_RETURN_URL=https://yourdomain.com/auth/steam/return
   ```

3. **Missing session secret**
   ```env
   # Add strong session secret
   SESSION_SECRET=your-super-secure-random-string-here
   ```

#### **Issue: User not authorized after Steam login**

**Solution:**
```bash
# Add user to staff_users table
sqlite3 backend/database/ddg_prisonrp.db
# Or for PostgreSQL:
psql -h localhost -U ddguser -d ddg_prisonrp

# SQL query:
INSERT INTO staff_users (steam_id, steam_username, permission_level) 
VALUES ('76561198000000000', 'YourUsername', 'admin');
```

### File Upload Issues

#### **Issue: Images not uploading**

**Solutions:**
1. **Check upload directory permissions**
   ```bash
   mkdir -p backend/uploads
   chmod 755 backend/uploads
   ```

2. **Verify file size limits**
   ```env
   # In .env file
   MAX_FILE_SIZE=10mb
   ```

3. **Check disk space**
   ```bash
   df -h
   ```

### Port Conflicts

#### **Issue: Port already in use**
```
Error: listen EADDRINUSE :::3001
```

**Solutions:**
1. **Find process using port**
   ```bash
   lsof -i :3001
   netstat -tulpn | grep :3001
   ```

2. **Kill conflicting process**
   ```bash
   sudo kill -9 [PID]
   ```

3. **Change port in configuration**
   ```env
   # In .env file
   PORT=3002
   ```

## 🎨 Frontend Issues

### Build Failures

#### **Issue: React build fails**
```
npm ERR! Failed at the react-scripts build
```

**Solutions:**
1. **Clear cache and reinstall**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check Node.js version**
   ```bash
   node --version  # Should be 18.0.0 or higher
   npm --version
   ```

3. **Memory issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

### Proxy Configuration Issues

#### **Issue: API calls fail in development**
```
Failed to fetch: http://localhost:3000/api/...
```

**Solution:** Check `frontend/src/setupProxy.js`:
```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );
  
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );
};
```

### Static File Issues

#### **Issue: Images/assets not loading**

**Solutions:**
1. **Check public folder structure**
   ```bash
   ls -la frontend/public/
   # Should contain favicon.ico, index.html, etc.
   ```

2. **Verify build output**
   ```bash
   ls -la frontend/build/static/
   ```

3. **Check browser network tab** for 404 errors

## 🚀 Deployment Issues

### Docker Problems

#### **Issue: Container won't start**

**Solutions:**
1. **Check Docker logs**
   ```bash
   docker logs ddg-backend
   docker-compose logs backend
   ```

2. **Verify Dockerfile**
   ```bash
   # Test build locally
   docker build -t test .
   docker run -it test /bin/sh
   ```

3. **Check environment variables**
   ```bash
   docker exec ddg-backend env | grep -E "(DATABASE|STEAM|SESSION)"
   ```

### Nginx Configuration Issues

#### **Issue: 502 Bad Gateway**

**Solutions:**
1. **Check backend service**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Verify Nginx configuration**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Check Nginx logs**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### SSL Certificate Issues

#### **Issue: Certificate errors**

**Solutions:**
1. **Renew Let's Encrypt certificate**
   ```bash
   sudo certbot renew --dry-run
   sudo certbot renew
   ```

2. **Check certificate validity**
   ```bash
   openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout
   ```

## 📊 Performance Issues

### Slow Database Queries

**Solutions:**
1. **Check database size**
   ```bash
   # SQLite
   ls -lh backend/database/ddg_prisonrp.db
   
   # PostgreSQL
   psql -c "SELECT pg_size_pretty(pg_database_size('ddg_prisonrp'));"
   ```

2. **Optimize database**
   ```sql
   -- SQLite
   VACUUM;
   ANALYZE;
   
   -- PostgreSQL
   VACUUM ANALYZE;
   ```

3. **Check for missing indexes**
   ```sql
   -- Add indexes if missing
   CREATE INDEX idx_rules_category_id ON rules(category_id);
   CREATE INDEX idx_announcements_priority ON announcements(priority);
   ```

### High Memory Usage

**Solutions:**
1. **Check Node.js memory usage**
   ```bash
   ps aux | grep node
   top -p $(pgrep node)
   ```

2. **Restart application**
   ```bash
   pm2 restart ddg-prisonrp-backend
   ```

3. **Increase server memory** if needed

## 🔍 Debugging Tools

### Enable Debug Logging

**Backend debugging:**
```env
# Add to .env
DEBUG=app:*
NODE_ENV=development
```

**Frontend debugging:**
```bash
# Enable React dev tools
export REACT_APP_DEBUG=true
npm start
```

### Database Debugging

**SQLite:**
```bash
# Open database directly
sqlite3 backend/database/ddg_prisonrp.db
.tables
.schema rules
SELECT * FROM rules LIMIT 5;
```

**PostgreSQL:**
```bash
# Connect and debug
psql -h localhost -U ddguser -d ddg_prisonrp
\dt  -- List tables
\d rules  -- Describe table
SELECT version();
```

### Network Debugging

**Check API endpoints:**
```bash
# Test API endpoints
curl -v http://localhost:3001/api/categories
curl -v http://localhost:3001/health

# Test with authentication
curl -v -b cookies.txt http://localhost:3001/api/staff/rules
```

## 📞 Getting Help

### Information to Gather

When seeking help, include:

1. **System information**
   ```bash
   node --version
   npm --version
   uname -a  # Linux/Mac
   ```

2. **Error logs**
   ```bash
   # Copy recent error logs
   pm2 logs ddg-prisonrp-backend --lines 50
   ```

3. **Configuration**
   ```bash
   # Share .env structure (without secrets)
   grep -v "API_KEY\|SECRET\|PASSWORD" backend/.env
   ```

### Support Channels

- **GitHub Issues**: For bugs and feature requests
- **Documentation**: Check all guides in `docs/`
- **Community**: Discord or community forums

## 🛠️ Recovery Procedures

### Database Recovery

**SQLite backup restore:**
```bash
# Stop application
pm2 stop ddg-prisonrp-backend

# Restore from backup
cp backup/ddg_prisonrp_backup.db backend/database/ddg_prisonrp.db

# Start application
pm2 start ddg-prisonrp-backend
```

**PostgreSQL recovery:**
```bash
# Stop application
pm2 stop ddg-prisonrp-backend

# Restore database
psql -h localhost -U ddguser -d ddg_prisonrp < backup.sql

# Start application
pm2 start ddg-prisonrp-backend
```

### Factory Reset

```bash
# ⚠️ This will delete all data!

# Stop services
pm2 stop all
docker-compose down

# Remove databases
rm backend/database/ddg_prisonrp.db

# Remove uploads
rm -rf backend/uploads/*

# Restart and reinitialize
npm start  # Backend will recreate database
```

---

**Last Updated:** January 2025  
**For urgent issues:** Check system logs first, then consult this guide