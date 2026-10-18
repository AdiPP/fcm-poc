"""Pytest fixtures for the FCM POC sender."""
import firebase_admin.messaging as fm
import pytest
from fastapi.testclient import TestClient

from src.app import create_app
from src.models.token_store import create_token_store


def stub_messaging():
    sent = []

    class Stub:
        UnregisteredError = fm.UnregisteredError
        exceptions = fm.exceptions
        Message = fm.Message
        Notification = fm.Notification

        def send(self, msg):
            if getattr(msg, "token", None) == "bad-token":
                raise fm.UnregisteredError("not registered")
            sent.append(msg)
            return "projects/test/messages/123"

        def subscribe_to_topic(self, token, topic):
            sent.append({"subscribe": [token, topic]})
            return None

    stub = Stub()
    stub.sent = sent
    return stub


@pytest.fixture
def messaging():
    return stub_messaging()


@pytest.fixture
def make_client():
    def _make(messaging=None, tokens=None, dev_secret="s"):
        if messaging is None:
            messaging = stub_messaging()
        if tokens is None:
            tokens = create_token_store()
        app = create_app(messaging=messaging, tokens=tokens, dev_secret=dev_secret)
        return TestClient(app), messaging, tokens

    return _make