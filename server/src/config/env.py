"""Centralized environment access (mirrors the JS env module)."""
import os

try:
    from dotenv import load_dotenv

    for candidate in ("/.env", "../.env", "../../.env", "../../../.env", ".env"):
        if os.path.exists(candidate):
            load_dotenv(candidate, override=False)
except Exception:
    pass


class _Env:
    def __init__(self) -> None:
        self.port = int(os.environ.get("PORT", "3000"))
        self.dev_secret = os.environ.get("DEV_SECRET")
        self.firebase_service_account_path = os.environ.get(
            "FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccount.json"
        )


env = _Env()

__all__ = ["env"]