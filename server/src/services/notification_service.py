"""Service: FCM orchestration + dead-token pruning."""


class SendError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def _invalid_token_types(messaging):
    types = []
    unregistered = getattr(messaging, "UnregisteredError", None)
    if unregistered is not None:
        types.append(unregistered)
    exc_mod = getattr(messaging, "exceptions", None)
    if exc_mod is not None:
        invalid_arg = getattr(exc_mod, "InvalidArgumentError", None)
        if invalid_arg is not None:
            types.append(invalid_arg)
    return tuple(types)


def create_notification_service(messaging, tokens):
    from ..repositories.token_repository import create_token_repository

    repo = create_token_repository(tokens)
    invalid_types = _invalid_token_types(messaging)

    class NotificationService:
        def register_token(self, token) -> None:
            repo.add(token)

        def subscribe_to_topic(self, token, topic):
            return messaging.subscribe_to_topic(token, topic)

        def send_to_token(self, token, title, body):
            try:
                # Use `token=` (registration token), not `fid=`: `fid` is the
                # Firebase Installation ID, a different identifier. SDK 7.7.0
                # deprecates `token` in favour of `fid`, but registration
                # tokens are still delivered via the `token` field.
                message = messaging.Message(
                    notification=messaging.Notification(title=title, body=body),
                    token=token,
                )
                return messaging.send(message)
            except invalid_types as exc:
                repo.delete(token)
                code = getattr(exc, "code", None)
                raise SendError(
                    404,
                    f"token invalid, removed from store ({code if code else exc})",
                )
            except Exception as exc:
                code = getattr(exc, "code", None)
                raise SendError(502, code if code else str(exc))

        def send_to_topic(self, topic, title, body):
            try:
                message = messaging.Message(
                    notification=messaging.Notification(title=title, body=body),
                    topic=topic,
                )
                return messaging.send(message)
            except Exception as exc:
                code = getattr(exc, "code", None)
                raise SendError(502, code if code else str(exc))

        def send_broadcast(self, title, body):
            sent = 0
            failed = 0
            for token in list(repo.values()):
                try:
                    message = messaging.Message(
                        notification=messaging.Notification(title=title, body=body),
                        token=token,
                    )
                    messaging.send(message)
                    sent += 1
                except invalid_types:
                    repo.delete(token)
                    failed += 1
                except Exception:
                    failed += 1
            return {"sent": sent, "failed": failed}

        def get_token_count(self) -> int:
            return repo.size()

    return NotificationService()


__all__ = ["create_notification_service", "SendError"]