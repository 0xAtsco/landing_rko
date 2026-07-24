from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import aiosqlite

from .analytics import calculate_temperature
from .models import Event, Lead, Material, SourceInfo


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
    "application_context",
    "lead_status",
    "lead_temperature",
    "materials_sent",
    "private_channel_sent",
    "call_requested",
    "sales_notified",
    "sales_notified_at",
    "last_bot_screen_message_id",
    "bot_screen_message_ids",
    "created_at",
    "updated_at",
    "last_interaction_at",
]


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
                application_context TEXT,
                lead_status TEXT NOT NULL,
                lead_temperature TEXT NOT NULL,
                materials_sent INTEGER NOT NULL DEFAULT 0,
                private_channel_sent INTEGER NOT NULL DEFAULT 0,
                call_requested INTEGER NOT NULL DEFAULT 0,
                sales_notified INTEGER NOT NULL DEFAULT 0,
                sales_notified_at TEXT,
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
                "application_context": "TEXT",
                "last_bot_screen_message_id": "INTEGER",
                "bot_screen_message_ids": "TEXT NOT NULL DEFAULT '[]'",
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
        for name, query in {
            "total_leads": "SELECT COUNT(*) AS total FROM vc_funnel_leads",
            "today_leads": "SELECT COUNT(*) AS total FROM vc_funnel_leads WHERE date(created_at) = date('now', 'localtime')",
            "call_requested": "SELECT COUNT(*) AS total FROM vc_funnel_leads WHERE call_requested = 1",
            "sales_notified": "SELECT COUNT(*) AS total FROM vc_funnel_leads WHERE sales_notified = 1",
        }.items():
            row = await (await self.db.execute(query)).fetchone()
            result[name] = int(row["total"]) if row else 0

        for key, column in {"by_status": "lead_status", "by_payload": "COALESCE(latest_start_payload, raw_start_payload, 'none')"}.items():
            cursor = await self.db.execute(
                f"SELECT {column} AS label, COUNT(*) AS total FROM vc_funnel_leads GROUP BY label ORDER BY total DESC LIMIT 20"
            )
            result[key] = [(row["label"], int(row["total"])) for row in await cursor.fetchall()]

        hermes_events = (
            "hermes_route_started",
            "hermes_bottleneck_selected",
            "hermes_context_selected",
            "hermes_bundle_started",
            "hermes_material_delivered",
            "hermes_route_completed",
            "hermes_channel_clicked",
            "hermes_apply_clicked",
            "application_context_submitted",
            "sales_notified",
        )
        placeholders = ", ".join("?" for _ in hermes_events)
        cursor = await self.db.execute(
            f"""
            SELECT events.event_type AS label,
                   COUNT(DISTINCT events.telegram_id) AS total
            FROM vc_funnel_events AS events
            JOIN vc_funnel_leads AS leads
              ON leads.telegram_id = events.telegram_id
            WHERE leads.cjm = 'hermes_bottleneck'
              AND events.event_type IN ({placeholders})
            GROUP BY events.event_type
            """,
            hermes_events,
        )
        counts = {
            row["label"]: int(row["total"])
            for row in await cursor.fetchall()
        }
        result["hermes_funnel"] = [
            (event_type, counts.get(event_type, 0))
            for event_type in hermes_events
        ]
        return result

    async def export_leads_rows(self) -> list[dict[str, Any]]:
        cursor = await self.db.execute(f"SELECT {', '.join(LEAD_COLUMNS)} FROM vc_funnel_leads ORDER BY updated_at DESC")
        return [dict(row) for row in await cursor.fetchall()]

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

        source_is_locked = existing.call_requested or existing.sales_notified
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
        if field not in {"segment", "pain", "intent"}:
            raise ValueError(f"Unsupported answer field: {field}")
        await self._update_lead_fields(
            telegram_id,
            {field: value, "updated_at": self.now(), "last_interaction_at": self.now()},
        )
        event_type = {
            "segment": "segment_selected",
            "pain": "pain_selected",
            "intent": "intent_selected",
        }[field]
        await self.add_event(telegram_id, event_type, {"answer": value})
        return await self._refresh_temperature(telegram_id)

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
        await self._update_lead_fields(
            telegram_id,
            {
                "sales_notified": 1,
                "sales_notified_at": self.now(),
                "lead_status": "sales_notified",
                "updated_at": self.now(),
                "last_interaction_at": self.now(),
            },
        )
        await self.add_event(telegram_id, "sales_notification_sent")
        await self.add_event(telegram_id, "sales_notified")
        return await self._required_lead(telegram_id)

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
                   telegram_file_name, telegram_caption, is_active, created_at, updated_at
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
                   telegram_file_type, telegram_file_name, telegram_caption,
                   is_active, created_at, updated_at
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
                   telegram_file_name, telegram_caption, is_active, created_at, updated_at
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
                telegram_file_name, telegram_caption, is_active, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            ON CONFLICT(material_key) DO UPDATE SET
                title = excluded.title,
                body = excluded.body,
                url = excluded.url,
                telegram_file_id = excluded.telegram_file_id,
                telegram_file_type = excluded.telegram_file_type,
                telegram_file_name = excluded.telegram_file_name,
                telegram_caption = excluded.telegram_caption,
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
            application_context=row["application_context"],
            lead_status=row["lead_status"],
            lead_temperature=row["lead_temperature"],
            materials_sent=bool(row["materials_sent"]),
            private_channel_sent=bool(row["private_channel_sent"]),
            call_requested=bool(row["call_requested"]),
            sales_notified=bool(row["sales_notified"]),
            sales_notified_at=row["sales_notified_at"],
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
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
