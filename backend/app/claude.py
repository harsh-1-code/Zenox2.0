"""The Anthropic client, in one place.

It used to live in pipeline.py and be imported from there. When localize.py needed it
too, that produced pipeline -> localize -> pipeline: a circular import that crashed the
app at startup. Anything that needs the client imports it from here instead.
"""

from typing import Optional

from anthropic import Anthropic

from .config import ANTHROPIC_API_KEY

_client: Optional[Anthropic] = None


def get_client() -> Anthropic:
    """Created on first use so tests and tooling can import this without a key."""
    global _client
    if _client is None:
        _client = Anthropic(api_key=ANTHROPIC_API_KEY or None)
    return _client
