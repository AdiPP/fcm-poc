"""Composition root. Keeps the create_app(...) factory contract."""
from fastapi import FastAPI

from .config.env import env
from .models.token_store import create_token_store
from .services.notification_service import create_notification_service
from .controllers.token_controller import create_token_controller
from .controllers.subscription_controller import create_subscription_controller
from .controllers.send_controller import create_send_controller
from .routes import create_routes


def create_app(messaging=None, tokens=None):
    if tokens is None:
        tokens = create_token_store()

    app = FastAPI()

    service = None
    if messaging is not None:
        service = create_notification_service(messaging, tokens)

    token_controller = create_token_controller(service) if service is not None else None
    subscription_controller = (
        create_subscription_controller(service) if service is not None else None
    )
    send_controller = create_send_controller(service) if service is not None else None

    if token_controller is not None:
        app.include_router(
            create_routes(token_controller, subscription_controller, send_controller)
        )

    return app


__all__ = ["create_app"]
