# Project Management Suite

A full-stack project management application with advanced Gantt chart capabilities using svar.dev.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, TailwindCSS
- **Backend:** Node.js + Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis
- **Deployment:** Docker + Docker Compose

## Features

- JWT-based authentication
- Team/group management with roles
- Project management
- Advanced Gantt chart with svar.dev
- Task management with subtasks
- Dependency tracking
- Auto-scheduling engine
- Color-coded tasks
- Multi-format exports (PDF, Excel, CSV, PNG, JSON)

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kedhead/project.git
cd project
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Start with Docker:
```bash
docker-compose up -d
```

5. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health

## Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database

```bash
cd backend
npx prisma migrate dev
npx prisma studio
```

## Project Structure

```
project-management-suite/
├── frontend/          # React frontend
├── backend/           # Express backend
├── docker/            # Docker configurations
├── scripts/           # Utility scripts
└── docker-compose.yml
```

## License

MIT
