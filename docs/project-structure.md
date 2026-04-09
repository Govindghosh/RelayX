# RelayX Project Structure

This is the current repo layout after the refactor.

```text
relayx/
|-- .env
|-- .env.example
|-- docker-compose.yml
|-- README.md
|-- docs/
|   |-- install-and-learning-guide.md
|   |-- phase-1-tech-decisions.md
|   `-- project-structure.md
|-- frontend/
|   |-- Dockerfile
|   |-- package.json
|   |-- tsconfig.json
|   |-- vite.config.ts
|   `-- src/
|       |-- app/
|       |   `-- App.tsx
|       |-- components/
|       |   |-- auth/
|       |   |   `-- AuthShell.tsx
|       |   |-- chat/
|       |   |   |-- ConversationPanel.tsx
|       |   |   `-- UserDirectory.tsx
|       |   `-- ui/
|       |       `-- AnimatedRelayIcon.tsx
|       |-- config/
|       |   `-- env.ts
|       |-- constants/
|       |   `-- storage.ts
|       |-- hooks/
|       |   `-- useSession.ts
|       |-- pages/
|       |   |-- ChatPage.tsx
|       |   |-- LoginPage.tsx
|       |   `-- SignupPage.tsx
|       |-- services/
|       |   `-- api/
|       |       `-- client.ts
|       |-- types/
|       |   `-- session.ts
|       |-- utils/
|       |   |-- formatters.ts
|       |   `-- session-storage.ts
|       |-- index.css
|       `-- main.tsx
|-- infra/
|   `-- README.md
|-- scripts/
|   `-- phase1-docker-checks.ps1
`-- services/
    |-- auth-service/
    |   |-- Dockerfile
    |   |-- requirements.txt
    |   |-- server.py
    |   |-- app/
    |   |   |-- config/
    |   |   |-- constants/
    |   |   |-- controllers/
    |   |   |-- jobs/
    |   |   |-- locales/
    |   |   |-- middleware/
    |   |   |-- models/
    |   |   |-- queues/
    |   |   |-- routes/
    |   |   |-- scripts/
    |   |   |-- services/
    |   |   |-- utils/
    |   |   |-- validators/
    |   |   |-- workers/
    |   |   `-- main.py
    |   `-- tests/
    |       `-- test_auth.py
    `-- chat-service/
        |-- Dockerfile
        |-- requirements.txt
        |-- server.py
        |-- app/
        |   |-- config/
        |   |-- constants/
        |   |-- controllers/
        |   |-- jobs/
        |   |-- locales/
        |   |-- middleware/
        |   |-- models/
        |   |-- queues/
        |   |-- routes/
        |   |-- scripts/
        |   |-- services/
        |   |-- utils/
        |   |-- validators/
        |   |-- workers/
        |   `-- main.py
        `-- tests/
            `-- test_chat.py
```

## Folder Meaning

- `config`: settings and database wiring
- `constants`: shared fixed values like tags and algorithms
- `controllers`: request-level orchestration
- `jobs`: placeholder for scheduled or background jobs
- `locales`: user-facing messages
- `middleware`: auth and dependency helpers
- `models`: SQLAlchemy models
- `queues`: placeholder for Redis or Kafka adapters in later phases
- `routes`: FastAPI routers
- `scripts`: manual development helpers
- `services`: business logic
- `utils`: small reusable helpers
- `validators`: Pydantic request and response models
- `workers`: placeholder for async worker processes in later phases
- `server.py`: service entrypoint
