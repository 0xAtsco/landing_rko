from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from dotenv import load_dotenv


DEFAULT_SQLITE_PATH = "./data/vc_funnel.db"
DEFAULT_TIMEZONE = "Europe/Moscow"


@dataclass(frozen=True)
class Settings:
    bot_token: str
    sqlite_path: str
    database_url: str | None
    sales_chat_id: int | None
    private_channel_invite_url: str | None
    materials_title: str
    materials_url: str | None
    youtube_materials_url: str | None
    telegram_materials_url: str | None
    timezone_name: str
    timezone: ZoneInfo
    enable_text_triggers: bool
    enable_followups: bool
    debug: bool
    sales_chat_ids: tuple[int, ...] = ()
    admin_ids: set[int] = field(default_factory=set)
    bot_username: str | None = None
    set_bot_commands_on_start: bool = False
    cleanup_old_bot_messages: bool = True
    keep_last_bot_messages: int = 1
    ux_typing_delay_enabled: bool = True
    ux_typing_delay_seconds: float = 0.8
    ux_typing_delay_test_mode: bool = False
    enable_typewriter: bool = False


def _bool_env(name: str, default: bool) -> bool:
    raw = (os.getenv(name) or "").strip().lower()
    if not raw:
        return default
    return raw in {"1", "true", "yes", "on"}


def _optional_str(name: str) -> str | None:
    return (os.getenv(name) or "").strip() or None


def _int_tuple_env(name: str) -> tuple[int, ...]:
    raw = (os.getenv(name) or "").strip()
    if not raw:
        return ()
    try:
        return tuple(int(part.strip()) for part in raw.split(",") if part.strip())
    except ValueError as exc:
        raise RuntimeError(f"{name} must be comma-separated integers") from exc


def _int_set_env(name: str) -> set[int]:
    raw = (os.getenv(name) or "").strip()
    if not raw:
        return set()
    try:
        return {int(part.strip()) for part in raw.split(",") if part.strip()}
    except ValueError as exc:
        raise RuntimeError(f"{name} must be comma-separated integers") from exc


def _int_env(name: str, default: int) -> int:
    raw = (os.getenv(name) or "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer") from exc


def _float_env(name: str, default: float) -> float:
    raw = (os.getenv(name) or "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be a number") from exc


def load_settings() -> Settings:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    load_dotenv(env_path)

    bot_token = (os.getenv("VC_BOT_TOKEN") or "").strip()
    if not bot_token:
        raise RuntimeError("VC_BOT_TOKEN is required for vc_funnel_bot")

    timezone_name = (os.getenv("VC_DEFAULT_TIMEZONE") or DEFAULT_TIMEZONE).strip()
    try:
        timezone = ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise RuntimeError(f"Unknown VC_DEFAULT_TIMEZONE: {timezone_name}") from exc

    sqlite_path = (os.getenv("VC_SQLITE_PATH") or DEFAULT_SQLITE_PATH).strip()
    sales_chat_ids = _int_tuple_env("VC_SALES_CHAT_ID")

    return Settings(
        bot_token=bot_token,
        sqlite_path=sqlite_path,
        database_url=_optional_str("VC_DATABASE_URL"),
        sales_chat_id=sales_chat_ids[0] if sales_chat_ids else None,
        sales_chat_ids=sales_chat_ids,
        admin_ids=_int_set_env("VC_ADMIN_IDS"),
        bot_username=_optional_str("VC_BOT_USERNAME"),
        set_bot_commands_on_start=_bool_env("VC_SET_BOT_COMMANDS_ON_START", False),
        private_channel_invite_url=_optional_str("VC_PRIVATE_CHANNEL_INVITE_URL"),
        materials_title=(os.getenv("VC_MATERIALS_TITLE") or "Материалы к ролику Андрея").strip(),
        materials_url=_optional_str("VC_MATERIALS_URL"),
        youtube_materials_url=_optional_str("VC_YOUTUBE_MATERIALS_URL"),
        telegram_materials_url=_optional_str("VC_TELEGRAM_MATERIALS_URL"),
        timezone_name=timezone_name,
        timezone=timezone,
        enable_text_triggers=_bool_env("VC_ENABLE_TEXT_TRIGGERS", True),
        enable_followups=_bool_env("VC_ENABLE_FOLLOWUPS", False),
        debug=_bool_env("VC_DEBUG", False),
        cleanup_old_bot_messages=_bool_env("VC_CLEANUP_OLD_BOT_MESSAGES", True),
        keep_last_bot_messages=_int_env("VC_KEEP_LAST_BOT_MESSAGES", 1),
        ux_typing_delay_enabled=_bool_env("VC_UX_TYPING_DELAY_ENABLED", True),
        ux_typing_delay_seconds=_float_env("VC_UX_TYPING_DELAY_SECONDS", 0.8),
        ux_typing_delay_test_mode=_bool_env("VC_UX_TYPING_DELAY_TEST_MODE", False),
        enable_typewriter=_bool_env("VC_ENABLE_TYPEWRITER", False),
    )


def resolve_sqlite_path(settings: Settings) -> Path:
    if settings.database_url:
        prefix = "sqlite:///"
        if not settings.database_url.startswith(prefix):
            raise RuntimeError("VC_DATABASE_URL supports only sqlite:/// URLs in P0")
        database = settings.database_url.removeprefix(prefix)
        return Path(database).expanduser()
    return Path(settings.sqlite_path).expanduser()
