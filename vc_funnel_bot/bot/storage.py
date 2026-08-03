from __future__ import annotations

import asyncio
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import aiosqlite

from .analytics import calculate_temperature
from .models import (
    Event,
    Lead,
    Material,
    SourceInfo,
    SupportTicket,
    WebinarDelivery,
    WebinarEventConfig,
    WebinarRegistration,
)


LEAD_COLUMNS = [
    "id",
    "telegram_id",
    "username",
    "first_name",
    "contact",
    "raw_start_payload",
    "latest_start_payload",
    "source_type",
    "source_channel",
    "source",
    "entry_surface",
    "entry_mode",
    "campaign",
    "content_id",
    "cta_type",
    "cjm",
    "post_id",
    "post_slug",
    "post_topic",
    "segment",
    "pain",
    "intent",
    "urgency",
    "application_context",
    "lead_status",
    "lead_temperature",
    "materials_sent",
    "private_channel_sent",
    "call_requested",
    "sales_notified",
    "sales_notified_at",
    "support_notified",
    "support_notified_at",
    "last_bot_screen_message_id",
    "bot_screen_message_ids",
    "created_at",
    "updated_at",
    "last_interaction_at",
]

WEBINAR_REGISTRATION_COLUMNS = [
    "id",
    "event_id",
    "telegram_user_id",
    "telegram_chat_id",
    "username",
    "first_name",
    "source",
    "start_payload",
    "campaign",
    "post",
    "selected_route",
    "bottleneck",
    "registered_at",
    "registration_status",
    "reminder_24h_sent_at",
    "reminder_3h_sent_at",
    "reminder_15m_sent_at",
    "join_clicked_at",
    "replay_clicked_at",
    "created_at",
    "updated_at",
]

REMINDER_FIELDS = {
    "24h": "reminder_24h_sent_at",
    "3h": "reminder_3h_sent_at",
    "15m": "reminder_15m_sent_at",
}
WEBINAR_ROUTES = {
    "find_business",
    "offer",
    "build",
    "deal",
    "setup_help",
}


class VcStorage:
    def __init__(self, sqlite_path: Path, timezone: ZoneInfo) -> None:
        self.sqlite_path = sqlite_path
        self.timezone = timezone
        self._db: aiosqlite.Connection | None = None
        self._lead_locks: dict[int, asyncio.Lock] = {}

    async def connect(self) -> None:
        self.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        self._db = await aiosqlite.connect(self.sqlite_path)
        self._db.row_factory = aiosqlite.Row
        await self._db.execute("PRAGMA journal_mode=WAL")
        await self._db.execute("PRAGMA foreign_keys=ON")
        await self._init_schema()

    async def close(self) -> None:
        if self._db is not None:
            await self._db.close()
            self._db = None

    @property
    def db(self) -> aiosqlite.Connection:
        if self._db is None:
            raise RuntimeError("VcStorage is not connected")
        return self._db

    def now(self) -> str:
        return datetime.now(self.timezone).replace(tzinfo=None).isoformat(timespec="seconds")

    def _lead_lock(self, telegram_id: int) -> asyncio.Lock:
        lock = self._lead_locks.get(telegram_id)
        if lock is None:
            lock = asyncio.Lock()
            self._lead_locks[telegram_id] = lock
        return lock

    async def _init_schema(self) -> None:
        await self.db.executescript(
            """
            CREATE TABLE IF NOT EXISTS vc_funnel_leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER NOT NULL UNIQUE,
                username TEXT,
                first_name TEXT,
                contact TEXT,
                raw_start_payload TEXT,
                latest_start_payload TEXT,
                source_type TEXT NOT NULL,
                source_channel TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'unknown',
                entry_surface TEXT NOT NULL DEFAULT 'unknown',
                entry_mode TEXT NOT NULL DEFAULT 'universal_start',
                campaign TEXT NOT NULL,
                content_id TEXT NOT NULL,
                cta_type TEXT NOT NULL,
                cjm TEXT NOT NULL,
                post_id TEXT,
                post_slug TEXT,
                post_topic TEXT,
                segment TEXT,
                pain TEXT,
                intent TEXT,
                urgency TEXT,
                application_context TEXT,
                lead_status TEXT NOT NULL,
                lead_temperature TEXT NOT NULL,
                materials_sent INTEGER NOT NULL DEFAULT 0,
                private_channel_sent INTEGER NOT NULL DEFAULT 0,
                call_requested INTEGER NOT NULL DEFAULT 0,
                sales_notified INTEGER NOT NULL DEFAULT 0,
                sales_notified_at TEXT,
                support_notified INTEGER NOT NULL DEFAULT 0,
                support_notified_at TEXT,
                last_bot_screen_message_id INTEGER,
                bot_screen_message_ids TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_interaction_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS vc_funnel_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER,
                event_type TEXT NOT NULL,
                event_payload_json TEXT,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_vc_funnel_events_telegram_id
                ON vc_funnel_events (telegram_id);

            CREATE TABLE IF NOT EXISTS vc_funnel_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_key TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                body TEXT,
                url TEXT,
                telegram_file_id TEXT,
                telegram_file_type TEXT,
                telegram_file_name TEXT,
                telegram_caption TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS vc_funnel_payload_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload TEXT NOT NULL UNIQUE,
                material_key TEXT NOT NULL,
                title_override TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS vc_funnel_webinar_registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                telegram_user_id INTEGER NOT NULL,
                telegram_chat_id INTEGER NOT NULL,
                username TEXT,
                first_name TEXT,
                source TEXT NOT NULL DEFAULT 'unknown',
                start_payload TEXT,
                campaign TEXT,
                post TEXT,
                selected_route TEXT,
                bottleneck TEXT,
                registered_at TEXT NOT NULL,
                registration_status TEXT NOT NULL DEFAULT 'registered',
                reminder_24h_sent_at TEXT,
                reminder_3h_sent_at TEXT,
                reminder_15m_sent_at TEXT,
                join_clicked_at TEXT,
                replay_clicked_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(event_id, telegram_user_id)
            );

            CREATE INDEX IF NOT EXISTS idx_vc_webinar_event_status
                ON vc_funnel_webinar_registrations (
                    event_id,
                    registration_status
                );
            CREATE INDEX IF NOT EXISTS idx_vc_webinar_reminder_24h
                ON vc_funnel_webinar_registrations (
                    event_id,
                    reminder_24h_sent_at
                );
            CREATE INDEX IF NOT EXISTS idx_vc_webinar_reminder_3h
                ON vc_funnel_webinar_registrations (
                    event_id,
                    reminder_3h_sent_at
                );
            CREATE INDEX IF NOT EXISTS idx_vc_webinar_reminder_15m
                ON vc_funnel_webinar_registrations (
                    event_id,
                    reminder_15m_sent_at
                );

            CREATE TABLE IF NOT EXISTS vc_funnel_webinar_events (
                event_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                start_at TEXT,
                timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',
                join_url TEXT,
                replay_url TEXT,
                phase TEXT NOT NULL DEFAULT 'draft',
                event_version INTEGER NOT NULL DEFAULT 1,
                support_manager_chat_id INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS vc_funnel_webinar_deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                event_version INTEGER NOT NULL,
                telegram_user_id INTEGER NOT NULL,
                telegram_chat_id INTEGER NOT NULL,
                delivery_type TEXT NOT NULL,
                scheduled_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                payload_json TEXT,
                sent_at TEXT,
                error_type TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(event_id, event_version, telegram_user_id, delivery_type)
            );
            CREATE INDEX IF NOT EXISTS idx_vc_webinar_deliveries_due
                ON vc_funnel_webinar_deliveries (event_id, event_version, status, scheduled_at);

            CREATE TABLE IF NOT EXISTS vc_funnel_support_tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                telegram_chat_id INTEGER NOT NULL,
                username TEXT,
                source TEXT NOT NULL DEFAULT 'unknown',
                topic TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                assigned_admin_id INTEGER,
                answer_text TEXT,
                answered_by_admin_id INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                answered_at TEXT,
                event_version INTEGER,
                route_key TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_vc_support_tickets_status
                ON vc_funnel_support_tickets (status, updated_at DESC);

            CREATE TABLE IF NOT EXISTS vc_funnel_support_drafts (
                user_id INTEGER PRIMARY KEY,
                topic TEXT NOT NULL,
                event_version INTEGER,
                route_key TEXT,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS vc_funnel_support_admin_states (
                admin_id INTEGER PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                chat_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        await self._ensure_columns(
            "vc_funnel_leads",
            {
                "source": "TEXT NOT NULL DEFAULT 'unknown'",
                "entry_surface": "TEXT NOT NULL DEFAULT 'unknown'",
                "entry_mode": "TEXT NOT NULL DEFAULT 'universal_start'",
                "post_id": "TEXT",
                "post_slug": "TEXT",
                "post_topic": "TEXT",
                "urgency": "TEXT",
                "application_context": "TEXT",
                "support_notified": "INTEGER NOT NULL DEFAULT 0",
                "support_notified_at": "TEXT",
                "last_bot_screen_message_id": "INTEGER",
                "bot_screen_message_ids": "TEXT NOT NULL DEFAULT '[]'",
            },
        )
        await self._ensure_columns(
            "vc_funnel_webinar_registrations",
            {"registered_event_version": "INTEGER NOT NULL DEFAULT 1"},
        )
        await self._ensure_columns(
            "vc_funnel_materials",
            {
                "telegram_file_status": "TEXT NOT NULL DEFAULT 'unverified'",
                "telegram_file_verified_at": "TEXT",
                "telegram_file_error": "TEXT",
            },
        )
        await self.db.commit()

    async def _ensure_columns(self, table: str, columns: dict[str, str]) -> None:
        cursor = await self.db.execute(f"PRAGMA table_info({table})")
        existing = {row["name"] for row in await cursor.fetchall()}
        for name, definition in columns.items():
            if name not in existing:
                await self.db.execute(f"ALTER TABLE {table} ADD COLUMN {name} {definition}")

    async def add_event(
        self,
        telegram_id: int | None,
        event_type: str,
        payload: dict[str, Any] | None = None,
    ) -> None:
        await self.db.execute(
            """
            INSERT INTO vc_funnel_events (telegram_id, event_type, event_payload_json, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                telegram_id,
                event_type,
                json.dumps(payload or {}, ensure_ascii=False),
                self.now(),
            ),
        )
        await self.db.commit()

    async def count_events(self, telegram_id: int, event_type: str) -> int:
        cursor = await self.db.execute(
            """
            SELECT COUNT(*) AS total
            FROM vc_funnel_events
            WHERE telegram_id = ? AND event_type = ?
            """,
            (telegram_id, event_type),
        )
        row = await cursor.fetchone()
        return int(row["total"]) if row else 0

    async def list_events(self, telegram_id: int) -> list[Event]:
        cursor = await self.db.execute(
            """
            SELECT id, telegram_id, event_type, event_payload_json, created_at
            FROM vc_funnel_events
            WHERE telegram_id = ?
            ORDER BY id
            """,
            (telegram_id,),
        )
        rows = await cursor.fetchall()
        return [
            Event(
                id=int(row["id"]),
                telegram_id=row["telegram_id"],
                event_type=row["event_type"],
                event_payload=json.loads(row["event_payload_json"] or "{}"),
                created_at=row["created_at"],
            )
            for row in rows
        ]

    async def list_recent_events(self, telegram_id: int | None = None, *, limit: int = 50) -> list[Event]:
        if telegram_id is None:
            cursor = await self.db.execute(
                """
                SELECT id, telegram_id, event_type, event_payload_json, created_at
                FROM vc_funnel_events
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            )
        else:
            cursor = await self.db.execute(
                """
                SELECT id, telegram_id, event_type, event_payload_json, created_at
                FROM vc_funnel_events
                WHERE telegram_id = ?
                ORDER BY id DESC
                LIMIT ?
                """,
                (telegram_id, limit),
            )
        rows = await cursor.fetchall()
        return [
            Event(
                id=int(row["id"]),
                telegram_id=row["telegram_id"],
                event_type=row["event_type"],
                event_payload=json.loads(row["event_payload_json"] or "{}"),
                created_at=row["created_at"],
            )
            for row in rows
        ]

    async def get_lead(self, telegram_id: int) -> Lead | None:
        cursor = await self.db.execute(
            f"SELECT {', '.join(LEAD_COLUMNS)} FROM vc_funnel_leads WHERE telegram_id = ?",
            (telegram_id,),
        )
        row = await cursor.fetchone()
        return self._row_to_lead(row) if row else None

    async def list_recent_leads(self, *, limit: int = 20) -> list[Lead]:
        cursor = await self.db.execute(
            f"""
            SELECT {', '.join(LEAD_COLUMNS)}
            FROM vc_funnel_leads
            ORDER BY updated_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [self._row_to_lead(row) for row in await cursor.fetchall()]

    async def stats(self) -> dict[str, Any]:
        result: dict[str, Any] = {}
        event_names = (
            "route_started",
            "situation_selected",
            "bundle_delivered",
            "full_playbook_requested",
            "application_started",
            "application_submitted",
            "support_requested",
        )
        placeholders = ", ".join("?" for _ in event_names)
        cursor = await self.db.execute(
            f"""
            SELECT events.event_type AS label,
                   COUNT(DISTINCT events.telegram_id) AS total
            FROM vc_funnel_events AS events
            WHERE events.event_type IN ({placeholders})
            GROUP BY events.event_type
            """,
            event_names,
        )
        counts = {row["label"]: int(row["total"]) for row in await cursor.fetchall()}
        result["starts_total"] = counts.get("route_started", 0)
        for source, label in (
            ("youtube", "YouTube"),
            ("telegram", "Telegram"),
        ):
            row = await (
                await self.db.execute(
                    """
                    SELECT COUNT(DISTINCT telegram_id) AS total
                    FROM vc_funnel_events
                    WHERE event_type = 'route_started'
                      AND json_extract(event_payload_json, '$.source') = ?
                    """,
                    (label,),
                )
            ).fetchone()
            result[f"starts_{source}"] = int(row["total"]) if row else 0
        result["questions_completed"] = counts.get("situation_selected", 0)
        result["bundle_delivered"] = counts.get("bundle_delivered", 0)
        result["unique_starts"] = result["starts_total"]
        result["router_completed"] = result["questions_completed"]
        row = await (
            await self.db.execute(
                """
                SELECT COUNT(DISTINCT telegram_id) AS total
                FROM vc_funnel_events
                WHERE event_type = 'full_playbook_requested'
                  AND json_extract(
                        event_payload_json,
                        '$.delivery_status'
                      ) = 'delivered'
                """
            )
        ).fetchone()
        result["playbook_opened"] = int(row["total"]) if row else 0
        result["applications_started"] = counts.get("application_started", 0)
        result["applications_submitted"] = counts.get("application_submitted", 0)
        result["support_requests"] = counts.get("support_requested", 0)
        result["hermes_funnel"] = [
            (event_type, counts.get(event_type, 0))
            for event_type in event_names
        ]
        return result

    async def export_leads_rows(self) -> list[dict[str, Any]]:
        cursor = await self.db.execute(f"SELECT {', '.join(LEAD_COLUMNS)} FROM vc_funnel_leads ORDER BY updated_at DESC")
        return [dict(row) for row in await cursor.fetchall()]

    async def get_webinar_registration(
        self,
        event_id: str,
        telegram_user_id: int,
    ) -> WebinarRegistration | None:
        cursor = await self.db.execute(
            f"""
            SELECT {", ".join(WEBINAR_REGISTRATION_COLUMNS)}
            FROM vc_funnel_webinar_registrations
            WHERE event_id = ? AND telegram_user_id = ?
            """,
            (event_id, telegram_user_id),
        )
        row = await cursor.fetchone()
        return self._row_to_webinar_registration(row) if row else None

    async def upsert_webinar_registration(
        self,
        *,
        event_id: str,
        telegram_user_id: int,
        telegram_chat_id: int,
        username: str | None,
        first_name: str | None,
        source: str,
        start_payload: str | None,
        campaign: str | None,
        post: str | None,
        selected_route: str | None,
        bottleneck: str | None,
    ) -> tuple[WebinarRegistration, bool]:
        if (
            selected_route is not None
            and selected_route not in WEBINAR_ROUTES
        ):
            raise ValueError(
                f"Unsupported webinar route: {selected_route}"
            )
        now = self.now()
        cursor = await self.db.execute(
            """
            INSERT INTO vc_funnel_webinar_registrations (
                event_id, telegram_user_id, telegram_chat_id, username,
                first_name, source, start_payload, campaign, post,
                selected_route, bottleneck, registered_at,
                registration_status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', ?, ?)
            ON CONFLICT(event_id, telegram_user_id) DO NOTHING
            """,
            (
                event_id,
                telegram_user_id,
                telegram_chat_id,
                username,
                first_name,
                source,
                start_payload,
                campaign,
                post,
                selected_route,
                bottleneck,
                now,
                now,
                now,
            ),
        )
        created = cursor.rowcount == 1
        if not created:
            await self.db.execute(
                """
                UPDATE vc_funnel_webinar_registrations
                SET telegram_chat_id = ?,
                    username = ?,
                    first_name = ?,
                    registration_status = 'registered',
                    updated_at = ?
                WHERE event_id = ? AND telegram_user_id = ?
                """,
                (
                    telegram_chat_id,
                    username,
                    first_name,
                    now,
                    event_id,
                    telegram_user_id,
                ),
            )
        await self.db.commit()
        registration = await self.get_webinar_registration(
            event_id,
            telegram_user_id,
        )
        if registration is None:
            raise RuntimeError("Webinar registration was not saved")
        return registration, created

    async def list_due_webinar_registrations(
        self,
        event_id: str,
        reminder_type: str,
    ) -> list[WebinarRegistration]:
        field = REMINDER_FIELDS.get(reminder_type)
        if field is None:
            raise ValueError(f"Unknown reminder type: {reminder_type}")
        cursor = await self.db.execute(
            f"""
            SELECT {", ".join(WEBINAR_REGISTRATION_COLUMNS)}
            FROM vc_funnel_webinar_registrations
            WHERE event_id = ?
              AND registration_status = 'registered'
              AND {field} IS NULL
            ORDER BY id
            """,
            (event_id,),
        )
        return [
            self._row_to_webinar_registration(row)
            for row in await cursor.fetchall()
        ]

    async def mark_webinar_reminder_sent(
        self,
        event_id: str,
        telegram_user_id: int,
        reminder_type: str,
    ) -> bool:
        field = REMINDER_FIELDS.get(reminder_type)
        if field is None:
            raise ValueError(f"Unknown reminder type: {reminder_type}")
        now = self.now()
        cursor = await self.db.execute(
            f"""
            UPDATE vc_funnel_webinar_registrations
            SET {field} = ?, updated_at = ?
            WHERE event_id = ?
              AND telegram_user_id = ?
              AND {field} IS NULL
            """,
            (now, now, event_id, telegram_user_id),
        )
        await self.db.commit()
        return cursor.rowcount == 1

    async def clear_webinar_reminder_sent(
        self,
        event_id: str,
        telegram_user_id: int,
        reminder_type: str,
    ) -> None:
        field = REMINDER_FIELDS.get(reminder_type)
        if field is None:
            raise ValueError(f"Unknown reminder type: {reminder_type}")
        await self.db.execute(
            f"""
            UPDATE vc_funnel_webinar_registrations
            SET {field} = NULL, updated_at = ?
            WHERE event_id = ? AND telegram_user_id = ?
            """,
            (self.now(), event_id, telegram_user_id),
        )
        await self.db.commit()

    async def mark_webinar_click(
        self,
        event_id: str,
        telegram_user_id: int,
        click_type: str,
    ) -> bool:
        field = {
            "join": "join_clicked_at",
            "replay": "replay_clicked_at",
        }.get(click_type)
        if field is None:
            raise ValueError(f"Unknown webinar click type: {click_type}")
        now = self.now()
        cursor = await self.db.execute(
            f"""
            UPDATE vc_funnel_webinar_registrations
            SET {field} = COALESCE({field}, ?), updated_at = ?
            WHERE event_id = ? AND telegram_user_id = ?
            """,
            (now, now, event_id, telegram_user_id),
        )
        await self.db.commit()
        return cursor.rowcount == 1

    async def webinar_stats(self, event_id: str) -> dict[str, Any]:
        result: dict[str, Any] = {"event_id": event_id}
        row = await (
            await self.db.execute(
                """
                SELECT COUNT(*) AS registrations,
                       SUM(reminder_24h_sent_at IS NOT NULL) AS reminder_24h,
                       SUM(reminder_3h_sent_at IS NOT NULL) AS reminder_3h,
                       SUM(reminder_15m_sent_at IS NOT NULL) AS reminder_15m,
                       SUM(join_clicked_at IS NOT NULL) AS join_clicked
                FROM vc_funnel_webinar_registrations
                WHERE event_id = ? AND registration_status = 'registered'
                """,
                (event_id,),
            )
        ).fetchone()
        result.update(
            {
                "registrations": int(row["registrations"] or 0),
                "reminder_24h": int(row["reminder_24h"] or 0),
                "reminder_3h": int(row["reminder_3h"] or 0),
                "reminder_15m": int(row["reminder_15m"] or 0),
                "join_clicked": int(row["join_clicked"] or 0),
            }
        )

        for column, result_key in (
            ("source", "by_source"),
            ("selected_route", "by_route"),
        ):
            cursor = await self.db.execute(
                f"""
                SELECT COALESCE({column}, 'unknown') AS label,
                       COUNT(*) AS total
                FROM vc_funnel_webinar_registrations
                WHERE event_id = ? AND registration_status = 'registered'
                GROUP BY COALESCE({column}, 'unknown')
                ORDER BY total DESC, label
                """,
                (event_id,),
            )
            result[result_key] = {
                str(item["label"]): int(item["total"])
                for item in await cursor.fetchall()
            }

        event_counts: dict[str, int] = {}
        for event_type in (
            "webinar_card_shown",
            "webinar_registered",
            "webinar_join_clicked",
        ):
            count_row = await (
                await self.db.execute(
                    """
                    SELECT COUNT(DISTINCT telegram_id) AS total
                    FROM vc_funnel_events
                    WHERE event_type = ?
                      AND json_extract(event_payload_json, '$.event_id') = ?
                    """,
                    (event_type, event_id),
                )
            ).fetchone()
            event_counts[event_type] = int(count_row["total"] or 0)
        card_shown = event_counts["webinar_card_shown"]
        registered = event_counts["webinar_registered"]
        joined = event_counts["webinar_join_clicked"]
        result["webinar_card_shown"] = card_shown
        result["webinar_registered"] = registered
        result["registration_conversion"] = (
            registered / card_shown if card_shown else 0.0
        )
        result["join_click_conversion"] = (
            joined / registered if registered else 0.0
        )
        return result

    async def ensure_webinar_event(
        self,
        *,
        event_id: str = "E02",
        title: str,
        start_at: str | None,
        join_url: str | None = None,
        replay_url: str | None = None,
        support_manager_chat_id: int | None = None,
    ) -> WebinarEventConfig:
        """Create the one persisted E02 config once; later env changes never overwrite it."""
        now = self.now()
        await self.db.execute(
            """
            INSERT INTO vc_funnel_webinar_events (
                event_id, title, start_at, timezone, join_url, replay_url, phase,
                event_version, support_manager_chat_id, created_at, updated_at
            ) VALUES (?, ?, ?, 'Europe/Moscow', ?, ?, 'draft', 1, ?, ?, ?)
            ON CONFLICT(event_id) DO NOTHING
            """,
            (event_id, title, start_at, join_url, replay_url, support_manager_chat_id, now, now),
        )
        await self.db.commit()
        config = await self.get_webinar_event(event_id)
        if config is None:
            raise RuntimeError("Webinar event configuration was not saved")
        return config

    async def get_webinar_event(self, event_id: str = "E02") -> WebinarEventConfig | None:
        cursor = await self.db.execute(
            """
            SELECT event_id, title, start_at, timezone, join_url, replay_url, phase,
                   event_version, support_manager_chat_id, created_at, updated_at
            FROM vc_funnel_webinar_events WHERE event_id = ?
            """,
            (event_id,),
        )
        row = await cursor.fetchone()
        return self._row_to_webinar_event(row) if row else None

    async def update_webinar_event(
        self,
        event_id: str,
        *,
        title: str | None = None,
        join_url: str | None | object = ...,
        replay_url: str | None | object = ...,
        phase: str | None = None,
        support_manager_chat_id: int | None | object = ...,
    ) -> WebinarEventConfig:
        current = await self.get_webinar_event(event_id)
        if current is None:
            raise RuntimeError("Webinar event is not configured")
        if phase is not None and phase not in {"draft", "registration", "live", "replay", "closed"}:
            raise ValueError("Unsupported webinar phase")
        fields: dict[str, Any] = {"updated_at": self.now()}
        if title is not None:
            fields["title"] = title.strip()
        if join_url is not ...:
            fields["join_url"] = join_url
        if replay_url is not ...:
            fields["replay_url"] = replay_url
        if phase is not None:
            fields["phase"] = phase
        if support_manager_chat_id is not ...:
            fields["support_manager_chat_id"] = support_manager_chat_id
        assignments = ", ".join(f"{key} = ?" for key in fields)
        await self.db.execute(
            f"UPDATE vc_funnel_webinar_events SET {assignments} WHERE event_id = ?",
            [self._sqlite_value(value) for value in fields.values()] + [event_id],
        )
        await self.db.commit()
        return await self.get_webinar_event(event_id) or current

    async def reschedule_webinar_event(
        self,
        event_id: str,
        *,
        start_at: datetime,
        now: datetime | None = None,
    ) -> WebinarEventConfig:
        current = await self.get_webinar_event(event_id)
        if current is None:
            raise RuntimeError("Webinar event is not configured")
        if start_at.tzinfo is None or start_at.utcoffset() is None:
            raise ValueError("start_at must be timezone-aware")
        start = start_at.astimezone(self.timezone)
        current_now = (now or datetime.now(self.timezone)).astimezone(self.timezone)
        if start <= current_now:
            raise ValueError("New webinar start must be in the future")
        new_version = current.event_version + 1
        now_text = self.now()
        await self.db.execute("BEGIN")
        try:
            await self.db.execute(
                """
                UPDATE vc_funnel_webinar_events
                SET start_at = ?, phase = 'registration', event_version = ?, updated_at = ?
                WHERE event_id = ?
                """,
                (start.isoformat(), new_version, now_text, event_id),
            )
            await self.db.execute(
                """
                UPDATE vc_funnel_webinar_deliveries
                SET status = 'cancelled', updated_at = ?
                WHERE event_id = ? AND event_version = ? AND status IN ('pending', 'sending')
                """,
                (now_text, event_id, current.event_version),
            )
            cursor = await self.db.execute(
                """
                SELECT telegram_user_id, telegram_chat_id
                FROM vc_funnel_webinar_registrations
                WHERE event_id = ? AND registration_status = 'registered'
                """,
                (event_id,),
            )
            for row in await cursor.fetchall():
                await self._schedule_webinar_deliveries_unlocked(
                    event_id=event_id,
                    event_version=new_version,
                    telegram_user_id=int(row["telegram_user_id"]),
                    telegram_chat_id=int(row["telegram_chat_id"]),
                    start_at=start,
                    now=current_now,
                )
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            raise
        config = await self.get_webinar_event(event_id)
        if config is None:
            raise RuntimeError("Webinar event was not rescheduled")
        return config

    async def schedule_webinar_deliveries(
        self,
        *,
        event: WebinarEventConfig,
        telegram_user_id: int,
        telegram_chat_id: int,
        now: datetime | None = None,
    ) -> None:
        if not event.start_at or event.phase not in {"registration", "live"}:
            return
        start = datetime.fromisoformat(event.start_at).astimezone(self.timezone)
        current = (now or datetime.now(self.timezone)).astimezone(self.timezone)
        await self._schedule_webinar_deliveries_unlocked(
            event_id=event.event_id,
            event_version=event.event_version,
            telegram_user_id=telegram_user_id,
            telegram_chat_id=telegram_chat_id,
            start_at=start,
            now=current,
        )
        await self.db.commit()

    async def queue_reschedule_notices(self, event: WebinarEventConfig) -> int:
        now = self.now()
        cursor = await self.db.execute(
            """SELECT telegram_user_id, telegram_chat_id
                 FROM vc_funnel_webinar_registrations
                 WHERE event_id = ? AND registration_status = 'registered'""",
            (event.event_id,),
        )
        queued = 0
        for row in await cursor.fetchall():
            result = await self.db.execute(
                """INSERT INTO vc_funnel_webinar_deliveries (
                       event_id, event_version, telegram_user_id, telegram_chat_id,
                       delivery_type, scheduled_at, status, created_at, updated_at
                   ) VALUES (?, ?, ?, ?, 'reschedule_notice', ?, 'pending', ?, ?)
                   ON CONFLICT(event_id, event_version, telegram_user_id, delivery_type) DO NOTHING""",
                (event.event_id, event.event_version, int(row["telegram_user_id"]),
                 int(row["telegram_chat_id"]), now, now, now),
            )
            queued += int(result.rowcount == 1)
        await self.db.commit()
        return queued

    async def _schedule_webinar_deliveries_unlocked(
        self,
        *,
        event_id: str,
        event_version: int,
        telegram_user_id: int,
        telegram_chat_id: int,
        start_at: datetime,
        now: datetime,
    ) -> None:
        for delivery_type, scheduled_at in (
            ("24h", start_at - timedelta(hours=24)),
            ("3h", start_at - timedelta(hours=3)),
            ("15m", start_at - timedelta(minutes=15)),
            ("start", start_at),
        ):
            if scheduled_at <= now:
                continue
            timestamp = self.now()
            await self.db.execute(
                """
                INSERT INTO vc_funnel_webinar_deliveries (
                    event_id, event_version, telegram_user_id, telegram_chat_id,
                    delivery_type, scheduled_at, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
                ON CONFLICT(event_id, event_version, telegram_user_id, delivery_type) DO NOTHING
                """,
                (event_id, event_version, telegram_user_id, telegram_chat_id, delivery_type,
                 scheduled_at.isoformat(), timestamp, timestamp),
            )

    async def list_due_webinar_deliveries(
        self,
        event: WebinarEventConfig,
        *,
        now: datetime | None = None,
    ) -> list[WebinarDelivery]:
        current = (now or datetime.now(self.timezone)).astimezone(self.timezone).isoformat()
        cursor = await self.db.execute(
            """
            SELECT id, event_id, event_version, telegram_user_id, telegram_chat_id,
                   delivery_type, scheduled_at, status, payload_json, sent_at,
                   error_type, created_at, updated_at
            FROM vc_funnel_webinar_deliveries
            WHERE event_id = ? AND event_version = ? AND status = 'pending'
              AND scheduled_at <= ?
            ORDER BY scheduled_at, id
            """,
            (event.event_id, event.event_version, current),
        )
        return [self._row_to_webinar_delivery(row) for row in await cursor.fetchall()]

    async def mark_webinar_delivery(
        self, delivery_id: int, *, status: str, error_type: str | None = None
    ) -> bool:
        if status not in {"sending", "sent", "failed", "cancelled"}:
            raise ValueError("Unsupported delivery status")
        fields = {"status": status, "updated_at": self.now(), "error_type": error_type}
        if status == "sent":
            fields["sent_at"] = self.now()
        allowed_from = "status = 'pending'" if status == "sending" else "status = 'sending'"
        cursor = await self.db.execute(
            f"UPDATE vc_funnel_webinar_deliveries SET status = ?, updated_at = ?, error_type = ?, sent_at = COALESCE(?, sent_at) WHERE id = ? AND {allowed_from}",
            (fields["status"], fields["updated_at"], fields["error_type"], fields.get("sent_at"), delivery_id),
        )
        await self.db.commit()
        return cursor.rowcount == 1

    async def create_support_ticket(
        self,
        *,
        user_id: int,
        telegram_chat_id: int,
        username: str | None,
        source: str,
        topic: str,
        message: str,
        event_version: int | None,
        route_key: str | None,
    ) -> SupportTicket:
        now = self.now()
        cursor = await self.db.execute(
            """
            INSERT INTO vc_funnel_support_tickets (
                user_id, telegram_chat_id, username, source, topic, message,
                status, created_at, updated_at, event_version, route_key
            ) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)
            """,
            (user_id, telegram_chat_id, username, source, topic, message.strip(), now, now, event_version, route_key),
        )
        await self.db.commit()
        ticket = await self.get_support_ticket(int(cursor.lastrowid))
        if ticket is None:
            raise RuntimeError("Support ticket was not saved")
        return ticket

    async def get_support_ticket(self, ticket_id: int) -> SupportTicket | None:
        cursor = await self.db.execute(
            """SELECT id, user_id, telegram_chat_id, username, source, topic, message,
                      status, assigned_admin_id, answer_text, answered_by_admin_id,
                      created_at, updated_at, answered_at, event_version, route_key
               FROM vc_funnel_support_tickets WHERE id = ?""",
            (ticket_id,),
        )
        row = await cursor.fetchone()
        return self._row_to_support_ticket(row) if row else None

    async def list_support_tickets(self, *, status: str | None = None, limit: int = 20) -> list[SupportTicket]:
        query = """SELECT id, user_id, telegram_chat_id, username, source, topic, message,
                         status, assigned_admin_id, answer_text, answered_by_admin_id,
                         created_at, updated_at, answered_at, event_version, route_key
                    FROM vc_funnel_support_tickets"""
        args: list[Any] = []
        if status:
            query += " WHERE status = ?"
            args.append(status)
        query += " ORDER BY id DESC LIMIT ?"
        args.append(limit)
        cursor = await self.db.execute(query, args)
        return [self._row_to_support_ticket(row) for row in await cursor.fetchall()]

    async def assign_support_ticket(self, ticket_id: int, admin_id: int) -> SupportTicket | None:
        now = self.now()
        await self.db.execute(
            """
            UPDATE vc_funnel_support_tickets
            SET status = 'assigned', assigned_admin_id = ?, updated_at = ?
            WHERE id = ? AND (status = 'new' OR (status = 'assigned' AND assigned_admin_id = ?))
            """,
            (admin_id, now, ticket_id, admin_id),
        )
        await self.db.commit()
        return await self.get_support_ticket(ticket_id)

    async def close_support_ticket(self, ticket_id: int) -> SupportTicket | None:
        await self.db.execute(
            "UPDATE vc_funnel_support_tickets SET status = 'closed', updated_at = ? WHERE id = ? AND status != 'closed'",
            (self.now(), ticket_id),
        )
        await self.db.commit()
        return await self.get_support_ticket(ticket_id)

    async def answer_support_ticket(self, ticket_id: int, admin_id: int, answer: str) -> SupportTicket | None:
        now = self.now()
        await self.db.execute(
            """
            UPDATE vc_funnel_support_tickets
            SET status = 'answered', assigned_admin_id = COALESCE(assigned_admin_id, ?),
                answer_text = ?, answered_by_admin_id = ?, answered_at = ?, updated_at = ?
            WHERE id = ? AND status IN ('new', 'assigned')
            """,
            (admin_id, answer.strip(), admin_id, now, now, ticket_id),
        )
        await self.db.commit()
        return await self.get_support_ticket(ticket_id)

    async def set_support_draft(self, user_id: int, topic: str, event_version: int | None, route_key: str | None) -> None:
        now = self.now()
        await self.db.execute(
            """INSERT INTO vc_funnel_support_drafts (user_id, topic, event_version, route_key, updated_at)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET topic = excluded.topic,
                     event_version = excluded.event_version, route_key = excluded.route_key, updated_at = excluded.updated_at""",
            (user_id, topic, event_version, route_key, now),
        )
        await self.db.commit()

    async def pop_support_draft(self, user_id: int) -> tuple[str, int | None, str | None] | None:
        cursor = await self.db.execute("SELECT topic, event_version, route_key FROM vc_funnel_support_drafts WHERE user_id = ?", (user_id,))
        row = await cursor.fetchone()
        if row is None:
            return None
        await self.db.execute("DELETE FROM vc_funnel_support_drafts WHERE user_id = ?", (user_id,))
        await self.db.commit()
        return str(row["topic"]), row["event_version"], row["route_key"]

    async def set_admin_reply_state(self, admin_id: int, ticket_id: int, chat_id: int) -> None:
        now = self.now()
        await self.db.execute(
            """INSERT INTO vc_funnel_support_admin_states (admin_id, ticket_id, chat_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(admin_id) DO UPDATE SET ticket_id = excluded.ticket_id,
                    chat_id = excluded.chat_id, updated_at = excluded.updated_at""",
            (admin_id, ticket_id, chat_id, now, now),
        )
        await self.db.commit()

    async def pop_admin_reply_state(self, admin_id: int, chat_id: int) -> int | None:
        cursor = await self.db.execute("SELECT ticket_id FROM vc_funnel_support_admin_states WHERE admin_id = ? AND chat_id = ?", (admin_id, chat_id))
        row = await cursor.fetchone()
        if row is None:
            return None
        await self.db.execute("DELETE FROM vc_funnel_support_admin_states WHERE admin_id = ?", (admin_id,))
        await self.db.commit()
        return int(row["ticket_id"])

    async def reset_lead_for_test(self, telegram_id: int) -> bool:
        async with self._lead_lock(telegram_id):
            existing = await self.get_lead(telegram_id)
            if existing is None:
                return False

            await self.db.execute(
                "DELETE FROM vc_funnel_leads WHERE telegram_id = ?",
                (telegram_id,),
            )
            await self.db.commit()
            await self.add_event(
                telegram_id,
                "lead_reset_for_test",
                {
                    "previous_status": existing.lead_status,
                    "previous_temperature": existing.lead_temperature,
                },
            )
            return True

    async def admin_reset_lead(self, telegram_id: int, admin_id: int) -> bool:
        reset_done = await self.reset_lead_for_test(telegram_id)
        await self.add_event(telegram_id, "admin_reset_lead", {"admin_id": admin_id})
        return reset_done

    async def upsert_lead(
        self,
        *,
        telegram_id: int,
        username: str | None,
        first_name: str | None,
        source: SourceInfo,
    ) -> Lead:
        async with self._lead_lock(telegram_id):
            return await self._upsert_lead_unlocked(
                telegram_id=telegram_id,
                username=username,
                first_name=first_name,
                source=source,
            )

    async def _upsert_lead_unlocked(
        self,
        *,
        telegram_id: int,
        username: str | None,
        first_name: str | None,
        source: SourceInfo,
    ) -> Lead:
        existing = await self.get_lead(telegram_id)
        now = self.now()

        if existing is None:
            await self.db.execute(
                """
                INSERT INTO vc_funnel_leads (
                    telegram_id, username, first_name, raw_start_payload, latest_start_payload,
                    source_type, source_channel, source, entry_surface, entry_mode,
                    campaign, content_id, cta_type, cjm, post_id, post_slug, post_topic,
                    lead_status, lead_temperature, created_at, updated_at, last_interaction_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'started', 'cold', ?, ?, ?)
                """,
                (
                    telegram_id,
                    username,
                    first_name,
                    source.raw_start_payload,
                    source.raw_start_payload,
                    source.source_type,
                    source.source_channel,
                    source.source,
                    source.entry_surface,
                    source.entry_mode,
                    source.campaign,
                    source.content_id,
                    source.cta_type,
                    source.cjm,
                    source.post_id,
                    source.post_slug,
                    source.post_topic,
                    now,
                    now,
                    now,
                ),
            )
            await self.db.commit()
            await self.add_event(telegram_id, "lead_started", {"source": source.__dict__})
            lead = await self.get_lead(telegram_id)
            if lead is None:
                raise RuntimeError("Failed to create VC lead")
            return lead

        updates: dict[str, Any] = {
            "username": username,
            "first_name": first_name,
            "updated_at": now,
            "last_interaction_at": now,
        }
        event_name = "lead_restarted"

        if source.raw_start_payload:
            updates["latest_start_payload"] = source.raw_start_payload

        source_is_locked = (
            existing.call_requested
            or existing.sales_notified
            or existing.support_notified
            or existing.lead_status
            in {"application_submitted", "support_requested"}
        )
        can_update_source = (
            not source_is_locked
            and (
                bool(source.raw_start_payload)
                or existing.cjm in {"direct", "unknown"}
                or existing.source_channel in {"direct", "unknown"}
            )
        )

        if can_update_source:
            updates.update(
                {
                    "raw_start_payload": source.raw_start_payload,
                    "source_type": source.source_type,
                    "source_channel": source.source_channel,
                    "source": source.source,
                    "entry_surface": source.entry_surface,
                    "entry_mode": source.entry_mode,
                    "campaign": source.campaign,
                    "content_id": source.content_id,
                    "cta_type": source.cta_type,
                    "cjm": source.cjm,
                    "post_id": source.post_id,
                    "post_slug": source.post_slug,
                    "post_topic": source.post_topic,
                }
            )
        elif source_is_locked:
            event_name = "repeat_start_after_call_requested"

        await self._update_lead_fields(telegram_id, updates, commit=False)
        await self.db.commit()
        await self.add_event(telegram_id, event_name, {"source": source.__dict__})
        lead = await self.get_lead(telegram_id)
        if lead is None:
            raise RuntimeError("Failed to update VC lead")
        return lead

    async def set_status(
        self,
        telegram_id: int,
        status: str,
        event_type: str,
        payload: dict[str, Any] | None = None,
        *,
        temperature: str | None = None,
    ) -> Lead:
        fields: dict[str, Any] = {
            "lead_status": status,
            "updated_at": self.now(),
            "last_interaction_at": self.now(),
        }
        if temperature is not None:
            fields["lead_temperature"] = temperature
        await self._update_lead_fields(telegram_id, fields)
        await self.add_event(telegram_id, event_type, payload)
        lead = await self.get_lead(telegram_id)
        if lead is None:
            raise RuntimeError("Lead not found after status update")
        return lead

    async def mark_materials_requested(self, telegram_id: int) -> Lead:
        return await self.set_status(telegram_id, "materials_requested", "materials_requested")

    async def mark_materials_sent(self, telegram_id: int) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {
                "materials_sent": 1,
                "lead_status": "materials_sent",
                "lead_temperature": "warm",
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        await self.add_event(telegram_id, "materials_sent")
        return await self._required_lead(telegram_id)

    async def mark_qual_started(self, telegram_id: int) -> Lead:
        return await self.set_status(telegram_id, "qual_started", "diagnostic_started", temperature="warm")

    async def save_answer(self, telegram_id: int, field: str, value: str) -> Lead:
        if field not in {"segment", "pain", "intent", "urgency"}:
            raise ValueError(f"Unsupported answer field: {field}")
        await self._update_lead_fields(
            telegram_id,
            {field: value, "updated_at": self.now(), "last_interaction_at": self.now()},
        )
        event_type = {
            "segment": "segment_selected",
            "pain": "pain_selected",
            "intent": "intent_selected",
            "urgency": "urgency_selected",
        }[field]
        await self.add_event(telegram_id, event_type, {"answer": value})
        return await self._refresh_temperature(telegram_id)

    async def save_route_field(
        self,
        telegram_id: int,
        field: str,
        value: str,
    ) -> Lead:
        if field not in {"segment", "pain", "intent", "urgency"}:
            raise ValueError(f"Unsupported route field: {field}")
        await self._update_lead_fields(
            telegram_id,
            {
                field: value,
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        return await self._required_lead(telegram_id)

    async def set_route_state(
        self,
        telegram_id: int,
        status: str,
        *,
        intent: str | None = None,
    ) -> Lead:
        fields: dict[str, Any] = {
            "lead_status": status,
            "updated_at": self.now(),
            "last_interaction_at": self.now(),
        }
        if intent is not None:
            fields["intent"] = intent
        await self._update_lead_fields(telegram_id, fields)
        return await self._required_lead(telegram_id)

    async def start_main_route(self, telegram_id: int) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {
                "segment": None,
                "pain": None,
                "intent": None,
                "urgency": None,
                "application_context": None,
                "lead_status": "qual_started",
                "lead_temperature": "warm",
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        return await self._required_lead(telegram_id)

    async def mark_bundle_delivered(
        self,
        telegram_id: int,
        *,
        track: str,
        requested_keys: list[str],
        delivered_keys: list[str],
        statuses: dict[str, str],
    ) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {
                "materials_sent": 1 if delivered_keys else 0,
                "lead_status": "route_completed",
                "lead_temperature": "warm",
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        await self.add_event(
            telegram_id,
            "bundle_delivered",
            {
                "track": track,
                "requested_keys": requested_keys,
                "delivered_keys": delivered_keys,
                "statuses": statuses,
            },
        )
        return await self._required_lead(telegram_id)

    async def mark_qual_completed(self, telegram_id: int) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {"lead_status": "qual_completed", "updated_at": self.now(), "last_interaction_at": self.now()},
        )
        await self.add_event(telegram_id, "diagnostic_completed")
        return await self._refresh_temperature(telegram_id)

    async def mark_private_channel_sent(self, telegram_id: int) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {
                "private_channel_sent": 1,
                "lead_status": "private_channel_sent",
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        await self.add_event(telegram_id, "private_channel_sent")
        return await self._refresh_temperature(telegram_id)

    async def mark_private_channel_missing(self, telegram_id: int) -> Lead:
        await self.add_event(telegram_id, "private_channel_missing")
        return await self._required_lead(telegram_id)

    async def mark_call_cta_shown(self, telegram_id: int) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {"lead_status": "call_cta_shown", "updated_at": self.now(), "last_interaction_at": self.now()},
        )
        await self.add_event(telegram_id, "call_cta_shown")
        return await self._refresh_temperature(telegram_id)

    async def mark_call_requested(self, telegram_id: int) -> Lead:
        lead = await self._required_lead(telegram_id)
        temperature = calculate_temperature(lead, call_requested=True)
        await self._update_lead_fields(
            telegram_id,
            {
                "call_requested": 1,
                "lead_status": "call_requested",
                "lead_temperature": temperature,
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        await self.add_event(telegram_id, "call_requested")
        return await self._required_lead(telegram_id)

    async def mark_contact_requested(self, telegram_id: int) -> Lead:
        return await self.set_status(telegram_id, "contact_requested", "contact_requested")

    async def save_contact(self, telegram_id: int, contact: str) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {"contact": contact.strip(), "updated_at": self.now(), "last_interaction_at": self.now()},
        )
        await self.add_event(telegram_id, "contact_saved")
        return await self._required_lead(telegram_id)

    async def save_application_context(self, telegram_id: int, context: str) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {"application_context": context.strip(), "updated_at": self.now(), "last_interaction_at": self.now()},
        )
        await self.add_event(telegram_id, "application_context_saved")
        return await self._required_lead(telegram_id)

    async def mark_not_ready(self, telegram_id: int) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {"lead_status": "not_ready", "updated_at": self.now(), "last_interaction_at": self.now()},
        )
        await self.add_event(telegram_id, "call_declined")
        return await self._refresh_temperature(telegram_id)

    async def mark_sales_notified(self, telegram_id: int) -> Lead:
        lead = await self._required_lead(telegram_id)
        status = (
            lead.lead_status
            if lead.intent == "sales_consultation"
            else "sales_notified"
        )
        await self._update_lead_fields(
            telegram_id,
            {
                "sales_notified": 1,
                "sales_notified_at": self.now(),
                "lead_status": status,
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        await self.add_event(telegram_id, "sales_notified")
        return await self._required_lead(telegram_id)

    async def mark_application_submitted(self, telegram_id: int) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {
                "intent": "sales_consultation",
                "lead_status": "application_submitted",
                "call_requested": 1,
                "lead_temperature": "sql",
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        await self.add_event(telegram_id, "application_submitted")
        return await self._required_lead(telegram_id)

    async def mark_support_requested(self, telegram_id: int) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {
                "intent": "setup_help",
                "lead_status": "support_requested",
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        await self.add_event(telegram_id, "support_requested")
        return await self._required_lead(telegram_id)

    async def mark_support_notified(self, telegram_id: int) -> Lead:
        await self._update_lead_fields(
            telegram_id,
            {
                "support_notified": 1,
                "support_notified_at": self.now(),
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        await self.add_event(telegram_id, "support_notified")
        return await self._required_lead(telegram_id)

    async def delivery_details(
        self,
        telegram_id: int,
    ) -> tuple[list[str], bool]:
        events = await self.list_events(telegram_id)
        delivered: list[str] = []
        playbook_opened = False
        for event in events:
            if event.event_type == "bundle_delivered":
                for key in event.event_payload.get("delivered_keys", []):
                    material_key = str(key)
                    if material_key not in delivered:
                        delivered.append(material_key)
            elif (
                event.event_type == "full_playbook_requested"
                and event.event_payload.get("delivery_status")
                == "delivered"
            ):
                playbook_opened = True
        return delivered, playbook_opened

    async def remember_bot_screen(self, telegram_id: int, message_id: int) -> Lead:
        lead = await self._required_lead(telegram_id)
        message_ids = [mid for mid in lead.bot_screen_message_ids if mid != message_id]
        message_ids.append(message_id)
        await self._update_lead_fields(
            telegram_id,
            {
                "last_bot_screen_message_id": message_id,
                "bot_screen_message_ids": json.dumps(message_ids[-20:]),
                "updated_at": self.now(),
            },
        )
        return await self._required_lead(telegram_id)

    async def forget_bot_screens(self, telegram_id: int, message_ids: list[int]) -> Lead:
        if not message_ids:
            return await self._required_lead(telegram_id)
        lead = await self._required_lead(telegram_id)
        remaining = [mid for mid in lead.bot_screen_message_ids if mid not in set(message_ids)]
        await self._update_lead_fields(
            telegram_id,
            {
                "bot_screen_message_ids": json.dumps(remaining),
                "last_bot_screen_message_id": remaining[-1] if remaining else None,
                "updated_at": self.now(),
            },
        )
        return await self._required_lead(telegram_id)

    async def get_material(self, material_key: str) -> Material | None:
        cursor = await self.db.execute(
            """
            SELECT material_key, title, body, url, telegram_file_id, telegram_file_type,
                   telegram_file_name, telegram_caption, is_active, telegram_file_status,
                   telegram_file_verified_at, telegram_file_error, created_at, updated_at
            FROM vc_funnel_materials
            WHERE material_key = ? AND is_active = 1
            """,
            (material_key,),
        )
        row = await cursor.fetchone()
        return self._row_to_material(row) if row else None

    async def get_material_any(self, material_key: str) -> Material | None:
        cursor = await self.db.execute(
            """
            SELECT material_key, title, body, url, telegram_file_id,
                   telegram_file_type, telegram_file_name, telegram_caption, is_active,
                   telegram_file_status, telegram_file_verified_at, telegram_file_error,
                   created_at, updated_at
            FROM vc_funnel_materials
            WHERE material_key = ?
            """,
            (material_key,),
        )
        row = await cursor.fetchone()
        return self._row_to_material(row) if row else None

    async def list_materials(self) -> list[Material]:
        cursor = await self.db.execute(
            """
            SELECT material_key, title, body, url, telegram_file_id, telegram_file_type,
                   telegram_file_name, telegram_caption, is_active, telegram_file_status,
                   telegram_file_verified_at, telegram_file_error, created_at, updated_at
            FROM vc_funnel_materials
            ORDER BY material_key
            """
        )
        return [self._row_to_material(row) for row in await cursor.fetchall()]

    async def upsert_material(
        self,
        *,
        material_key: str,
        title: str,
        body: str | None = None,
        url: str | None = None,
        telegram_file_id: str | None = None,
        telegram_file_type: str | None = None,
        telegram_file_name: str | None = None,
        telegram_caption: str | None = None,
    ) -> Material:
        now = self.now()
        await self.db.execute(
            """
            INSERT INTO vc_funnel_materials (
                material_key, title, body, url, telegram_file_id, telegram_file_type,
                telegram_file_name, telegram_caption, is_active, telegram_file_status,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
            ON CONFLICT(material_key) DO UPDATE SET
                title = excluded.title,
                body = excluded.body,
                url = excluded.url,
                telegram_file_id = excluded.telegram_file_id,
                telegram_file_type = excluded.telegram_file_type,
                telegram_file_name = excluded.telegram_file_name,
                telegram_caption = excluded.telegram_caption,
                telegram_file_status = excluded.telegram_file_status,
                telegram_file_verified_at = NULL,
                telegram_file_error = NULL,
                is_active = 1,
                updated_at = excluded.updated_at
            """,
            (
                material_key,
                title,
                body,
                url,
                telegram_file_id,
                telegram_file_type,
                telegram_file_name,
                telegram_caption,
                "unverified" if telegram_file_id else "missing",
                now,
                now,
            ),
        )
        await self.db.commit()
        material = await self.get_material(material_key)
        if material is None:
            raise RuntimeError("Material was not saved")
        return material

    async def delete_material(self, material_key: str) -> None:
        await self.db.execute(
            "UPDATE vc_funnel_materials SET is_active = 0, updated_at = ? WHERE material_key = ?",
            (self.now(), material_key),
        )
        await self.db.commit()

    async def update_material_file_validation(
        self,
        material_key: str,
        *,
        status: str,
        error: str | None = None,
    ) -> None:
        if status not in {"ready", "missing", "invalid", "unverified"}:
            raise ValueError("Unsupported material file status")
        await self.db.execute(
            """UPDATE vc_funnel_materials
               SET telegram_file_status = ?, telegram_file_verified_at = ?,
                   telegram_file_error = ?, updated_at = ?
               WHERE material_key = ?""",
            (status, self.now() if status in {"ready", "invalid"} else None, error, self.now(), material_key),
        )
        await self.db.commit()

    async def bind_material(self, payload: str, material_key: str, title_override: str | None = None) -> None:
        now = self.now()
        await self.db.execute(
            """
            INSERT INTO vc_funnel_payload_materials (payload, material_key, title_override, is_active, created_at, updated_at)
            VALUES (?, ?, ?, 1, ?, ?)
            ON CONFLICT(payload) DO UPDATE SET
                material_key = excluded.material_key,
                title_override = excluded.title_override,
                is_active = 1,
                updated_at = excluded.updated_at
            """,
            (payload, material_key, title_override, now, now),
        )
        await self.db.commit()

    async def unbind_material(self, payload: str) -> None:
        await self.db.execute(
            "UPDATE vc_funnel_payload_materials SET is_active = 0, updated_at = ? WHERE payload = ?",
            (self.now(), payload),
        )
        await self.db.commit()

    async def get_material_binding(self, payload: str) -> tuple[str, str | None] | None:
        cursor = await self.db.execute(
            """
            SELECT material_key, title_override
            FROM vc_funnel_payload_materials
            WHERE payload = ? AND is_active = 1
            """,
            (payload,),
        )
        row = await cursor.fetchone()
        return (row["material_key"], row["title_override"]) if row else None

    async def list_material_bindings(self) -> dict[str, str]:
        cursor = await self.db.execute(
            "SELECT payload, material_key FROM vc_funnel_payload_materials WHERE is_active = 1"
        )
        return {row["payload"]: row["material_key"] for row in await cursor.fetchall()}

    async def _refresh_temperature(self, telegram_id: int) -> Lead:
        lead = await self._required_lead(telegram_id)
        await self._update_lead_fields(
            telegram_id,
            {"lead_temperature": calculate_temperature(lead), "updated_at": self.now()},
        )
        return await self._required_lead(telegram_id)

    async def _required_lead(self, telegram_id: int) -> Lead:
        lead = await self.get_lead(telegram_id)
        if lead is None:
            raise RuntimeError(f"VC lead {telegram_id} not found")
        return lead

    async def _update_lead_fields(self, telegram_id: int, fields: dict[str, Any], *, commit: bool = True) -> None:
        if not fields:
            return
        assignments = ", ".join(f"{key} = ?" for key in fields)
        values = [self._sqlite_value(value) for value in fields.values()]
        values.append(telegram_id)
        await self.db.execute(
            f"UPDATE vc_funnel_leads SET {assignments} WHERE telegram_id = ?",
            values,
        )
        if commit:
            await self.db.commit()

    @staticmethod
    def _sqlite_value(value: Any) -> Any:
        if isinstance(value, bool):
            return 1 if value else 0
        return value

    @staticmethod
    def _row_to_lead(row: aiosqlite.Row) -> Lead:
        return Lead(
            id=int(row["id"]),
            telegram_id=int(row["telegram_id"]),
            username=row["username"],
            first_name=row["first_name"],
            contact=row["contact"],
            raw_start_payload=row["raw_start_payload"],
            latest_start_payload=row["latest_start_payload"],
            source_type=row["source_type"],
            source_channel=row["source_channel"],
            source=row["source"],
            entry_surface=row["entry_surface"],
            entry_mode=row["entry_mode"],
            campaign=row["campaign"],
            content_id=row["content_id"],
            cta_type=row["cta_type"],
            cjm=row["cjm"],
            post_id=row["post_id"],
            post_slug=row["post_slug"],
            post_topic=row["post_topic"],
            segment=row["segment"],
            pain=row["pain"],
            intent=row["intent"],
            urgency=row["urgency"],
            application_context=row["application_context"],
            lead_status=row["lead_status"],
            lead_temperature=row["lead_temperature"],
            materials_sent=bool(row["materials_sent"]),
            private_channel_sent=bool(row["private_channel_sent"]),
            call_requested=bool(row["call_requested"]),
            sales_notified=bool(row["sales_notified"]),
            sales_notified_at=row["sales_notified_at"],
            support_notified=bool(row["support_notified"]),
            support_notified_at=row["support_notified_at"],
            last_bot_screen_message_id=row["last_bot_screen_message_id"],
            bot_screen_message_ids=json.loads(row["bot_screen_message_ids"] or "[]"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            last_interaction_at=row["last_interaction_at"],
        )

    @staticmethod
    def _row_to_material(row: aiosqlite.Row) -> Material:
        return Material(
            material_key=row["material_key"],
            title=row["title"],
            body=row["body"],
            url=row["url"],
            telegram_file_id=row["telegram_file_id"],
            telegram_file_type=row["telegram_file_type"],
            telegram_file_name=row["telegram_file_name"],
            telegram_caption=row["telegram_caption"],
            is_active=bool(row["is_active"]),
            telegram_file_status=row["telegram_file_status"],
            telegram_file_verified_at=row["telegram_file_verified_at"],
            telegram_file_error=row["telegram_file_error"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _row_to_webinar_registration(
        row: aiosqlite.Row,
    ) -> WebinarRegistration:
        return WebinarRegistration(
            id=int(row["id"]),
            event_id=row["event_id"],
            telegram_user_id=int(row["telegram_user_id"]),
            telegram_chat_id=int(row["telegram_chat_id"]),
            username=row["username"],
            first_name=row["first_name"],
            source=row["source"],
            start_payload=row["start_payload"],
            campaign=row["campaign"],
            post=row["post"],
            selected_route=row["selected_route"],
            bottleneck=row["bottleneck"],
            registered_at=row["registered_at"],
            registration_status=row["registration_status"],
            reminder_24h_sent_at=row["reminder_24h_sent_at"],
            reminder_3h_sent_at=row["reminder_3h_sent_at"],
            reminder_15m_sent_at=row["reminder_15m_sent_at"],
            join_clicked_at=row["join_clicked_at"],
            replay_clicked_at=row["replay_clicked_at"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _row_to_webinar_event(row: aiosqlite.Row) -> WebinarEventConfig:
        return WebinarEventConfig(
            event_id=row["event_id"],
            title=row["title"],
            start_at=row["start_at"],
            timezone=row["timezone"],
            join_url=row["join_url"],
            replay_url=row["replay_url"],
            phase=row["phase"],
            event_version=int(row["event_version"]),
            support_manager_chat_id=row["support_manager_chat_id"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _row_to_webinar_delivery(row: aiosqlite.Row) -> WebinarDelivery:
        return WebinarDelivery(
            id=int(row["id"]),
            event_id=row["event_id"],
            event_version=int(row["event_version"]),
            telegram_user_id=int(row["telegram_user_id"]),
            telegram_chat_id=int(row["telegram_chat_id"]),
            delivery_type=row["delivery_type"],
            scheduled_at=row["scheduled_at"],
            status=row["status"],
            payload_json=row["payload_json"],
            sent_at=row["sent_at"],
            error_type=row["error_type"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _row_to_support_ticket(row: aiosqlite.Row) -> SupportTicket:
        return SupportTicket(
            id=int(row["id"]),
            user_id=int(row["user_id"]),
            telegram_chat_id=int(row["telegram_chat_id"]),
            username=row["username"],
            source=row["source"],
            topic=row["topic"],
            message=row["message"],
            status=row["status"],
            assigned_admin_id=row["assigned_admin_id"],
            answer_text=row["answer_text"],
            answered_by_admin_id=row["answered_by_admin_id"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            answered_at=row["answered_at"],
            event_version=row["event_version"],
            route_key=row["route_key"],
        )
