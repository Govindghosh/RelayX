# Install And Learning Guide

This file explains both:

1. how to run the current repo
2. how someone can build the same style of project from scratch for learning

## 1. Run This Repo

### Prerequisites

- Git
- Docker Desktop
- Python 3.12+ if you want local service testing
- Node.js 22+ if you want local frontend commands

### Commands

```powershell
git clone <your-repo-url> relayx
cd relayx
Copy-Item .env.example .env
docker compose up --build -d
```

Open:

- Frontend: `http://localhost:5173`
- Auth service: `http://localhost:8000`
- Chat service: `http://localhost:8001`

### Test Commands

```powershell
docker compose run --build --rm auth-service pytest
docker compose run --build --rm chat-service pytest
docker compose run --build --rm frontend npm run build
```

Or run the helper:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\phase1-docker-checks.ps1
```

## 2. Build A Similar Project From Scratch

These commands are intentionally written as learning steps.

### Step 1: Create the monorepo

```powershell
mkdir relayx
cd relayx
mkdir services, frontend, infra, docs, scripts
mkdir services\auth-service, services\chat-service
New-Item .env.example -ItemType File
```

### Step 2: Start the React frontend

```powershell
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom lucide-react tailwindcss @tailwindcss/vite
cd ..
```

Then:

- add `@tailwindcss/vite` in `vite.config.ts`
- create `src/index.css`
- add `@import "tailwindcss";`
- build UI using components, hooks, services, utils, and pages

### Step 3: Start the auth service

```powershell
cd services\auth-service
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
```

Create `requirements.txt`, then install:

```powershell
.\.venv\Scripts\python.exe -m pip install fastapi uvicorn[standard] sqlalchemy psycopg[binary] pydantic-settings pyjwt bcrypt email-validator python-multipart pytest httpx
cd ..\..
```

### Step 4: Start the chat service

```powershell
cd services\chat-service
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install fastapi uvicorn[standard] sqlalchemy psycopg[binary] pydantic-settings pyjwt pytest httpx websockets
cd ..\..
```

### Step 5: Create backend structure

For each backend service, create:

```powershell
mkdir services\auth-service\app\config
mkdir services\auth-service\app\constants
mkdir services\auth-service\app\controllers
mkdir services\auth-service\app\jobs
mkdir services\auth-service\app\locales
mkdir services\auth-service\app\middleware
mkdir services\auth-service\app\models
mkdir services\auth-service\app\queues
mkdir services\auth-service\app\routes
mkdir services\auth-service\app\scripts
mkdir services\auth-service\app\services
mkdir services\auth-service\app\utils
mkdir services\auth-service\app\validators
mkdir services\auth-service\app\workers
```

Repeat the same for `services\chat-service\app\...`

Create the service entry files too:

```powershell
New-Item services\auth-service\server.py -ItemType File
New-Item services\chat-service\server.py -ItemType File
```

Add your environment template:

```powershell
@'
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=relayx
JWT_SECRET_KEY=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET_KEY=replace-with-a-long-random-refresh-secret
SECRET_EXPIRY=15m
REFRESH_EXPIRY=7d
'@ | Set-Content .env.example
```

### Step 6: Add Docker support

Create:

- `services/auth-service/Dockerfile`
- `services/chat-service/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`

Then run:

```powershell
docker compose up --build
```

### Step 7: Add tests early

Auth service:

```powershell
cd services\auth-service
.\.venv\Scripts\python.exe -m pytest
cd ..\..
```

Chat service:

```powershell
cd services\chat-service
.\.venv\Scripts\python.exe -m pytest
cd ..\..
```

Frontend build:

```powershell
cd frontend
npm run build
cd ..
```

## 3. Recommended Learning Order

1. Build auth first
2. Add PostgreSQL models
3. Add simple WebSocket chat with direct DB writes
4. Build the frontend login/signup/chat screens
5. Dockerize only after the app works
6. Add Redis in Phase 2
7. Add Kafka in Phase 3

## 4. Why This Structure Helps Learning

- You can see where config ends and business logic begins
- Routes stay thin
- Controllers are readable
- Services are easy to test
- Validators keep request and response shapes clear
- Future Redis, Kafka, jobs, and workers have a place already
