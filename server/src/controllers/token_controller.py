"""Thin HTTP handlers for token endpoints."""
from fastapi import Request
from starlette.concurrency import run_in_threadpool

from ..views.responses import ok, token_count, send_error


class TokenController:
    def __init__(self, service) -> None:
        self.service = service

    async def register_token(self, request: Request):
        try:
            body = await request.json()
        except Exception:
            body = {}
        body = body or {}
        token = body.get("token")
        if not token:
            return send_error(400, "token required")
        await run_in_threadpool(self.service.register_token, token)
        return ok()

    async def get_tokens(self, request: Request):
        count = await run_in_threadpool(self.service.get_token_count)
        return token_count(count)


def create_token_controller(service):
    return TokenController(service)


__all__ = ["create_token_controller", "TokenController"]