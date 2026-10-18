"""Live-FCM integration tests for token / topic / broadcast targeting.

Skipped unless ``FCM_INTEGRATION=1`` is set. Requires:
- ``server/serviceAccount.json`` (or FIREBASE_SERVICE_ACCOUNT_PATH) pointing
  at a real Firebase project with Cloud Messaging enabled.
- ``FCM_TEST_TOKEN``: a registration token obtained from the web client
  (click "Enable notifications" on http://localhost:5173 and copy the token).

Run explicitly with:
    FCM_INTEGRATION=1 FCM_TEST_TOKEN=<token> uv run pytest -m integration
"""
import os
import uuid

import pytest

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("FCM_INTEGRATION") != "1",
        reason="set FCM_INTEGRATION=1 (and FCM_TEST_TOKEN) to run live-FCM tests",
    ),
]

REAL_TOKEN = os.environ.get("FCM_TEST_TOKEN", "")


@pytest.fixture(scope="module")
def real_messaging():
    from src.infrastructure.firebase import messaging

    return messaging


@pytest.fixture
def live_client(real_messaging, make_client):
    if not REAL_TOKEN:
        pytest.skip("FCM_TEST_TOKEN is required for live token sends")
    return make_client(messaging=real_messaging)


def test_real_token_send_returns_message_id(live_client):
    client, _, tokens = live_client
    reg = client.post("/register-token", json={"token": REAL_TOKEN})
    assert reg.status_code == 200

    res = client.post(
        "/send",
        json={"token": REAL_TOKEN, "title": "integration", "body": f"run {uuid.uuid4()}"},
    )
    assert res.status_code == 200
    assert res.json()["messageId"].startswith("projects/")


def test_real_topic_send_returns_message_id(live_client):
    client, _, _ = live_client
    topic = f"poc-test-{uuid.uuid4().hex[:8]}"
    sub = client.post("/subscribe", json={"token": REAL_TOKEN, "topic": topic})
    assert sub.status_code == 200

    res = client.post(
        "/send", json={"topic": topic, "title": "integration", "body": "topic run"}
    )
    assert res.status_code == 200
    assert res.json()["messageId"].startswith("projects/")


def test_real_broadcast_reaches_registered_token(live_client):
    client, _, _ = live_client
    res = client.post("/send", json={"title": "integration", "body": "broadcast run"})
    assert res.status_code == 200
    result = res.json()
    assert result["sent"] + result["failed"] >= 1
    assert result["failed"] == 0


def test_real_broadcast_prunes_dead_token(live_client):
    client, _, tokens = live_client
    # A syntactically invalid registration token: FCM rejects it and the
    # service must remove it from the store during broadcast.
    dead = "dead-token-" + uuid.uuid4().hex
    client.post("/register-token", json={"token": dead})

    res = client.post("/send", json={"title": "integration", "body": "prune run"})
    assert res.status_code == 200
    assert res.json()["failed"] >= 1
    assert dead not in tokens
    assert REAL_TOKEN in tokens
