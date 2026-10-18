"""Thin HTTP handlers for subscription endpoints."""
from fastapi import Request
from starlette.concurrency import run_in_threadpool

from ..views.responses import ok, send_error


class SubscriptionController:
    def __init__(self, service) -> None:
        self.service = service

    async def subscribe(self, request: Request):
        try:
            body = await request.json()
        except Exception:
            body = {}
        body = body or {}
        token = body.get("token")
        topic = body.get("topic")
        if not token or not topic:
            return send_error(400, "token and topic required")
        try:
            self.service.subscribe_to_topic(token, topic)
        except Exception as exc:
            code = getattr(exc, "code", None)
            return send_error(502, code if code else str(exc))
        return ok()


def create_subscription_controller(service):
    return SubscriptionController(service)


__all__ = ["create_subscription_controller", "SubscriptionController"]