from fastapi import APIRouter

from app.constants import HEALTH_TAG
from app.controllers.health_controller import health_check


def build_health_router() -> APIRouter:
    router = APIRouter(tags=[HEALTH_TAG])
    router.get("/health")(health_check)
    return router
