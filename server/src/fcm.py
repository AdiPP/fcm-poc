"""Retained as a re-export so existing import paths keep working."""
from .infrastructure import firebase as _firebase

messaging = _firebase.messaging

__all__ = ["messaging"]