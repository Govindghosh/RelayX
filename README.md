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

## Current Status

Phase 1 is in progress.
