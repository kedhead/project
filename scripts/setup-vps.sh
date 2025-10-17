#!/bin/bash

# Initial VPS setup script
# Run this once on your VPS to install Docker and prepare the environment
# Usage: ssh root@VPS_IP 'bash -s' < scripts/setup-vps.sh

set -e

echo "🔧 Setting up VPS for Project Management Suite..."

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start Docker
echo "▶️  Starting Docker..."
systemctl start docker
systemctl enable docker

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/project-management
chmod -R 755 /var/www

# Install Node.js (for Prisma migrations)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install UFW firewall
echo "🔥 Configuring firewall..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo "✅ VPS setup completed!"
echo "📝 Next steps:"
echo "  1. Copy your .env file to the VPS"
echo "  2. Run the deploy script from your local machine"
echo "  3. Configure SSL certificates (optional)"
