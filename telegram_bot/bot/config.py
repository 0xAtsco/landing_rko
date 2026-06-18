from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from dotenv import load_dotenv


DEFAULT_DATABASE_URL = "sqlite+aiosqlite:///./data/rko_leads.db"
DEFAULT_TIMEZONE = "Europe/Moscow"


@dataclass(frozen=True)
class Settings:
    bot_token: str
    admin_chat_id: int | None
    database_url: str
    timezone_name: str
    timezone: ZoneInfo
    reminder_poll_interval_seconds: int
    google_sheet_id: str | None
    google_service_account_file: str | None
    google_worksheet_index: int


def normalize_database_url(database_url: str | None) -> str:
    url = (database_url or DEFAULT_DATABASE_URL).strip()

    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)

    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return url


def load_settings() -> Settings:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    load_dotenv(env_path)

    bot_token = (os.getenv("BOT_TOKEN") or "").strip()
    if not bot_token:
        raise RuntimeError("BOT_TOKEN is required")

    admin_chat_id_raw = (os.getenv("ADMIN_CHAT_ID") or "").strip()
    admin_chat_id = int(admin_chat_id_raw) if admin_chat_id_raw else None

    timezone_name = (os.getenv("TIMEZONE") or DEFAULT_TIMEZONE).strip()
    try:
        timezone = ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise RuntimeError(f"Unknown TIMEZONE: {timezone_name}") from exc

    interval_raw = (os.getenv("REMINDER_POLL_INTERVAL_SECONDS") or "60").strip()
    reminder_poll_interval_seconds = max(10, int(interval_raw))
    google_sheet_id = (os.getenv("GOOGLE_SHEET_ID") or "").strip() or None
    google_service_account_file = (
        os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE") or ""
    ).strip() or None
    google_worksheet_index_raw = (os.getenv("GOOGLE_WORKSHEET_INDEX") or "0").strip()

    return Settings(
        bot_token=bot_token,
        admin_chat_id=admin_chat_id,
        database_url=normalize_database_url(os.getenv("DATABASE_URL")),
        timezone_name=timezone_name,
        timezone=timezone,
        reminder_poll_interval_seconds=reminder_poll_interval_seconds,
        google_sheet_id=google_sheet_id,
        google_service_account_file=google_service_account_file,
        google_worksheet_index=max(0, int(google_worksheet_index_raw)),
    )
