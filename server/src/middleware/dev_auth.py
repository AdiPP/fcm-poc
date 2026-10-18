"""Cross-cutting dev-secret auth.

An unset secret denies everything (no open relay).
"""
from fastapi import Request


class DevAuthError(Exception):
    """Raised when the dev secret is missing or wrong."""


def create_dev_auth(dev_secret):
    def dependency(request: Request):
        if not dev_secret or request.headers.get("x-dev-secret") != dev_secret:
            raise DevAuthError("missing or wrong X-Dev-Secret")
        return None

    return dependency


__all__ = ["create_dev_auth", "DevAuthError"]