"""Model: the in-memory token store.

A factory returning a set-backed store so the repository can wrap the raw
set without owning its construction.
"""


def create_token_store() -> set:
    return set()


__all__ = ["create_token_store"]