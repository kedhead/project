# Deployment Guide

This guide covers deploying the Project Management Suite to your VPS.

## Prerequisites

- VPS with Ubuntu 20.04 or later
- Root or sudo access
- Domain name (optional, for SSL)

## Initial VPS Setup

1. **Run the setup script on your VPS:**

```bash
ssh root@107.173.91.179 'bash -s' < scripts/setup-vps.sh
```

This will install:
- Docker & Docker Compose
- Node.js (for Prisma migrations)
- UFW Firewall
- Create application directories

## Configuration

1. **Update your `.env` file with production values:**

```env
# Database
DB_USER=pmuser
DB_PASSWORD=<strong-password>
DB_NAME=pmdb

# Redis
REDIS_PASSWORD=<strong-redis-password>

# JWT Secrets (generate secure random strings)
JWT_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>

# API URLs
NODE_ENV=production
FRONTEND_URL=http://107.173.91.179
VITE_API_URL=http://107.173.91.179/api

# VPS
VPS_IP=107.173.91.179
VPS_USER=root
```

2. **Generate secure secrets:**

```bash
# On Linux/Mac:
openssl rand -base64 48

# On Windows (PowerShell):
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Deployment

### Option 1: Deploy from Local Machine

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy to VPS
./scripts/deploy.sh
```

### Option 2: Deploy Directly on VPS

```bash
# SSH into VPS
ssh root@107.173.91.179

# Clone repository
cd /var/www/project-management
git clone https://github.com/kedhead/project.git .

# Create .env file
nano .env
# (paste your production environment variables)

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Post-Deployment

### Verify Deployment

```bash
# Check if containers are running
ssh root@107.173.91.179 'docker ps'

# Check logs
ssh root@107.173.91.179 'docker-compose -f /var/www/project-management/docker-compose.prod.yml logs'

# Test health endpoint
curl http://107.173.91.179/health
```

### Access the Application

- Frontend: http://107.173.91.179
- API: http://107.173.91.179/api
- Health Check: http://107.173.91.179/health

## SSL Configuration (Optional)

To enable HTTPS with Let's Encrypt:

```bash
# Install Certbot
ssh root@107.173.91.179
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

## Database Management

### Create Backup

```bash
./scripts/backup.sh
```

### Restore from Backup

```bash
# Copy backup to VPS
scp backups/backup_YYYYMMDD_HHMMSS.sql.gz root@107.173.91.179:/tmp/

# SSH to VPS
ssh root@107.173.91.179

# Restore
cd /var/www/project-management
gunzip /tmp/backup_YYYYMMDD_HHMMSS.sql.gz
docker-compose exec -T postgres psql -U pmuser pmdb < /tmp/backup_YYYYMMDD_HHMMSS.sql
```

## Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Update Application

```bash
# Pull latest code
cd /var/www/project-management
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
cd backend
npx prisma migrate deploy
```

## Monitoring

### Check Resource Usage

```bash
# Disk space
df -h

# Memory
free -h

# Docker stats
docker stats
```

### Database Size

```bash
docker-compose exec postgres psql -U pmuser pmdb -c "SELECT pg_size_pretty(pg_database_size('pmdb'));"
```

## Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check if ports are in use
netstat -tulpn | grep -E ':(80|443|4000|5432|6379)'
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose exec postgres pg_isready -U pmuser

# Test connection
docker-compose exec backend node -e "const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected')).catch(e => console.error(e))"
```

### Permission Issues

```bash
# Fix ownership
chown -R root:root /var/www/project-management

# Fix permissions
chmod -R 755 /var/www/project-management
```

## Security Checklist

- [ ] Strong database passwords
- [ ] Secure JWT secrets (64+ characters)
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled
- [ ] Regular backups configured
- [ ] SSL certificate installed
- [ ] Rate limiting enabled
- [ ] Environment variables secured

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review documentation: `.cursorrules`
- Check GitHub issues: https://github.com/kedhead/project/issues
