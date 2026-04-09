# RelayX

RelayX is being built in disciplined phases. This repository currently targets **Phase 1: Foundation**:

- FastAPI auth service
- FastAPI chat service with direct DB-backed WebSockets
- React frontend for signup, login, and chat
- PostgreSQL for user and message storage
- Docker Compose for local development

## Monorepo Structure

```text
relayx/
├── docker-compose.yml
├── docs/
├── frontend/
├── infra/
└── services/
    ├── auth-service/
    └── chat-service/
```

## Phase Rules

- No Kafka or Kubernetes in Phase 1
- Keep each phase working and tested
- Commit after milestones
- Prefer running the stack through Docker

## Services

- `auth-service` exposes `POST /signup`, `POST /login`, `POST /refresh`, `GET /me`, and `GET /users`
- `chat-service` exposes `GET /messages/{peer_id}` and `GET /health`, plus a WebSocket endpoint at `/ws`
- `frontend` provides signup, login, and a simple two-user chat UI

## Local Run

1. Copy `.env.example` to `.env` if you want to override defaults.
2. Start the stack:

```bash
docker compose up --build
```

3. Open the app at `http://localhost:5173`
4. Create two users in separate tabs or browsers and start chatting

## Tests

Backend tests:

```bash
cd services/auth-service && pytest
cd services/chat-service && pytest
```

Frontend production build:

```bash
cd frontend && npm run build
```

## Phase 1 Goal Check

- Auth with JWT access and refresh tokens
- PostgreSQL-backed users and messages
- Simple single-instance WebSocket chat
- React UI with token persistence and live messaging
- Docker Compose local stack

Phase 1 complete. Ready for next phase.
