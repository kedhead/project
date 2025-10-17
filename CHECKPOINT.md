# Project Checkpoint - Session Recovery Document

**Date:** 2025-10-17
**Status:** Phase 1 Complete - Authentication Working
**VPS:** 107.173.91.179
**GitHub:** https://github.com/kedhead/project

---

## Current Status

### ✅ Completed Features

1. **Authentication System**
   - User registration working (POST /api/auth/register)
   - User login working (POST /api/auth/login)
   - JWT token-based authentication
   - Bcrypt password hashing (12 rounds)
   - Refresh token mechanism (15m access, 7d refresh)
   - Protected routes on frontend

2. **Infrastructure**
   - Docker Compose setup with all services running
   - PostgreSQL database with complete schema
   - Redis cache server
   - Nginx reverse proxy
   - Node.js backend (Express + TypeScript)
   - React frontend (Vite + TypeScript + TailwindCSS)

3. **Database**
   - Prisma ORM configured
   - Complete schema migrated to PostgreSQL
   - Tables: User, Team, Project, Task, TaskDependency
   - Enums: UserRole, TeamRole, TaskStatus, TaskPriority, DependencyType

---

## Deployment Information

### VPS Credentials
- **IP:** 107.173.91.179
- **User:** root
- **Password:** rq1226YHTio6mVgJ7X
- **Directory:** /var/www/project-management

### URLs
- **Frontend:** http://107.173.91.179
- **API:** http://107.173.91.179/api
- **Health Check:** http://107.173.91.179/health
- **Backend Direct:** http://107.173.91.179:4000

### Docker Services
All services running via `docker-compose.dev.yml`:
- `project-management-backend-1` - Node.js backend (port 4000)
- `project-management-frontend-1` - React frontend
- `project-management-postgres-1` - PostgreSQL database (port 5432)
- `project-management-redis-1` - Redis cache (port 6379)
- `project-management-nginx-1` - Nginx reverse proxy (port 80)

---

## Environment Configuration

### Backend Environment (.env on VPS)
```env
# Database
DB_USER=pmuser
DB_PASSWORD=SecurePass2024!ProjMgmt
DB_NAME=pmdb
DATABASE_URL=postgresql://pmuser:SecurePass2024!ProjMgmt@postgres:5432/pmdb

# Redis
REDIS_PASSWORD=RedisSecure2024!Cache
REDIS_URL=redis://:RedisSecure2024!Cache@redis:6379

# JWT Secrets
JWT_SECRET=b3JnYW5pemF0aW9uX3Byb2plY3RfbWFuYWdlbWVudF9qd3Rfc2VjcmV0XzIwMjRfc3VwZXJfc2VjdXJl
JWT_REFRESH_SECRET=cmVmcmVzaF90b2tlbl9zZWNyZXRfZm9yX3Byb2plY3RfbWFuYWdlbWVudF9zeXN0ZW1fMjAyNF9zZWN1cmU=
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# API Configuration
NODE_ENV=production
PORT=4000
API_URL=http://107.173.91.179
FRONTEND_URL=http://107.173.91.179

# Frontend
VITE_API_URL=http://107.173.91.179/api

# VPS Configuration
VPS_IP=107.173.91.179
VPS_USER=root
```

---

## Key Technical Decisions

### Docker Image Selection
- **Backend:** `node:20` (full Debian-based image)
  - Reason: Prisma requires libssl1.1, not available in Alpine or Slim variants
- **Frontend:** `node:20-alpine` (lightweight)
- **Postgres:** `postgres:15-alpine`
- **Redis:** `redis:7-alpine`
- **Nginx:** `nginx:alpine`

### Development vs Production
- Currently using `docker-compose.dev.yml` for faster iteration
- Runs from source with volume mounts
- No build step - uses `tsx watch` for backend hot-reload
- Frontend uses `vite dev` with HMR

---

## File Structure

```
K:\AI-Projects\ProjectManager/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── logging.middleware.ts
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── utils/
│   │   │   ├── jwt.util.ts
│   │   │   ├── logger.util.ts
│   │   │   └── password.util.ts
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.api.ts
│   │   │   └── client.ts
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   └── common/
│   │   │       └── ProtectedRoute.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker/
│   └── nginx/
│       └── nginx.conf
├── docker-compose.dev.yml (ACTIVE)
├── docker-compose.prod.yml
├── .cursorrules (2117 lines - PROJECT SPEC)
└── CHECKPOINT.md (THIS FILE)
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/logout` - Logout (clear refresh token)
- `POST /api/auth/refresh` - Refresh access token

### Health
- `GET /health` - Server health check

---

## Database Schema

### User Table
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          UserRole @default(MEMBER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  teamMemberships TeamMember[]
  createdTeams    Team[]
  createdProjects Project[]
  assignedTasks   Task[]
  refreshTokens   RefreshToken[]
}
```

### Team, Project, Task Tables
- Full schema available in `backend/prisma/schema.prisma`
- All relations configured
- Cascading deletes set up

---

## Common Operations

### SSH to VPS
```bash
ssh root@107.173.91.179
# Password: rq1226YHTio6mVgJ7X
```

### Check Service Status
```bash
ssh root@107.173.91.179 "cd /var/www/project-management && docker compose -f docker-compose.dev.yml ps"
```

### View Logs
```bash
# All services
ssh root@107.173.91.179 "cd /var/www/project-management && docker compose -f docker-compose.dev.yml logs -f"

# Backend only
ssh root@107.173.91.179 "cd /var/www/project-management && docker compose -f docker-compose.dev.yml logs -f backend"
```

### Restart Services
```bash
ssh root@107.173.91.179 "cd /var/www/project-management && docker compose -f docker-compose.dev.yml restart backend"
```

### Deploy Code Changes
```bash
# From local machine:
git add .
git commit -m "Your changes"
git push origin main

# On VPS:
ssh root@107.173.91.179 "cd /var/www/project-management && git pull && docker compose -f docker-compose.dev.yml restart backend frontend"
```

### Database Operations
```bash
# Run migrations
ssh root@107.173.91.179 "docker exec project-management-backend-1 npx prisma db push"

# Access Prisma Studio (on VPS)
ssh root@107.173.91.179 "docker exec -it project-management-backend-1 npx prisma studio"
```

---

## Known Issues & Solutions

### Issue: Prisma OpenSSL Compatibility
**Problem:** Alpine/Slim images lack libssl1.1
**Solution:** Use full `node:20` image for backend

### Issue: bcrypt Binary Compatibility
**Problem:** Binary compiled for wrong architecture
**Solution:** Remove node_modules and reinstall in container

### Issue: Port Conflicts
**Problem:** Multiple containers trying to use same ports
**Solution:** Remove port mapping from frontend (nginx handles routing)

---

## Next Steps (Phase 2 - Teams & Projects)

### Backend Tasks
1. Create Team endpoints
   - POST /api/teams - Create team
   - GET /api/teams - List user's teams
   - GET /api/teams/:id - Get team details
   - PUT /api/teams/:id - Update team
   - DELETE /api/teams/:id - Delete team

2. Create Team Member endpoints
   - POST /api/teams/:id/members - Add member
   - DELETE /api/teams/:id/members/:userId - Remove member
   - PUT /api/teams/:id/members/:userId - Update role

3. Create Project endpoints
   - POST /api/projects - Create project
   - GET /api/projects - List projects
   - GET /api/projects/:id - Get project details
   - PUT /api/projects/:id - Update project
   - DELETE /api/projects/:id - Delete project

### Frontend Tasks
1. Dashboard page
2. Teams management UI
3. Projects management UI
4. Navigation components

### Files to Create
- `backend/src/controllers/team.controller.ts`
- `backend/src/controllers/project.controller.ts`
- `backend/src/services/team.service.ts`
- `backend/src/services/project.service.ts`
- `backend/src/routes/team.routes.ts`
- `backend/src/routes/project.routes.ts`
- `frontend/src/components/teams/TeamList.tsx`
- `frontend/src/components/projects/ProjectList.tsx`

---

## Testing Credentials

### Test User (if created)
Check the database for created users:
```bash
ssh root@107.173.91.179 "docker exec -it project-management-postgres-1 psql -U pmuser pmdb -c 'SELECT id, email, \"firstName\", \"lastName\", role FROM \"User\";'"
```

---

## Session Recovery Instructions

**When resuming this session, tell the AI:**

"We're continuing the project management suite development. Please read CHECKPOINT.md. We just completed Phase 1 (Authentication). Registration and login are working. The application is deployed on VPS at 107.173.91.179. We're ready to start Phase 2 - Teams & Projects management."

**Verification Steps:**
1. Check services are running: `docker compose ps`
2. Test health endpoint: `curl http://107.173.91.179/health`
3. Review .cursorrules for requirements
4. Check CHECKPOINT.md for current status

---

## Git Information

- **Repository:** https://github.com/kedhead/project
- **Branch:** main
- **Last Commit:** "Use full node:20 image for better library compatibility"

To sync:
```bash
git pull origin main
git push origin main
```

---

## Important Notes

1. **DO NOT** commit .env file to git (it's in .gitignore)
2. **ALWAYS** test changes locally before deploying
3. **Backend restarts** are fast with tsx watch
4. **Frontend HMR** is enabled for instant updates
5. **Database changes** require Prisma migrations
6. The `.cursorrules` file contains the complete project specification

---

## Quick Reference

| Service | Port | Container Name |
|---------|------|----------------|
| Nginx | 80 | project-management-nginx-1 |
| Backend | 4000 | project-management-backend-1 |
| Frontend | (internal) | project-management-frontend-1 |
| PostgreSQL | 5432 | project-management-postgres-1 |
| Redis | 6379 | project-management-redis-1 |

---

**END OF CHECKPOINT**
