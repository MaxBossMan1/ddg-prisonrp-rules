# Docker Deployment Guide

This guide covers deploying the DDG PrisonRP Rules Management System using Docker containers.

## 🎯 Overview

**Recommended For:**
- Development and testing environments
- Teams familiar with containerization
- Scalable deployments with orchestration
- Consistent environment across different platforms

**Benefits:**
- Easy deployment and scaling
- Consistent environment across platforms
- Simple rollbacks and updates
- Isolated application environment

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+
- Git

## 🚀 Quick Start with Docker Compose

### Single Command Deployment

1. **Clone and start**
   ```bash
   git clone <repository-url>
   cd ddg-prisonrp-rules
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   docker-compose up -d
   ```

2. **Access application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🏗️ Manual Docker Setup

### Step 1: Backend Container

1. **Build backend image**
   ```bash
   docker build -t ddg-prisonrp-backend .
   ```

2. **Run backend container**
   ```bash
   docker run -d \
     --name ddg-backend \
     -p 3001:3001 \
     -e NODE_ENV=production \
     -e DATABASE_TYPE=sqlite \
     -e STEAM_API_KEY=your_steam_api_key \
     -e SESSION_SECRET=your_session_secret \
     -v $(pwd)/backend/database:/app/database \
     -v $(pwd)/backend/uploads:/app/uploads \
     ddg-prisonrp-backend
   ```

### Step 2: Frontend Container

1. **Create frontend Dockerfile**
   ```dockerfile
   # Frontend Dockerfile
   FROM node:18-alpine as build
   
   WORKDIR /app
   COPY frontend/package*.json ./
   RUN npm ci --only=production
   
   COPY frontend/ .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and run frontend**
   ```bash
   docker build -f Dockerfile.frontend -t ddg-prisonrp-frontend ./frontend
   docker run -d --name ddg-frontend -p 3000:80 ddg-prisonrp-frontend
   ```

## 🐳 Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: ddg-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_TYPE=sqlite
      - DATABASE_PATH=/app/database/ddg_prisonrp.db
      - STEAM_API_KEY=${STEAM_API_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
      - FRONTEND_URL=http://localhost:3000
      - STAFF_SECRET_URL=${STAFF_SECRET_URL}
    volumes:
      - ./backend/database:/app/database
      - ./backend/uploads:/app/uploads
      - ./backend/.env:/app/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ddg-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  # Optional: PostgreSQL for production
  postgres:
    image: postgres:14-alpine
    container_name: ddg-postgres
    environment:
      - POSTGRES_DB=ddg_prisonrp
      - POSTGRES_USER=ddguser
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: ddg-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Environment Configuration

Create `.env` file in project root:
```env
# Application
STEAM_API_KEY=your_steam_api_key_here
SESSION_SECRET=your_super_secure_session_secret
STAFF_SECRET_URL=your-secret-staff-path

# Database (if using PostgreSQL)
POSTGRES_PASSWORD=secure_database_password

# Discord (optional)
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

## 🚀 Production Docker Setup

### Multi-Stage Production Build

Create optimized `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      target: production
    environment:
      - NODE_ENV=production
      - DATABASE_TYPE=postgres
      - DATABASE_URL=postgresql://ddguser:${POSTGRES_PASSWORD}@postgres:5432/ddg_prisonrp
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      target: production
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=ddg_prisonrp
      - POSTGRES_USER=ddguser
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  uploads_data:
```

### Production Nginx Configuration

Create `nginx/prod.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API and Auth
        location ~ ^/(api|auth)/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File uploads
        location /uploads/ {
            proxy_pass http://backend;
            client_max_body_size 10M;
        }
    }
}
```

## 🔧 Docker Commands Reference

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Execute commands in container
docker-compose exec backend npm run dev
```

### Production
```bash
# Deploy production environment
docker-compose -f docker-compose.prod.yml up -d

# Update deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Check container status
docker-compose ps

# View resource usage
docker stats

# Check logs for errors
docker-compose logs backend | grep ERROR
```

### Database Backup (PostgreSQL)
```bash
# Create backup
docker exec ddg-postgres pg_dump -U ddguser ddg_prisonrp > backup.sql

# Restore backup
docker exec -i ddg-postgres psql -U ddguser ddg_prisonrp < backup.sql
```

### Database Backup (SQLite)
```bash
# Backup SQLite database
docker cp ddg-backend:/app/database/ddg_prisonrp.db ./backup.db

# Restore SQLite database
docker cp ./backup.db ddg-backend:/app/database/ddg_prisonrp.db
```

## 🚀 Container Orchestration

### Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml ddg-stack

# Scale services
docker service scale ddg-stack_backend=3
```

### Kubernetes Deployment

Create `k8s/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ddg-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ddg-backend
  template:
    metadata:
      labels:
        app: ddg-backend
    spec:
      containers:
      - name: backend
        image: ddg-prisonrp-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_TYPE
          value: "postgres"
---
apiVersion: v1
kind: Service
metadata:
  name: ddg-backend-service
spec:
  selector:
    app: ddg-backend
  ports:
  - port: 3001
    targetPort: 3001
  type: LoadBalancer
```

## 🔒 Security Best Practices

### Container Security
1. **Use non-root user in containers**
2. **Scan images for vulnerabilities**
3. **Keep base images updated**
4. **Use multi-stage builds to reduce attack surface**

### Secrets Management
```bash
# Use Docker secrets for sensitive data
echo "your_steam_api_key" | docker secret create steam_api_key -
echo "your_session_secret" | docker secret create session_secret -
```

## 🆘 Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   docker logs ddg-backend
   # Check for configuration errors
   ```

2. **Database connection issues**
   ```bash
   # Check if postgres container is running
   docker-compose ps postgres
   
   # Test connection
   docker-compose exec backend node -e "console.log('Testing DB connection...')"
   ```

3. **Port conflicts**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3001
   
   # Change ports in docker-compose.yml
   ```

## 📞 Support

For Docker-specific issues:
- Check container logs: `docker-compose logs [service]`
- Verify container health: `docker-compose ps`
- Monitor resource usage: `docker stats`

---

**Estimated Setup Time:** 30 minutes - 1 hour
**Maintenance:** Minimal (automated updates possible)
**Difficulty Level:** Beginner to Intermediate