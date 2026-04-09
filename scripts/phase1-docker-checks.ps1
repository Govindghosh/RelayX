$ErrorActionPreference = "Stop"

docker compose run --build --rm auth-service pytest
docker compose run --build --rm chat-service pytest
docker compose run --build --rm frontend npm run build

Write-Host "RelayX Phase 1 Docker checks passed."
