from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from bot.material_importer import (
    DEFAULT_MANIFEST,
    import_manifest,
    load_manifest,
    validate_manifest,
)
from bot.storage import VcStorage


class FakeUploadBot:
    def __init__(self) -> None:
        self.documents: list[dict[str, object]] = []
        self.videos: list[dict[str, object]] = []
        self.file_number = 0

    async def send_document(self, **kwargs):
        self.documents.append(kwargs)
        self.file_number += 1
        return SimpleNamespace(
            document=SimpleNamespace(
                file_id=f"document-file-{self.file_number}",
                file_name="guide.pdf",
            )
        )

    async def send_video(self, **kwargs):
        self.videos.append(kwargs)
        self.file_number += 1
        return SimpleNamespace(
            video=SimpleNamespace(
                file_id=f"video-file-{self.file_number}",
                file_name="setup.mp4",
            )
        )


class MaterialImporterTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.storage = VcStorage(
            self.root / "vc_funnel.db",
            ZoneInfo("Europe/Moscow"),
        )
        await self.storage.connect()

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    def test_pack_manifest_has_nine_ready_and_three_placeholders(self) -> None:
        items = load_manifest(DEFAULT_MANIFEST)
        validation = validate_manifest(items)
        self.assertEqual(len(items), 12)
        self.assertEqual(
            sum(item.status == "ready" for item in validation),
            9,
        )
        self.assertEqual(
            sum(item.status == "placeholder" for item in validation),
            3,
        )
        self.assertIn(
            "Hermes_First_Audit_Playbook.pdf",
            [item.file_name for item in items],
        )

    async def test_dry_run_validates_without_uploading(self) -> None:
        items = load_manifest(DEFAULT_MANIFEST)
        results = await import_manifest(
            storage=self.storage,
            items=items,
            dry_run=True,
        )
        self.assertEqual(
            sum(item.status == "would_upload" for item in results),
            9,
        )
        self.assertEqual(
            sum(item.status == "placeholder" for item in results),
            3,
        )
        self.assertEqual(await self.storage.list_materials(), [])

    async def test_apply_is_idempotent_and_force_reuploads(self) -> None:
        pack_dir = self.root / "pack"
        pack_dir.mkdir()
        (pack_dir / "guide.pdf").write_bytes(b"%PDF-test")
        manifest = pack_dir / "manifest.csv"
        manifest.write_text(
            "material_key,file_name,type,purpose\n"
            "hermes_find_business_guide,guide.pdf,document,Guide\n",
            encoding="utf-8",
        )
        items = load_manifest(manifest, pack_dir)
        bot = FakeUploadBot()

        first = await import_manifest(
            storage=self.storage,
            items=items,
            dry_run=False,
            bot=bot,
            upload_chat_id=7001,
        )
        self.assertEqual(first[0].status, "uploaded")
        self.assertEqual(len(bot.documents), 1)
        material = await self.storage.get_material(
            "hermes_find_business_guide"
        )
        self.assertEqual(
            material.telegram_file_id, "document-file-1"
        )

        second = await import_manifest(
            storage=self.storage,
            items=items,
            dry_run=False,
            bot=bot,
            upload_chat_id=7001,
        )
        self.assertEqual(second[0].status, "skipped_loaded")
        self.assertEqual(len(bot.documents), 1)

        forced = await import_manifest(
            storage=self.storage,
            items=items,
            dry_run=False,
            force=True,
            bot=bot,
            upload_chat_id=7001,
        )
        self.assertEqual(forced[0].status, "uploaded")
        self.assertEqual(len(bot.documents), 2)
        refreshed = await self.storage.get_material(
            "hermes_find_business_guide"
        )
        self.assertEqual(
            refreshed.telegram_file_id, "document-file-2"
        )


if __name__ == "__main__":
    unittest.main()
