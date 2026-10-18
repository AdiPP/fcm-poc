"""Unit tests for validation and error paths across all three targeting modes.

No Firebase credentials needed — everything runs against the injectable stub.
"""
import firebase_admin.messaging as fm
import pytest

from src.models.token_store import create_token_store

pytestmark = pytest.mark.unit


# --- 2.1 Validation -------------------------------------------------------


def test_register_token_requires_token(make_client):
    client, _, _ = make_client()
    res = client.post("/register-token", json={})
    assert res.status_code == 400
    assert "token required" in res.json()["error"]


@pytest.mark.parametrize(
    "payload",
    [
        {"token": "t1"},  # no title, no body
        {"token": "t1", "title": "Hi"},  # no body
        {"token": "t1", "body": "there"},  # no title
        {},  # completely empty
    ],
)
def test_send_requires_title_and_body(make_client, payload):
    client, messaging, _ = make_client()
    res = client.post("/send", json=payload)
    assert res.status_code == 400
    assert "title and body required" in res.json()["error"]
    assert messaging.sent == []  # nothing was dispatched


@pytest.mark.parametrize(
    "payload",
    [
        {"token": "t1"},  # no topic
        {"topic": "news"},  # no token
        {},  # neither
    ],
)
def test_subscribe_requires_token_and_topic(make_client, payload):
    client, _, _ = make_client()
    res = client.post("/subscribe", json=payload)
    assert res.status_code == 400
    assert "token and topic required" in res.json()["error"]


# --- 2.2 Error paths ------------------------------------------------------


def test_invalid_argument_error_also_prunes(make_client, stub_factory):
    """Beyond the canonical bad-token: InvalidArgumentError must prune too."""
    stub = stub_factory(
        raise_for_token={
            "invalid-arg-token": fm.exceptions.InvalidArgumentError(
                "malformed registration token"
            ),
        }
    )
    tokens = create_token_store()
    tokens.update(["keep-me", "invalid-arg-token"])
    client, _, tokens = make_client(messaging=stub, tokens=tokens)

    res = client.post(
        "/send", json={"token": "invalid-arg-token", "title": "Hi", "body": "x"}
    )
    assert res.status_code == 404
    assert "invalid-arg-token" not in tokens
    assert "keep-me" in tokens


def test_generic_failure_returns_502_without_pruning(make_client, stub_factory):
    stub = stub_factory(raise_generic=True)
    tokens = create_token_store()
    tokens.update(["t1"])
    client, _, tokens = make_client(messaging=stub, tokens=tokens)

    res = client.post("/send", json={"token": "t1", "title": "Hi", "body": "x"})
    assert res.status_code == 502
    assert "t1" in tokens  # generic failures must NOT prune


def test_generic_failure_counts_as_failed_in_broadcast_without_pruning(
    make_client, stub_factory
):
    stub = stub_factory(raise_generic=True)
    tokens = create_token_store()
    tokens.update(["a", "b"])
    client, _, tokens = make_client(messaging=stub, tokens=tokens)

    res = client.post("/send", json={"title": "Hi", "body": "x"})
    assert res.status_code == 200
    assert res.json() == {"sent": 0, "failed": 2}
    assert tokens == {"a", "b"}


def test_broadcast_on_empty_store(make_client):
    client, messaging, tokens = make_client()
    res = client.post("/send", json={"title": "Hi", "body": "x"})
    assert res.status_code == 200
    assert res.json() == {"sent": 0, "failed": 0}
    assert messaging.sent == []


def test_invalid_token_prune_still_404(make_client):
    """Extend the already-covered prune path: error body mentions removal."""
    client, _, _ = make_client()
    res = client.post("/send", json={"token": "bad-token", "title": "Hi", "body": "x"})
    assert res.status_code == 404
    assert "removed from store" in res.json()["error"]


# --- 2.3 Topic send -------------------------------------------------------


def test_topic_send_records_topic_and_returns_message_id(make_client):
    client, messaging, _ = make_client()
    res = client.post("/send", json={"topic": "news", "title": "Hi", "body": "x"})
    assert res.status_code == 200
    assert res.json() == {"messageId": "projects/test/messages/123"}
    msg = messaging.sent[-1]
    assert msg.topic == "news"
    assert msg.token is None  # topic sends must not carry a token
    assert msg.notification.title == "Hi"
    assert msg.notification.body == "x"


def test_topic_failure_returns_502(make_client, stub_factory):
    stub = stub_factory(raise_generic=True)
    client, _, _ = make_client(messaging=stub)
    res = client.post("/send", json={"topic": "news", "title": "Hi", "body": "x"})
    assert res.status_code == 502


# --- 2.4 Registration idempotency and counts ------------------------------


def test_registration_idempotent_and_count_accurate(make_client):
    client, _, tokens = make_client()
    for payload in ["t1", "t2", "t1", "t3", "t2", "t1"]:
        assert client.post("/register-token", json={"token": payload}).status_code == 200
    assert client.get("/tokens").json() == {"count": 3}
    assert set(tokens) == {"t1", "t2", "t3"}


def test_token_count_reflects_pruning(make_client):
    tokens = create_token_store()
    tokens.update(["bad-token", "live"])
    client, _, tokens = make_client(tokens=tokens)
    assert client.get("/tokens").json() == {"count": 2}
    client.post("/send", json={"token": "bad-token", "title": "Hi", "body": "x"})
    assert client.get("/tokens").json() == {"count": 1}
