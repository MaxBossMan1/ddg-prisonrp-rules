#!/bin/bash
set -e

echo "🚀 DDG PrisonRP - Serverless Deployment Script"
echo "=============================================="

# Check if required tools are installed
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if ! command -v gcloud &> /dev/null; then
        echo "❌ Google Cloud CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install it first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install it first."
        exit 1
    fi
    
    echo "✅ All dependencies found"
}

# Set up environment variables
setup_environment() {
    echo "⚙️ Setting up environment..."
    
    # Get project ID
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        echo "❌ No Google Cloud project selected. Please run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    echo "📍 Using project: $PROJECT_ID"
    
    # Set region
    REGION="us-central1"
    echo "📍 Using region: $REGION"
}

# Enable required APIs
enable_apis() {
    echo "🔧 Enabling required Google Cloud APIs..."
    
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        sqladmin.googleapis.com \
        storage.googleapis.com \
        compute.googleapis.com
    
    echo "✅ APIs enabled"
}

# Deploy backend to Cloud Run
deploy_backend() {
    echo "📦 Deploying backend to Cloud Run..."
    
    # Build and deploy
    gcloud builds submit --config cloudbuild.yaml
    
    echo "✅ Backend deployed to Cloud Run"
}

# Deploy frontend to Cloud Storage
deploy_frontend() {
    echo "🎨 Deploying frontend to Cloud Storage..."
    
    # Check if bucket exists, create if not
    if ! gsutil ls gs://ddg-prisonrp-frontend &> /dev/null; then
        echo "Creating storage bucket..."
        gsutil mb gs://ddg-prisonrp-frontend
        gsutil web set -m index.html -e 404.html gs://ddg-prisonrp-frontend
        gsutil iam ch allUsers:objectViewer gs://ddg-prisonrp-frontend
    fi
    
    # Build and deploy frontend
    gcloud builds submit --config frontend-cloudbuild.yaml
    
    echo "✅ Frontend deployed to Cloud Storage"
}

# Set up database
setup_database() {
    echo "🗄️ Setting up Cloud SQL database..."
    
    # Check if instance exists
    if ! gcloud sql instances describe ddg-prisonrp-db --region=$REGION &> /dev/null; then
        echo "Creating Cloud SQL instance..."
        gcloud sql instances create ddg-prisonrp-db \
            --tier=db-f1-micro \
            --region=$REGION \
            --database-version=POSTGRES_14 \
            --storage-size=10GB \
            --storage-type=HDD \
            --no-backup
        
        echo "Creating database user..."
        gcloud sql users create ddguser \
            --instance=ddg-prisonrp-db \
            --password=changeme-secure-password
        
        echo "Creating database..."
        gcloud sql databases create ddg_prisonrp \
            --instance=ddg-prisonrp-db
    else
        echo "Cloud SQL instance already exists"
    fi
    
    echo "✅ Database setup complete"
}

# Configure Cloud Run service
configure_backend() {
    echo "⚙️ Configuring Cloud Run service..."
    
    CONNECTION_NAME=$(gcloud sql instances describe ddg-prisonrp-db --format='value(connectionName)')
    
    gcloud run services update ddg-prisonrp-backend \
        --region=$REGION \
        --set-env-vars="DATABASE_TYPE=postgres" \
        --set-env-vars="NODE_ENV=production" \
        --set-env-vars="FRONTEND_URL=https://storage.googleapis.com/ddg-prisonrp-frontend" \
        --add-cloudsql-instances=$CONNECTION_NAME \
        --allow-unauthenticated
    
    echo "✅ Backend configuration complete"
}

# Display URLs
show_urls() {
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================="
    
    BACKEND_URL=$(gcloud run services describe ddg-prisonrp-backend --region=$REGION --format='value(status.url)')
    FRONTEND_URL="https://storage.googleapis.com/ddg-prisonrp-frontend"
    
    echo "🌐 Frontend URL: $FRONTEND_URL"
    echo "🔧 Backend URL: $BACKEND_URL"
    echo "🛠️ Staff Dashboard: $FRONTEND_URL/staff/staff-management-2024"
    echo ""
    echo "⚠️ Don't forget to:"
    echo "1. Update your Steam API key in Cloud Run environment variables"
    echo "2. Update the database password (currently set to 'changeme-secure-password')"
    echo "3. Configure your custom domain if desired"
    echo "4. Set up monitoring and alerting"
    echo ""
    echo "💰 Estimated monthly cost: $10-20"
}

# Show help
show_help() {
    echo "DDG PrisonRP Serverless Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --backend-only    Deploy only the backend"
    echo "  --frontend-only   Deploy only the frontend"
    echo "  --database-only   Set up only the database"
    echo "  --help           Show this help message"
    echo ""
    echo "Full deployment (default): Deploys everything"
}

# Main execution
main() {
    case "${1:-}" in
        --help)
            show_help
            exit 0
            ;;
        --backend-only)
            check_dependencies
            setup_environment
            deploy_backend
            configure_backend
            ;;
        --frontend-only)
            check_dependencies
            setup_environment
            deploy_frontend
            ;;
        --database-only)
            check_dependencies
            setup_environment
            setup_database
            ;;
        *)
            # Full deployment
            check_dependencies
            setup_environment
            enable_apis
            setup_database
            deploy_backend
            deploy_frontend
            configure_backend
            show_urls
            ;;
    esac
}

# Run main function
main "$@"