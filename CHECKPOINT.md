# Project Checkpoint - Session Recovery Document

**Date:** 2025-10-17
**Status:** Phase 2 Complete - Teams & Projects APIs Working
**VPS:** 107.173.91.179
**GitHub:** https://github.com/kedhead/project

---

## Current Status

### ✅ Completed Features

1. **Authentication System (Phase 1)**
   - User registration working (POST /api/auth/register)
   - User login working (POST /api/auth/login)
   - JWT token-based authentication
   - Bcrypt password hashing (12 rounds)
   - Refresh token mechanism (15m access, 7d refresh)
   - Protected routes on frontend

2. **Teams & Projects Management (Phase 2)**
   - Complete Teams CRUD API
   - Team member management (add, remove, update roles)
   - Permission-based access control (OWNER, ADMIN, MEMBER)
   - Complete Projects CRUD API
   - Project statistics endpoint
   - Team-project association
   - All APIs protected with JWT authentication

3. **Infrastructure**
   - Docker Compose setup with all services running
   - PostgreSQL database with complete schema
   - Redis cache server
   - Nginx reverse proxy
   - Node.js backend (Express + TypeScript)
   - React frontend (Vite + TypeScript + TailwindCSS)

4. **Database**
   - Prisma ORM configured
   - Complete schema migrated to PostgreSQL
   - Tables: User, Team, Project, Task, TaskDependency, TeamMember, RefreshToken
   - Enums: UserRole, TeamRole, TaskStatus, TaskPriority, DependencyType
   - All relations and cascading deletes configured

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
│   │   │   ├── auth.controller.ts
│   │   │   ├── team.controller.ts (NEW - Phase 2)
│   │   │   └── project.controller.ts (NEW - Phase 2)
│   │   ├── middleware/
│   │   │   ├── authenticate.ts
│   │   │   ├── authorize.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── team.routes.ts (NEW - Phase 2)
│   │   │   └── project.routes.ts (NEW - Phase 2)
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── team.service.ts (NEW - Phase 2)
│   │   │   └── project.service.ts (NEW - Phase 2)
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

### Teams (NEW - Phase 2)
- `POST /api/teams` - Create team (auto-assigns creator as OWNER)
- `GET /api/teams` - List all teams for authenticated user
- `GET /api/teams/:id` - Get team details with members and projects
- `PUT /api/teams/:id` - Update team (OWNER/ADMIN only)
- `DELETE /api/teams/:id` - Delete team (OWNER only)
- `POST /api/teams/:id/members` - Add member to team (OWNER/ADMIN only)
- `DELETE /api/teams/:id/members/:userId` - Remove member (OWNER/ADMIN only)
- `PUT /api/teams/:id/members/:userId` - Update member role (OWNER only)
- `GET /api/teams/:teamId/projects` - List projects for a specific team

### Projects (NEW - Phase 2)
- `POST /api/projects` - Create project in a team (OWNER/ADMIN only)
- `GET /api/projects` - List all projects for authenticated user
- `GET /api/projects/:id` - Get project details with tasks
- `PUT /api/projects/:id` - Update project (OWNER/ADMIN only)
- `DELETE /api/projects/:id` - Delete project (OWNER/ADMIN only)
- `GET /api/projects/:id/stats` - Get project statistics

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

## Next Steps (Phase 3 - Frontend UI)

### Frontend Tasks (IN PROGRESS)
1. **Dashboard Page**
   - Overview of teams and projects
   - Quick stats display
   - Recent activity feed

2. **Teams Management UI**
   - TeamList component - Display all teams
   - TeamDetail component - Show team members and projects
   - CreateTeam modal/form
   - AddMember modal/form
   - Team settings and permissions UI

3. **Projects Management UI**
   - ProjectList component - Display all projects
   - ProjectDetail component - Show project tasks and stats
   - CreateProject modal/form
   - Project card components
   - Project filters and search

4. **Navigation & Layout**
   - Main navigation bar
   - Sidebar with team/project navigation
   - Breadcrumbs
   - User menu with logout

### Files to Create
- `frontend/src/api/team.api.ts` - Team API client functions
- `frontend/src/api/project.api.ts` - Project API client functions
- `frontend/src/components/dashboard/Dashboard.tsx`
- `frontend/src/components/teams/TeamList.tsx`
- `frontend/src/components/teams/TeamDetail.tsx`
- `frontend/src/components/teams/CreateTeamModal.tsx`
- `frontend/src/components/projects/ProjectList.tsx`
- `frontend/src/components/projects/ProjectDetail.tsx`
- `frontend/src/components/projects/CreateProjectModal.tsx`
- `frontend/src/components/layout/Navbar.tsx`
- `frontend/src/components/layout/Sidebar.tsx`

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

"We're continuing the project management suite development. Please read CHECKPOINT.md. We just completed Phase 2 (Teams & Projects Backend APIs). The backend APIs are working and deployed on VPS at 107.173.91.179. We're ready to start Phase 3 - Frontend UI for Teams and Projects."

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
