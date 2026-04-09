from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.constants import USER_TAG
from app.controllers.user_controller import get_profile, get_users
from app.validators import UserResponse


def build_user_router(db_dependency, current_user_dependency) -> APIRouter:
    router = APIRouter(tags=[USER_TAG])

    @router.get("/me", response_model=UserResponse)
    def me_route(current_user=Depends(current_user_dependency)) -> UserResponse:
        return get_profile(current_user)

    @router.get("/users", response_model=list[UserResponse])
    def users_route(
        database_session: Annotated[Session, Depends(db_dependency)],
        current_user=Depends(current_user_dependency),
    ) -> list[UserResponse]:
        return get_users(database_session, current_user)

    return router
