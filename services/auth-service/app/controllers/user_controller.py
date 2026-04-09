from app.services.user_service import list_other_users
from app.validators import UserResponse


def get_profile(current_user) -> UserResponse:
    return UserResponse.model_validate(current_user)


def get_users(database_session, current_user) -> list[UserResponse]:
    return list_other_users(database_session, current_user.id)
