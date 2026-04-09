from sqlalchemy.orm import Session

from app.models import User
from app.validators import UserResponse


def get_user_by_email(database_session: Session, email: str) -> User | None:
    return database_session.query(User).filter(User.email == email.lower()).first()


def get_user_by_id(database_session: Session, user_id: str) -> User | None:
    return database_session.get(User, user_id)


def list_other_users(database_session: Session, current_user_id: str) -> list[UserResponse]:
    users = (
        database_session.query(User)
        .filter(User.id != current_user_id)
        .order_by(User.created_at.asc(), User.email.asc())
        .all()
    )
    return [UserResponse.model_validate(user) for user in users]
