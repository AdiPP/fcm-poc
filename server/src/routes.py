"""APIRouter wiring for the sender endpoints."""
from fastapi import APIRouter


def create_routes(token_controller, subscription_controller, send_controller):
    router = APIRouter()
    router.add_api_route(
        "/register-token", token_controller.register_token, methods=["POST"]
    )
    router.add_api_route(
        "/subscribe", subscription_controller.subscribe, methods=["POST"]
    )
    router.add_api_route("/send", send_controller.send, methods=["POST"])
    router.add_api_route("/tokens", token_controller.get_tokens, methods=["GET"])
    return router


__all__ = ["create_routes"]
