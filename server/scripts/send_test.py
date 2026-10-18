#!/usr/bin/env python3
"""Manual test runner: fire token/topic/broadcast sends at a running sender.

Examples:
    uv run python scripts/send_test.py --mode token --token <reg-token>
    uv run python scripts/send_test.py --mode topic --topic news
    uv run python scripts/send_test.py --mode broadcast

Exits 0 on a 2xx response, 1 on a 4xx/5xx response, 2 on connection errors.
"""
import argparse
import json
import sys

import httpx


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--mode", choices=["token", "topic", "broadcast"], required=True
    )
    parser.add_argument("--token", help="registration token (token mode)")
    parser.add_argument("--topic", help="topic name (topic mode)")
    parser.add_argument("--title", default="send_test")
    parser.add_argument("--body", default="manual test run")
    parser.add_argument(
        "--base-url", default="http://127.0.0.1:3000", help="sender base URL"
    )
    args = parser.parse_args()

    payload = {"title": args.title, "body": args.body}
    if args.mode == "token":
        if not args.token:
            parser.error("--mode token requires --token")
        payload["token"] = args.token
    elif args.mode == "topic":
        if not args.topic:
            parser.error("--mode topic requires --topic")
        payload["topic"] = args.topic
    # broadcast: no target -> sender fans out to every registered token

    try:
        res = httpx.post(f"{args.base_url}/send", json=payload, timeout=15.0)
    except httpx.HTTPError as exc:
        print(f"connection error: {exc}", file=sys.stderr)
        return 2

    print(json.dumps({"status": res.status_code, "body": _maybe_json(res)}, indent=2))
    return 0 if res.is_success else 1


def _maybe_json(res: httpx.Response):
    try:
        return res.json()
    except ValueError:
        return res.text


if __name__ == "__main__":
    sys.exit(main())
