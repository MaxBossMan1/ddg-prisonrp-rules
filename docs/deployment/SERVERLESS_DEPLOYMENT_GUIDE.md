# 🚀 DDG PrisonRP - Serverless Deployment Guide

## 📋 **Overview**

This guide will help you deploy the DDG PrisonRP Rules Management System using a cost-effective serverless architecture on Google Cloud Platform.

**Estimated Monthly Cost: $10-20 for low-medium traffic**

### **Architecture Components:**
- **Frontend**: Cloud Storage + CDN (~$1-2/month)
- **Backend**: Cloud Run (~$5-10/month) 
- **Database**: Cloud SQL PostgreSQL (~$7/month)
- **Storage**: Cloud Storage for uploads (~$1/month)

---

## 🔧 **Prerequisites**

1. **Google Cloud Account** with billing enabled
2. **Google Cloud CLI** installed on your machine
3. **Docker** installed (for local testing)
4. **Node.js 18+** installed

---

## 🏗️ **Setup Instructions**

### **Step 1: Google Cloud Project Setup**

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  compute.googleapis.com
```

### **Step 2: Database Setup (Cloud SQL PostgreSQL)**

```bash
# Create Cloud SQL instance (smallest tier for cost optimization)
gcloud sql instances create ddg-prisonrp-db \
  --tier=db-f1-micro \
  --region=us-central1 \
  --database-version=POSTGRES_14 \
  --storage-size=10GB \
  --storage-type=HDD \
  --no-backup

# Create database user
gcloud sql users create ddguser \
  --instance=ddg-prisonrp-db \
  --password=your-secure-password

# Create database
gcloud sql databases create ddg_prisonrp \
  --instance=ddg-prisonrp-db

# Get connection name for later use
gcloud sql instances describe ddg-prisonrp-db --format="value(connectionName)"
```

### **Step 3: Frontend Deployment (Cloud Storage + CDN)**

```bash
# Create bucket for frontend
gsutil mb gs://ddg-prisonrp-frontend

# Set up static website hosting
gsutil web set -m index.html -e 404.html gs://ddg-prisonrp-frontend

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://ddg-prisonrp-frontend

# Build and deploy frontend
cd frontend
npm ci
npm run build
gsutil -m rsync -r -d build gs://ddg-prisonrp-frontend

# Set cache control headers
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://ddg-prisonrp-frontend/static/**
gsutil -m setmeta -h "Cache-Control:no-cache" gs://ddg-prisonrp-frontend/*.html
```

### **Step 4: Backend Deployment (Cloud Run)**

```bash
# Build and deploy backend
gcloud builds submit --config cloudbuild.yaml

# Set environment variables for Cloud Run
gcloud run services update ddg-prisonrp-backend \
  --region=us-central1 \
  --set-env-vars="DATABASE_TYPE=postgres" \
  --set-env-vars="DATABASE_URL=postgresql://ddguser:your-secure-password@/ddg_prisonrp?host=/cloudsql/$(gcloud sql instances describe ddg-prisonrp-db --format='value(connectionName)')" \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="FRONTEND_URL=https://storage.googleapis.com/ddg-prisonrp-frontend" \
  --set-env-vars="STEAM_API_KEY=your-steam-api-key" \
  --set-env-vars="SESSION_SECRET=your-secure-session-secret" \
  --add-cloudsql-instances=$(gcloud sql instances describe ddg-prisonrp-db --format='value(connectionName)')
```

### **Step 5: Custom Domain Setup (Optional but Recommended)**

```bash
# Map custom domain to frontend bucket
gcloud compute url-maps create ddg-frontend-lb \
  --default-backend-bucket=ddg-prisonrp-frontend

# Map custom domain to backend Cloud Run service
gcloud run domain-mappings create \
  --service=ddg-prisonrp-backend \
  --domain=api.yourdomain.com \
  --region=us-central1
```

---

## ⚙️ **Environment Configuration**

### **Production Environment Variables**

Create these in Cloud Run service:

```env
# Database
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://ddguser:password@/ddg_prisonrp?host=/cloudsql/PROJECT_ID:us-central1:ddg-prisonrp-db

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Steam Authentication
STEAM_API_KEY=your-steam-api-key-here
STEAM_REALM=https://api.yourdomain.com
STEAM_RETURN_URL=https://api.yourdomain.com/auth/steam/return

# Security
SESSION_SECRET=your-super-secure-session-secret

# Staff Management
STAFF_SECRET_URL=staff-management-2024

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=./uploads
```

---

## 🔄 **CI/CD Pipeline Setup**

### **Automated Deployment with Cloud Build**

Create trigger for automatic deployments:

```bash
# Backend trigger
gcloud builds triggers create github \
  --repo-name=ddg-prisonrp-rules \
  --repo-owner=MaxBossMan1 \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml

# Frontend trigger
gcloud builds triggers create github \
  --repo-name=ddg-prisonrp-rules \
  --repo-owner=MaxBossMan1 \
  --branch-pattern="^main$" \
  --build-config=frontend-cloudbuild.yaml
```

---

## 📊 **Monitoring & Logging**

### **Set up monitoring:**

```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# Create log-based metrics for errors
gcloud logging metrics create backend_errors \
  --description="Backend error count" \
  --log-filter='resource.type="cloud_run_revision" AND severity>=ERROR'
```

### **Cost Monitoring:**

```bash
# Set up budget alerts
gcloud billing budgets create \
  --billing-account=your-billing-account-id \
  --display-name="DDG PrisonRP Budget" \
  --budget-amount=25 \
  --threshold-rules-percent=50,90,100
```

---

## 🔒 **Security Configuration**

### **Cloud Run Security:**

```bash
# Update service with security settings
gcloud run services update ddg-prisonrp-backend \
  --region=us-central1 \
  --ingress=all \
  --no-allow-unauthenticated \
  --service-account=ddg-service-account@project-id.iam.gserviceaccount.com
```

### **Database Security:**

```bash
# Enable database encryption
gcloud sql instances patch ddg-prisonrp-db \
  --database-flags=log_statement=all

# Set up automated backups
gcloud sql instances patch ddg-prisonrp-db \
  --backup-start-time=03:00 \
  --enable-bin-log
```

---

## 🚀 **Quick Deployment Script**

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying DDG PrisonRP to Google Cloud..."

# Build and deploy backend
echo "📦 Building backend..."
gcloud builds submit --config cloudbuild.yaml

# Build and deploy frontend
echo "🎨 Building frontend..."
gcloud builds submit --config frontend-cloudbuild.yaml

# Initialize database if needed
echo "🗄️ Initializing database..."
gcloud run jobs execute init-database --region=us-central1 --wait

echo "✅ Deployment completed!"
echo "Frontend: https://storage.googleapis.com/ddg-prisonrp-frontend"
echo "Backend: $(gcloud run services describe ddg-prisonrp-backend --region=us-central1 --format='value(status.url)')"
```

---

## 📈 **Scaling Configuration**

### **Auto-scaling settings:**

```bash
# Configure Cloud Run auto-scaling
gcloud run services update ddg-prisonrp-backend \
  --region=us-central1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --cpu=1000m \
  --memory=512Mi
```

---

## 💰 **Cost Optimization Tips**

1. **Cloud Run**: Scales to zero when not in use
2. **Cloud SQL**: Use smallest tier (db-f1-micro) for development
3. **Storage**: Enable lifecycle policies for old files
4. **CDN**: Use Cloud CDN for global content delivery

### **Set up lifecycle policies:**

```bash
# Create lifecycle policy for storage
gsutil lifecycle set lifecycle.json gs://ddg-prisonrp-frontend
```

Create `lifecycle.json`:
```json
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 365}
    }
  ]
}
```

---

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Database Connection Issues:**
   ```bash
   # Check Cloud SQL proxy connection
   cloud_sql_proxy -instances=PROJECT_ID:us-central1:ddg-prisonrp-db=tcp:5432
   ```

2. **Frontend Not Loading:**
   ```bash
   # Check bucket permissions
   gsutil iam get gs://ddg-prisonrp-frontend
   ```

3. **Backend Deployment Fails:**
   ```bash
   # Check build logs
   gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")
   ```

### **Health Checks:**

- **Frontend**: https://storage.googleapis.com/ddg-prisonrp-frontend
- **Backend**: https://your-backend-url/health
- **Database**: Check Cloud SQL console

---

## 📞 **Support & Maintenance**

### **Regular Maintenance Tasks:**

1. **Weekly**: Check error logs and performance metrics
2. **Monthly**: Review costs and optimize if needed
3. **Quarterly**: Update dependencies and security patches

### **Backup Strategy:**

```bash
# Manual database backup
gcloud sql export sql ddg-prisonrp-db gs://ddg-backups/backup-$(date +%Y%m%d).sql \
  --database=ddg_prisonrp
```

---

**Estimated Setup Time**: 2-3 hours
**Monthly Maintenance**: 30 minutes
**Cost Range**: $10-20/month for typical usage

*Last Updated: December 2024*