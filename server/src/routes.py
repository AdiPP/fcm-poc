"""APIRouter wiring with dev_auth dependency on /subscribe and /send."""
from fastapi import Depends, APIRouter

from .middleware.dev_auth import create_dev_auth


def create_routes(token_controller, subscription_controller, send_controller, dev_auth):
    router = APIRouter()
    router.add_api_route(
        "/register-token", token_controller.register_token, methods=["POST"]
    )
    router.add_api_route(
        "/subscribe",
        subscription_controller.subscribe,
        methods=["POST"],
        dependencies=[Depends(dev_auth)],
    )
    router.add_api_route(
        "/send",
        send_controller.send,
        methods=["POST"],
        dependencies=[Depends(dev_auth)],
    )
    router.add_api_route("/tokens", token_controller.get_tokens, methods=["GET"])
    return router


__all__ = ["create_routes"]