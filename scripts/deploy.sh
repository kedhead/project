#!/bin/bash

# Deployment script for VPS
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Check if VPS_IP and VPS_USER are set
if [ -z "$VPS_IP" ] || [ -z "$VPS_USER" ]; then
    echo "❌ VPS_IP and VPS_USER must be set in .env file"
    exit 1
fi

echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🔄 Stopping existing containers on VPS..."
ssh ${VPS_USER}@${VPS_IP} "cd /var/www/project-management && docker-compose -f docker-compose.prod.yml down || true"

echo "📤 Uploading files to VPS..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.env' \
    ./ ${VPS_USER}@${VPS_IP}:/var/www/project-management/

echo "📋 Copying environment file..."
scp .env ${VPS_USER}@${VPS_IP}:/var/www/project-management/.env

echo "🔧 Running migrations..."
ssh ${VPS_USER}@${VPS_IP} "cd /var/www/project-management/backend && npx prisma migrate deploy"

echo "🐳 Starting Docker containers..."
ssh ${VPS_USER}@${VPS_IP} "cd /var/www/project-management && docker-compose -f docker-compose.prod.yml up -d"

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be available at http://${VPS_IP}"
