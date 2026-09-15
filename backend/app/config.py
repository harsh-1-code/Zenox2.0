import os
from pathlib import Path

from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
PROMPTS = BASE / "prompts"

# .env lives at the repo root, one level above backend/ - don't depend on cwd.
load_dotenv(BASE.parent / ".env")

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")
SESSION_TTL_MIN = int(os.environ.get("SESSION_TTL_MIN", "30"))
MAX_TOKENS = 3000
