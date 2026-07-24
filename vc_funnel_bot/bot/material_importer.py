from __future__ import annotations

import argparse
import asyncio
import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from aiogram import Bot
from aiogram.types import FSInputFile

from .catalog.materials import MATERIAL_CATALOG
from .config import load_settings, resolve_sqlite_path
from .storage import VcStorage


DEFAULT_PACK_DIR = (
    Path(__file__).resolve().parents[1]
    / "material_packs"
    / "hermes_first_audit"
)
DEFAULT_MANIFEST = DEFAULT_PACK_DIR / "material_upload_manifest.csv"
PLACEHOLDER = "[ADD_URL_OR_FILE]"
ALLOWED_TYPES = {"document", "video"}


@dataclass(frozen=True)
class ManifestItem:
    material_key: str
    file_name: str
    file_type: str
    purpose: str
    file_path: Path | None


@dataclass(frozen=True)
class ImportResult:
    material_key: str
    status: str
    detail: str


def load_manifest(
    manifest_path: Path,
    pack_dir: Path | None = None,
) -> tuple[ManifestItem, ...]:
    root = (pack_dir or manifest_path.parent).resolve()
    with manifest_path.open(encoding="utf-8-sig", newline="") as manifest_file:
        rows = list(csv.DictReader(manifest_file))

    required = {"material_key", "file_name", "type", "purpose"}
    if not rows:
        raise ValueError("Manifest is empty")
    if not required.issubset(rows[0]):
        missing = ", ".join(sorted(required - set(rows[0])))
        raise ValueError(f"Manifest columns are missing: {missing}")

    items: list[ManifestItem] = []
    seen: set[str] = set()
    for row in rows:
        material_key = (row["material_key"] or "").strip()
        file_name = (row["file_name"] or "").strip()
        file_type = (row["type"] or "").strip().lower()
        purpose = (row["purpose"] or "").strip()
        if not material_key or material_key in seen:
            raise ValueError(
                f"Empty or duplicate material_key: {material_key or '<empty>'}"
            )
        if file_type not in ALLOWED_TYPES:
            raise ValueError(
                f"{material_key}: unsupported Telegram type {file_type}"
            )
        seen.add(material_key)
        file_path = None
        if file_name != PLACEHOLDER:
            file_path = (root / file_name).resolve()
            if file_path != root and root not in file_path.parents:
                raise ValueError(
                    f"{material_key}: file path leaves the pack directory"
                )
        items.append(
            ManifestItem(
                material_key=material_key,
                file_name=file_name,
                file_type=file_type,
                purpose=purpose,
                file_path=file_path,
            )
        )
    return tuple(items)


def validate_manifest(items: tuple[ManifestItem, ...]) -> tuple[ImportResult, ...]:
    results: list[ImportResult] = []
    for item in items:
        if item.file_path is None:
            results.append(
                ImportResult(item.material_key, "placeholder", item.file_name)
            )
        elif not item.file_path.is_file():
            results.append(
                ImportResult(
                    item.material_key,
                    "missing_file",
                    str(item.file_path),
                )
            )
        else:
            results.append(
                ImportResult(
                    item.material_key,
                    "ready",
                    str(item.file_path),
                )
            )
    return tuple(results)


async def import_manifest(
    *,
    storage: VcStorage,
    items: tuple[ManifestItem, ...],
    dry_run: bool,
    force: bool = False,
    bot: Any | None = None,
    upload_chat_id: int | None = None,
) -> tuple[ImportResult, ...]:
    if not dry_run and (bot is None or upload_chat_id is None):
        raise ValueError("bot and upload_chat_id are required for apply mode")

    validation = {
        result.material_key: result
        for result in validate_manifest(items)
    }
    results: list[ImportResult] = []
    for item in items:
        check = validation[item.material_key]
        if check.status != "ready":
            results.append(check)
            continue

        existing = await storage.get_material_any(item.material_key)
        if (
            not force
            and existing is not None
            and existing.is_active
            and existing.telegram_file_id
        ):
            results.append(
                ImportResult(
                    item.material_key,
                    "skipped_loaded",
                    existing.telegram_file_type or "file",
                )
            )
            continue

        if dry_run:
            results.append(
                ImportResult(
                    item.material_key,
                    "would_upload",
                    str(item.file_path),
                )
            )
            continue

        assert item.file_path is not None
        upload = FSInputFile(item.file_path, filename=item.file_path.name)
        if item.file_type == "video":
            message = await bot.send_video(
                chat_id=upload_chat_id,
                video=upload,
                caption=item.purpose,
            )
            telegram_file = message.video
        else:
            message = await bot.send_document(
                chat_id=upload_chat_id,
                document=upload,
                caption=item.purpose,
            )
            telegram_file = message.document
        if telegram_file is None:
            raise RuntimeError(
                f"Telegram did not return a file for {item.material_key}"
            )

        definition = MATERIAL_CATALOG.get(item.material_key)
        title = definition.title if definition else item.purpose
        await storage.upsert_material(
            material_key=item.material_key,
            title=title,
            telegram_file_id=telegram_file.file_id,
            telegram_file_type=item.file_type,
            telegram_file_name=getattr(telegram_file, "file_name", None),
            telegram_caption=item.purpose,
        )
        await storage.add_event(
            None,
            "admin_manifest_material_uploaded",
            {
                "material_key": item.material_key,
                "file_name": item.file_name,
                "file_type": item.file_type,
                "force": force,
            },
        )
        results.append(
            ImportResult(
                item.material_key,
                "uploaded",
                telegram_file.file_id,
            )
        )

    return tuple(results)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate or upload the Hermes material manifest."
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST,
    )
    parser.add_argument("--pack-dir", type=Path)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Upload files and upsert Telegram file_ids. Default is dry-run.",
    )
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--upload-chat-id", type=int)
    return parser


async def async_main(args: argparse.Namespace) -> int:
    if args.apply and args.upload_chat_id is None:
        raise ValueError("--upload-chat-id is required with --apply")

    items = load_manifest(args.manifest, args.pack_dir)
    settings = load_settings()
    storage = VcStorage(resolve_sqlite_path(settings), settings.timezone)
    await storage.connect()
    bot: Bot | None = Bot(settings.bot_token) if args.apply else None
    try:
        results = await import_manifest(
            storage=storage,
            items=items,
            dry_run=not args.apply,
            force=args.force,
            bot=bot,
            upload_chat_id=args.upload_chat_id,
        )
    finally:
        if bot is not None:
            await bot.session.close()
        await storage.close()

    for result in results:
        print(
            f"{result.material_key}: {result.status}"
            f" ({result.detail})"
        )
    failed = any(result.status == "missing_file" for result in results)
    return 1 if failed else 0


def main() -> None:
    args = build_parser().parse_args()
    raise SystemExit(asyncio.run(async_main(args)))


if __name__ == "__main__":
    main()
