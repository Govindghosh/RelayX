from uuid import uuid4

from fastapi.testclient import TestClient

from app.auth import create_access_token
from app.config import Settings
from app.main import create_app


def test_websocket_message_delivery_and_history():
    settings = Settings(
        database_url="sqlite://",
        jwt_secret_key="test-access-secret-1234",
        cors_origins=["http://localhost:5173"],
    )

    alice_id = str(uuid4())
    bob_id = str(uuid4())
    alice_token = create_access_token(alice_id, settings.jwt_secret_key)
    bob_token = create_access_token(bob_id, settings.jwt_secret_key)

    with TestClient(create_app(settings)) as client:
        with client.websocket_connect(f"/ws?token={alice_token}") as alice_ws:
            with client.websocket_connect(f"/ws?token={bob_token}") as bob_ws:
                alice_ws.send_json({"receiver_id": bob_id, "content": "Hello Bob"})

                alice_event = alice_ws.receive_json()
                bob_event = bob_ws.receive_json()

                assert alice_event["type"] == "message"
                assert bob_event["type"] == "message"
                assert bob_event["message"]["sender_id"] == alice_id
                assert bob_event["message"]["receiver_id"] == bob_id
                assert bob_event["message"]["content"] == "Hello Bob"

        history_response = client.get(
            f"/messages/{bob_id}",
            headers={"Authorization": f"Bearer {alice_token}"},
        )
        assert history_response.status_code == 200
        history = history_response.json()
        assert len(history) == 1
        assert history[0]["content"] == "Hello Bob"
