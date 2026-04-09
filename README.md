# RelayX

RelayX is a phased real-time chat system. The repo is currently aligned to Phase 1 with a layered FastAPI backend, PostgreSQL persistence, and a React + Tailwind CSS v4 frontend.

## Current Stack

- FastAPI auth service
- FastAPI chat service with WebSockets
- PostgreSQL for users and messages
- React + Vite + Tailwind CSS v4 frontend
- Docker Compose for local development

## Main Docs

- [Project structure](./docs/project-structure.md)
- [Install and learning guide](./docs/install-and-learning-guide.md)
- [Phase 1 tech decisions](./docs/phase-1-tech-decisions.md)

## Quick Start

```bash
docker compose up --build -d
```

Open `http://localhost:5173`

## Verification Commands

```bash
docker compose run --build --rm auth-service pytest
docker compose run --build --rm chat-service pytest
docker compose run --build --rm frontend npm run build
```

Or run the helper script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\phase1-docker-checks.ps1
```

## Environment

The services are aligned with the root `.env` and `.env.example`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=relayx
JWT_SECRET_KEY=...
JWT_REFRESH_SECRET_KEY=...
SECRET_EXPIRY=15m
REFRESH_EXPIRY=7d
```

## Status

Phase 1 complete. Ready for next phase.
