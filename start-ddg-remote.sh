#!/bin/bash

echo "🚀 Starting DDG PrisonRP services on Google Cloud..."

gcloud compute ssh ddg-development-server --zone=us-central1-a --command="
echo '📦 Starting backend service...'
cd ~/ddg-prisonrp-rules/backend
pm2 start server.js --name ddg-backend

echo '🎨 Starting frontend service...'
cd ~/ddg-prisonrp-rules/frontend
pm2 start npm --name ddg-frontend -- start

echo '📊 Checking status...'
pm2 status

echo '✅ DDG PrisonRP services started!'
echo 'Frontend: http://34.132.234.56:3000'
echo 'Staff: http://34.132.234.56:3000/staff/staff-management-2024'
" 