# Phase 1 Tech Decisions

This file explains the tools chosen for Phase 1, why we use them, what breaks or gets harder without them, and what alternatives exist.

## FastAPI

- **Why we use it:** FastAPI gives us quick API development, strong request validation with Pydantic, and native WebSocket support.
- **If we do not use it:** auth and chat APIs would take longer to build, and WebSocket support would be more manual in many Python frameworks.
- **Alternatives:** Flask with extensions, Django + Django REST Framework, Node.js with Express/NestJS.

## PostgreSQL

- **Why we use it:** PostgreSQL is reliable, production-proven, and a strong fit for relational data like users and messages.
- **If we do not use it:** we risk weak data integrity, harder querying, and a bigger migration cost later.
- **Alternatives:** MySQL, MariaDB, SQLite for temporary local-only prototypes.

## SQLAlchemy

- **Why we use it:** SQLAlchemy gives us structured models, migrations readiness, and database access without raw SQL everywhere.
- **If we do not use it:** database code becomes repetitive and harder to maintain as the project grows.
- **Alternatives:** SQLModel, Tortoise ORM, raw SQL with psycopg.

## JWT

- **Why we use it:** JWT lets the frontend authenticate with stateless access tokens, which keeps auth simple across multiple services.
- **If we do not use it:** every service would need server-side session storage or repeated auth lookups.
- **Alternatives:** server sessions with cookies, opaque tokens with token introspection.

## bcrypt / password hashing

- **Why we use it:** passwords must never be stored in plain text, and bcrypt is a standard password hashing choice.
- **If we do not use it:** a database leak becomes a direct credential leak.
- **Alternatives:** Argon2, scrypt.

## React + Vite

- **Why we use it:** React is a practical frontend choice for a chat UI, and Vite keeps local development fast.
- **If we do not use it:** UI iteration becomes slower or we lose the component-based flow we need for chat screens.
- **Alternatives:** Next.js, Vue, Svelte.

## Docker Compose

- **Why we use it:** Compose lets us start the full Phase 1 stack consistently with one command.
- **If we do not use it:** every machine setup becomes manual and drift-prone.
- **Alternatives:** local manual setup, Dev Containers, Tilt.

## Why Kafka and Redis are not here yet

- **Why we are not using them in Phase 1:** the goal is a working foundation, not distributed complexity.
- **If we added them now:** debugging would get harder before core auth and chat flows are proven.
- **When they come in:** Redis in Phase 2 for online presence and pub/sub, Kafka in Phase 3 for async messaging.
