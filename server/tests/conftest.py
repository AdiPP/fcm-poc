"""Pytest fixtures for the FCM POC sender."""
import firebase_admin.messaging as fm
import pytest
from fastapi.testclient import TestClient

from src.app import create_app
from src.models.token_store import create_token_store


def _raises_for(raise_generic, token):
    """True when the generic (non-prunable) failure applies to `token`.

    `raise_generic` may be True (every send fails generically) or an
    iterable of tokens that fail generically.
    """
    if raise_generic is True:
        return True
    if isinstance(raise_generic, (list, set, tuple, frozenset)):
        return token in raise_generic
    return False


def stub_messaging(raise_for_token=None, raise_generic=False):
    """Stub messaging backend with configurable failure injection.

    - `raise_for_token`: mapping of token -> exception instance (or class)
      raised instead of sending. Use `fm.UnregisteredError` /
      `fm.InvalidArgumentError` to exercise pruning paths, any other
      exception to exercise the 502 path.
    - `raise_generic`: True, or an iterable of tokens, to raise a generic
      non-prunable `Exception` (exercises 502 without pruning).

    By default the canonical `"bad-token"` raises `UnregisteredError`,
    matching the ported scenarios.
    """
    sent = []
    failures = dict(raise_for_token or {})
    failures.setdefault("bad-token", fm.UnregisteredError("not registered"))

    class Stub:
        UnregisteredError = fm.UnregisteredError
        # `InvalidArgumentError` is defined in firebase_admin.exceptions and is
        # what the service inspects via `messaging.exceptions.InvalidArgumentError`.
        InvalidArgumentError = fm.exceptions.InvalidArgumentError
        exceptions = fm.exceptions
        Message = fm.Message
        Notification = fm.Notification

        def send(self, msg):
            token = getattr(msg, "token", None)
            if token in failures:
                exc = failures[token]
                raise exc if isinstance(exc, BaseException) else exc("injected failure")
            if _raises_for(raise_generic, token):
                raise Exception("injected generic failure")
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
def stub_factory():
    """Access to stub_messaging() with failure-injection arguments."""
    return stub_messaging


@pytest.fixture
def make_client():
    def _make(messaging=None, tokens=None):
        if messaging is None:
            messaging = stub_messaging()
        if tokens is None:
            tokens = create_token_store()
        app = create_app(messaging=messaging, tokens=tokens)
        return TestClient(app), messaging, tokens

    return _make
