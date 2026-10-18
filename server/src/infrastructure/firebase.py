"""Infrastructure: Firebase Admin init.

Only this module (and the re-export in ``fcm.py``) touches the Admin SDK.
"""
import firebase_admin
from firebase_admin import credentials, initialize_app
import firebase_admin.messaging as messaging

from ..config.env import env


def _init():
    path = env.firebase_service_account_path
    cred = credentials.Certificate(path)
    if not firebase_admin._apps:
        initialize_app(cred)
    return messaging


messaging = _init()

__all__ = ["messaging"]