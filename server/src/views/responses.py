"""View: JSON response shapers. Single place where response shapes are built."""
from fastapi.responses import JSONResponse


def ok():
    return JSONResponse(status_code=200, content={"ok": True})


def message_id(value):
    return JSONResponse(status_code=200, content={"messageId": value})


def broadcast_result(sent, failed):
    return JSONResponse(status_code=200, content={"sent": sent, "failed": failed})


def token_count(count):
    return JSONResponse(status_code=200, content={"count": count})


def send_error(status, message):
    return JSONResponse(status_code=status, content={"error": message})


__all__ = ["ok", "message_id", "broadcast_result", "token_count", "send_error"]