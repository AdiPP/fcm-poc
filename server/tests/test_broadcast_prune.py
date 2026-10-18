"""Ported broadcast prune scenario."""
import pytest

from src.models.token_store import create_token_store

pytestmark = pytest.mark.unit


def test_broadcast_prunes_dead_tokens_and_reports_counts(make_client):
    tokens = create_token_store()
    tokens.update(["live-token", "bad-token"])
    client, messaging, tokens = make_client(tokens=tokens)
    res = client.post("/send", json={"title": "Hi", "body": "all"})
    assert res.status_code == 200
    assert res.json() == {"sent": 1, "failed": 1}
    assert "bad-token" not in tokens
    assert "live-token" in tokens
