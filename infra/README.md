# Infra Notes

Phase 1 keeps infrastructure intentionally small:

- `docker-compose.yml` runs PostgreSQL, auth service, chat service, and the React frontend.
- PostgreSQL is the only stateful dependency in this phase.
- Redis, Kafka, and orchestration are intentionally deferred to later phases.
