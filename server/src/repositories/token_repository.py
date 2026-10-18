"""Repository: the only module that reads/writes the underlying token store."""


class TokenRepository:
    def __init__(self, tokens) -> None:
        self._tokens = tokens

    def add(self, token) -> None:
        self._tokens.add(token)

    def has(self, token) -> bool:
        return token in self._tokens

    def delete(self, token) -> bool:
        if token in self._tokens:
            self._tokens.discard(token)
            return True
        return False

    def size(self) -> int:
        return len(self._tokens)

    def values(self):
        return list(self._tokens)


def create_token_repository(tokens):
    return TokenRepository(tokens)


__all__ = ["create_token_repository", "TokenRepository"]