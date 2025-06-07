# VPS/Traditional Server Deployment Guide

This guide covers deploying the DDG PrisonRP Rules Management System on a traditional VPS or dedicated server.

## 🎯 Overview

**Recommended For:**
- Small to medium deployments
- Organizations with existing server infrastructure
- Teams preferring traditional server management
- Deployments requiring full server control

**Estimated Monthly Cost:** $5-20 depending on VPS provider and specs

## 📋 Server Requirements

### Minimum Specifications
- **CPU:** 1 core (2+ recommended)
- **RAM:** 1GB (2GB+ recommended)
- **Storage:** 10GB SSD
- **OS:** Ubuntu 20.04+ LTS or CentOS 8+
- **Network:** Static IP address

### Recommended Specifications
- **CPU:** 2+ cores
- **RAM:** 4GB+
- **Storage:** 20GB+ SSD
- **Bandwidth:** Unmetered or 1TB+

## 🚀 Deployment Steps

### Step 1: Server Setup

1. **Update system packages**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js 18+ and npm**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

3. **Install additional dependencies**
   ```bash
   sudo apt install -y git nginx certbot python3-certbot-nginx ufw
   ```

4. **Configure firewall**
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

### Step 2: Application Setup

1. **Create application user**
   ```bash
   sudo useradd -m -s /bin/bash ddgapp
   sudo usermod -aG sudo ddgapp
   ```

2. **Clone and setup application**
   ```bash
   sudo su - ddgapp
   git clone https://github.com/your-username/ddg-prisonrp-rules.git
   cd ddg-prisonrp-rules
   ```

3. **Backend setup**
   ```bash
   cd backend
   npm install --production
   cp env.example .env
   
   # Edit .env file with production settings
   nano .env
   ```

4. **Frontend build**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

### Step 3: Production Environment Configuration

Edit `backend/.env`:
```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Database (SQLite for simple deployment)
DATABASE_TYPE=sqlite
DATABASE_PATH=/home/ddgapp/ddg-prisonrp-rules/backend/database/ddg_prisonrp.db

# Authentication
STEAM_API_KEY=your_steam_api_key_here
SESSION_SECRET=your_super_secure_session_secret_here

# Application URLs
FRONTEND_URL=https://yourdomain.com
STEAM_REALM=https://yourdomain.com
STEAM_RETURN_URL=https://yourdomain.com/auth/steam/return

# Staff Management
STAFF_SECRET_URL=your-secret-staff-path-2024

# Discord Integration (optional)
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=/home/ddgapp/ddg-prisonrp-rules/backend/uploads
```

### Step 4: Process Management (PM2)

1. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

2. **Create PM2 ecosystem file**
   ```bash
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'ddg-prisonrp-backend',
       script: './backend/server.js',
       cwd: '/home/ddgapp/ddg-prisonrp-rules',
       instances: 1,
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   EOF
   ```

3. **Start application with PM2**
   ```bash
   mkdir -p logs
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Step 5: Nginx Configuration

1. **Create Nginx configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/ddg-prisonrp
   ```

2. **Add configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       # Frontend static files
       location / {
           root /home/ddgapp/ddg-prisonrp-rules/frontend/build;
           try_files $uri $uri/ /index.html;
           
           # Cache static assets
           location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
               expires 1y;
               add_header Cache-Control "public, immutable";
           }
       }
       
       # API proxy
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Steam auth routes
       location /auth/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
       
       # File uploads
       location /uploads/ {
           proxy_pass http://localhost:3001;
           client_max_body_size 10M;
       }
       
       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "no-referrer-when-downgrade" always;
       add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
   }
   ```

3. **Enable site and test configuration**
   ```bash
   sudo ln -s /etc/nginx/sites-available/ddg-prisonrp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Step 6: SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔧 Database Options

### Option 1: SQLite (Recommended for Small Deployments)
- No additional setup required
- File-based database included with application
- Automatic backups with simple file copies

### Option 2: PostgreSQL (Recommended for Production)

1. **Install PostgreSQL**
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create database and user**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE ddg_prisonrp;
   CREATE USER ddguser WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE ddg_prisonrp TO ddguser;
   \q
   ```

3. **Update environment variables**
   ```env
   DATABASE_TYPE=postgres
   DATABASE_URL=postgresql://ddguser:secure_password@localhost:5432/ddg_prisonrp
   ```

## 📊 Monitoring and Maintenance

### Log Management
```bash
# View application logs
pm2 logs ddg-prisonrp-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Regular Maintenance Tasks

1. **Weekly: Update system packages**
   ```bash
   sudo apt update && sudo apt upgrade
   sudo reboot  # if kernel updates
   ```

2. **Monthly: Certificate renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

3. **Database backups (SQLite)**
   ```bash
   # Create backup script
   cat > /home/ddgapp/backup.sh << EOF
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   cp /home/ddgapp/ddg-prisonrp-rules/backend/database/ddg_prisonrp.db \
      /home/ddgapp/backups/ddg_prisonrp_$DATE.db
   
   # Keep only last 30 days of backups
   find /home/ddgapp/backups -name "ddg_prisonrp_*.db" -mtime +30 -delete
   EOF
   
   chmod +x /home/ddgapp/backup.sh
   
   # Add to crontab for daily backups
   echo "0 2 * * * /home/ddgapp/backup.sh" | crontab -
   ```

## 🚀 Deployment Automation

Create a deployment script `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying DDG PrisonRP..."

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install --production

# Rebuild frontend
cd ../frontend
npm install
npm run build

# Restart application
pm2 restart ddg-prisonrp-backend

# Reload Nginx
sudo nginx -s reload

echo "✅ Deployment completed!"
```

## 🔒 Security Hardening

### Additional Security Measures

1. **SSH Key Authentication**
   ```bash
   # Disable password authentication
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart ssh
   ```

2. **Fail2Ban Protection**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Regular Security Updates**
   ```bash
   # Enable automatic security updates
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure unattended-upgrades
   ```

## 🆘 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   pm2 logs ddg-prisonrp-backend
   # Check for environment variable issues or database connection problems
   ```

2. **502 Bad Gateway**
   ```bash
   # Check if backend is running
   pm2 status
   # Check Nginx configuration
   sudo nginx -t
   ```

3. **Database connection issues**
   ```bash
   # Check database file permissions (SQLite)
   ls -la /home/ddgapp/ddg-prisonrp-rules/backend/database/
   
   # Test PostgreSQL connection
   psql -h localhost -U ddguser -d ddg_prisonrp
   ```

## 📞 Support

For additional help:
- Check application logs: `pm2 logs`
- Review Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify system resources: `htop` or `top`

---

**Estimated Deployment Time:** 2-4 hours
**Maintenance Time:** 30 minutes/month
**Difficulty Level:** Intermediate