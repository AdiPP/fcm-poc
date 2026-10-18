"""Thin HTTP handlers for send endpoints."""
from fastapi import Request
from starlette.concurrency import run_in_threadpool

from ..services.notification_service import SendError
from ..views.responses import message_id, broadcast_result, send_error


class SendController:
    def __init__(self, service) -> None:
        self.service = service

    async def send(self, request: Request):
        try:
            body = await request.json()
        except Exception:
            body = {}
        body = body or {}
        title = body.get("title")
        message_body = body.get("body")
        if not title or not message_body:
            return send_error(400, "title and body required")

        token = body.get("token")
        topic = body.get("topic")

        # No explicit target -> broadcast to all registered tokens.
        if not token and not topic:
            result = await run_in_threadpool(
                self.service.send_broadcast, title=title, body=message_body
            )
            return broadcast_result(result["sent"], result["failed"])

        try:
            if topic:
                mid = await run_in_threadpool(
                    self.service.send_to_topic,
                    topic=topic,
                    title=title,
                    body=message_body,
                )
            else:
                mid = await run_in_threadpool(
                    self.service.send_to_token,
                    token=token,
                    title=title,
                    body=message_body,
                )
            return message_id(mid)
        except SendError as exc:
            return send_error(exc.status, exc.message)
        except Exception as exc:
            code = getattr(exc, "code", None)
            return send_error(502, code if code else str(exc))


def create_send_controller(service):
    return SendController(service)


__all__ = ["create_send_controller", "SendController"]