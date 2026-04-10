# RelayX 🚀

RelayX is a high-scale, asynchronous real-time chat system built with microservices. 

## 🏗️ Architecture

- **Auth Service**: FastAPI-based JWT identity provider.
- **Chat Gateway**: FastAPI WebSocket server using Redis Pub/Sub for horizontal scaling.
- **Message Bus**: Apache Kafka for durable, asynchronous message delivery.
- **Message Consumer**: Dedicated background service for optimistic database synchronization.
- **Observability**: Prometheus, Grafana, and Loki/Promtail stack for metrics and logs.

## 🚀 Quick Start (Development)

```bash
docker compose up --build -d
```
Access Frontend: `http://localhost:5173`
Access Grafana: `http://localhost:3000` (admin/admin)

## 🚢 Production Deployment

RelayX is production-ready with multi-stage Docker builds and Gunicorn/Nginx servers.

### 1. Configure Production Environment
Copy `.env.example` to `.env` and fill in your production secrets.

### 2. Deploy via Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
This will start the stack on port **80** (Frontend) and use the production-hardened images.

## 🤖 CI/CD Pipeline

The project includes an automated GitHub Actions pipeline (`.github/workflows/main.yml`):
- **Lint**: Ruff (Python).
- **Test**: Pytest for backend logic.
- **Push**: Automated builds and pushes to GitHub Container Registry (GHCR).

## 🛡️ Security & Observability

- **No Hardcoding**: All configurations are strictly environment-driven.
- **Metrics**: Real-time throughput and error tracking via `/metrics` and Grafana.
- **Logging**: Centralized log streaming to Loki.

## 🏁 Roadmap Status
- [x] Phase 1: Foundation
- [x] Phase 2: Real-time Scalability (Redis)
- [x] Phase 3: Message Persistence (Kafka)
- [x] Phase 4: Observability & Monitoring
- [x] Phase 5: Deployment & CI/CD
