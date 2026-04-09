from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_signup_login_me_refresh_and_user_listing():
    settings = Settings(
        database_url="sqlite://",
        jwt_secret_key="test-access-secret-1234",
        jwt_refresh_secret_key="test-refresh-secret-1234",
        cors_origins=["http://localhost:5173"],
    )

    with TestClient(create_app(settings)) as client:
        signup_response = client.post(
            "/signup",
            json={"email": "alice@example.com", "password": "password123"},
        )
        assert signup_response.status_code == 201
        signup_body = signup_response.json()
        assert signup_body["user"]["email"] == "alice@example.com"
        assert signup_body["access_token"]
        assert signup_body["refresh_token"]

        duplicate_response = client.post(
            "/signup",
            json={"email": "alice@example.com", "password": "password123"},
        )
        assert duplicate_response.status_code == 409

        login_response = client.post(
            "/login",
            json={"email": "alice@example.com", "password": "password123"},
        )
        assert login_response.status_code == 200
        login_body = login_response.json()

        me_response = client.get(
            "/me",
            headers={"Authorization": f"Bearer {login_body['access_token']}"},
        )
        assert me_response.status_code == 200
        assert me_response.json()["email"] == "alice@example.com"

        second_user_response = client.post(
            "/signup",
            json={"email": "bob@example.com", "password": "password123"},
        )
        assert second_user_response.status_code == 201

        users_response = client.get(
            "/users",
            headers={"Authorization": f"Bearer {login_body['access_token']}"},
        )
        assert users_response.status_code == 200
        users_body = users_response.json()
        assert len(users_body) == 1
        assert users_body[0]["email"] == "bob@example.com"

        refresh_response = client.post("/refresh", json={"refresh_token": login_body["refresh_token"]})
        assert refresh_response.status_code == 200
        assert refresh_response.json()["access_token"]

        invalid_login = client.post(
            "/login",
            json={"email": "alice@example.com", "password": "wrong-password"},
        )
        assert invalid_login.status_code == 401
