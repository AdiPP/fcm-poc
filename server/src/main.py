"""Entrypoint for the FCM POC sender."""
import uvicorn

from .config.env import env
from .fcm import messaging
from .app import create_app


def main() -> None:
    app = create_app(messaging=messaging)
    uvicorn.run(app, host="0.0.0.0", port=env.port)


if __name__ == "__main__":
    main()
