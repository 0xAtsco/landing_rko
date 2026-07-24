from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from zoneinfo import ZoneInfo

from bot.config import Settings
from bot.handlers import admin_links_text, admin_preview_text, is_admin
from bot.materials import resolve_material
from bot.source_parser import parse_start_payload
from bot.storage import VcStorage


def make_settings(*, youtube_url: str | None = None, admin_ids: set[int] | None = None) -> Settings:
    timezone = ZoneInfo("Europe/Moscow")
    return Settings(
        bot_token="test-token",
        sqlite_path="./data/vc_funnel.db",
        database_url=None,
        sales_chat_id=None,
        private_channel_invite_url="https://t.me/+invite",
        materials_title="Материалы",
        materials_url=None,
        youtube_materials_url=youtube_url,
        telegram_materials_url=None,
        timezone_name="Europe/Moscow",
        timezone=timezone,
        enable_text_triggers=True,
        enable_followups=False,
        debug=False,
        admin_ids=admin_ids or set(),
        bot_username="vc_test_bot",
        ux_typing_delay_test_mode=True,
    )


class MaterialsAdminTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.storage = VcStorage(Path(self.tmp.name) / "vc_funnel.db", ZoneInfo("Europe/Moscow"))
        await self.storage.connect()

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    async def test_material_resolution_from_sqlite(self) -> None:
        await self.storage.upsert_material(material_key="andrey_video_0704", title="SQLite title", body="SQLite body", url="https://example.com/sqlite")
        material = await resolve_material(self.storage, make_settings(), payload="yt_video_0704_description")
        self.assertEqual(material.title, "SQLite title")
        self.assertEqual(material.url, "https://example.com/sqlite")
        self.assertEqual(material.source, "sqlite")

    async def test_material_bind_override_wins(self) -> None:
        await self.storage.upsert_material(material_key="override_key", title="Override", body="B")
        await self.storage.bind_material("yt_video_0704_description", "override_key")
        material = await resolve_material(self.storage, make_settings(), payload="yt_video_0704_description")
        self.assertEqual(material.material_key, "override_key")
        self.assertEqual(material.title, "Override")

    async def test_material_resolution_from_env_fallback(self) -> None:
        material = await resolve_material(self.storage, make_settings(youtube_url="https://example.com/env"), payload="yt_video_0704_description")
        self.assertEqual(material.url, "https://example.com/env")
        self.assertEqual(material.status, "env fallback")

    async def test_missing_material_preview_does_not_create_lead(self) -> None:
        text = await admin_preview_text(self.storage, make_settings(), "unknown_payload")
        self.assertIn("Preview payload", text)
        self.assertIn("fallback universal start", text) if "fallback universal start" in text else self.assertIn("Entry mode", text)
        self.assertIsNone(await self.storage.get_lead(123))

    async def test_links_show_material_keys_for_all_andrey_payloads(self) -> None:
        text = await admin_links_text(self.storage, make_settings())
        for payload in (
            "am_p01_video",
            "am_p02_map",
            "am_p03_demo",
            "am_p04_route",
            "am_p05_apply",
        ):
            with self.subTest(payload=payload):
                self.assertIn(payload, text)
                self.assertIn(f"material: {payload}", text)

    def test_admin_helper(self) -> None:
        settings = make_settings(admin_ids={123})
        self.assertTrue(is_admin(123, settings))
        self.assertFalse(is_admin(456, settings))


if __name__ == "__main__":
    unittest.main()
