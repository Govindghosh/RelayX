from pydantic import BaseModel, EmailStr, Field

from app.validators.user_validator import UserResponse


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(SignupRequest):
    pass


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
