"""Ported sender scenarios (no Firebase credentials needed)."""
from src.models.token_store import create_token_store


def test_registration_is_idempotent_store_exposed_via_tokens(make_client):
    client, messaging, tokens = make_client(dev_secret="s")
    r1 = client.post("/register-token", json={"token": "t1"})
    r2 = client.post("/register-token", json={"token": "t1"})
    assert r1.status_code == 200
    assert r1.json() == {"ok": True}
    assert r2.status_code == 200
    assert client.get("/tokens").json() == {"count": 1}


def test_send_requires_dev_secret(make_client):
    client, messaging, tokens = make_client(dev_secret="s")
    r1 = client.post("/send", json={"token": "t1", "title": "a", "body": "b"})
    r2 = client.post(
        "/send",
        json={"token": "t1", "title": "a", "body": "b"},
        headers={"X-Dev-Secret": "wrong"},
    )
    assert r1.status_code == 401
    assert r2.status_code == 401
    assert messaging.sent == []


def test_send_valid_token_and_invalid_prune(make_client):
    tokens = create_token_store()
    tokens.update(["good-token", "bad-token"])
    client, messaging, tokens = make_client(tokens=tokens, dev_secret="s")

    ok = client.post(
        "/send",
        json={"token": "good-token", "title": "Hi", "body": "there"},
        headers={"X-Dev-Secret": "s"},
    )
    assert ok.status_code == 200
    assert ok.json()["messageId"] == "projects/test/messages/123"
    assert messaging.sent[0].notification.title == "Hi"
    assert messaging.sent[0].notification.body == "there"

    bad = client.post(
        "/send",
        json={"token": "bad-token", "title": "Hi", "body": "there"},
        headers={"X-Dev-Secret": "s"},
    )
    assert bad.status_code == 404
    assert "bad-token" not in tokens
    assert "good-token" in tokens

    topic = client.post(
        "/send",
        json={"topic": "news", "title": "Hi", "body": "broadcast"},
        headers={"X-Dev-Secret": "s"},
    )
    assert topic.status_code == 200
    assert messaging.sent[-1].topic == "news"


def test_send_broadcast(make_client):
    tokens = create_token_store()
    tokens.update(["a", "b"])
    client, messaging, tokens = make_client(tokens=tokens, dev_secret="s")
    res = client.post(
        "/send", json={"title": "Hi", "body": "all"}, headers={"X-Dev-Secret": "s"}
    )
    assert res.status_code == 200
    assert res.json() == {"sent": 2, "failed": 0}


def test_subscribe_wires_token_to_topic(make_client):
    client, messaging, tokens = make_client(dev_secret="s")
    res = client.post(
        "/subscribe",
        json={"token": "a", "topic": "news"},
        headers={"X-Dev-Secret": "s"},
    )
    assert res.status_code == 200
    assert messaging.sent[-1] == {"subscribe": ["a", "news"]}