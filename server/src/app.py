"""Composition root. Keeps the create_app(...) factory contract."""
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .config.env import env
from .models.token_store import create_token_store
from .middleware.dev_auth import create_dev_auth, DevAuthError
from .services.notification_service import create_notification_service
from .controllers.token_controller import create_token_controller
from .controllers.subscription_controller import create_subscription_controller
from .controllers.send_controller import create_send_controller
from .routes import create_routes


def create_app(messaging=None, tokens=None, dev_secret=None):
    if tokens is None:
        tokens = create_token_store()
    if dev_secret is None:
        dev_secret = env.dev_secret

    app = FastAPI()

    service = None
    if messaging is not None:
        service = create_notification_service(messaging, tokens)

    dev_auth = create_dev_auth(dev_secret)
    token_controller = create_token_controller(service) if service is not None else None
    subscription_controller = (
        create_subscription_controller(service) if service is not None else None
    )
    send_controller = create_send_controller(service) if service is not None else None

    if token_controller is not None:
        app.include_router(
            create_routes(
                token_controller, subscription_controller, send_controller, dev_auth
            )
        )

    @app.exception_handler(DevAuthError)
    async def _dev_auth_handler(request, exc):
        return JSONResponse(
            status_code=401, content={"error": "missing or wrong X-Dev-Secret"}
        )

    return app


__all__ = ["create_app"]