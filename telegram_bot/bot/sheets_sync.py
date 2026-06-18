from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from .config import Settings
from .db import Lead


logger = logging.getLogger(__name__)


HEADERS = [
    "lead_id",
    "created_at",
    "updated_at",
    "telegram_id",
    "chat_id",
    "name",
    "telegram_username",
    "manual_username",
    "phone",
    "source",
    "status",
    "q1_business_status",
    "last_seen_at",
    "last_event",
]


class GoogleSheetsSync:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._worksheet = None
        self._disabled_logged = False

    @property
    def enabled(self) -> bool:
        if not self.settings.google_sheet_id:
            return False

        credentials_file = self.settings.google_service_account_file
        if not credentials_file:
            return False

        return Path(credentials_file).exists()

    async def sync_lead_id(
        self,
        session_factory: async_sessionmaker,
        telegram_id: int,
        last_event: str,
    ) -> None:
        if not self.enabled:
            self._log_disabled_once()
            return

        async with session_factory() as session:
            result = await session.execute(
                select(Lead).where(Lead.telegram_id == telegram_id)
            )
            lead = result.scalar_one_or_none()

        if lead is None:
            return

        row = self._lead_to_row(lead, last_event)
        await asyncio.to_thread(self._sync_row, str(lead.telegram_id), row)

    async def sync_all_leads(
        self,
        session_factory: async_sessionmaker,
        last_event: str = "manual_sheet_sync",
    ) -> tuple[bool, int]:
        if not self.enabled:
            self._log_disabled_once()
            return False, 0

        async with session_factory() as session:
            result = await session.execute(select(Lead).order_by(Lead.id))
            leads = list(result.scalars().all())

        rows = [
            (str(lead.telegram_id), self._lead_to_row(lead, last_event))
            for lead in leads
        ]
        await asyncio.to_thread(self._sync_rows, rows)
        return True, len(rows)

    def _log_disabled_once(self) -> None:
        if self._disabled_logged:
            return

        if self.settings.google_sheet_id:
            logger.info(
                "Google Sheets sync is disabled: service account file is not configured or missing"
            )
        self._disabled_logged = True

    def _lead_to_row(self, lead: Lead, last_event: str) -> list[str]:
        name = " ".join(
            part for part in [lead.first_name, lead.last_name] if part
        ).strip()
        telegram_username = f"@{lead.username}" if lead.username else ""

        return [
            str(lead.id),
            lead.created_at.isoformat(sep=" ", timespec="seconds"),
            lead.updated_at.isoformat(sep=" ", timespec="seconds"),
            str(lead.telegram_id),
            str(lead.chat_id),
            name,
            telegram_username,
            lead.manual_username or "",
            lead.phone or "",
            lead.source or lead.start_payload or "",
            lead.status,
            lead.q1_business_status or "",
            lead.last_seen_at.isoformat(sep=" ", timespec="seconds"),
            last_event,
        ]

    def _sync_row(self, telegram_id: str, row: list[str]) -> None:
        self._sync_rows([(telegram_id, row)])

    def _sync_rows(self, rows: list[tuple[str, list[str]]]) -> None:
        try:
            worksheet = self._get_worksheet()
            self._ensure_headers(worksheet)
            row_numbers = self._get_existing_row_numbers(worksheet)

            for telegram_id, row in rows:
                row_number = row_numbers.get(telegram_id)
                range_name = f"A{row_number}:N{row_number}" if row_number else None

                if range_name:
                    worksheet.update([row], range_name)
                else:
                    worksheet.append_row(row, value_input_option="USER_ENTERED")
        except Exception:
            logger.exception("Google Sheets sync failed")

    def _get_worksheet(self):
        if self._worksheet is not None:
            return self._worksheet

        import gspread

        client = gspread.service_account(
            filename=self.settings.google_service_account_file
        )
        spreadsheet = client.open_by_key(self.settings.google_sheet_id)
        self._worksheet = spreadsheet.get_worksheet(
            self.settings.google_worksheet_index
        )
        return self._worksheet

    def _ensure_headers(self, worksheet) -> None:
        current_headers = worksheet.row_values(1)
        if current_headers[: len(HEADERS)] == HEADERS:
            return

        worksheet.update([HEADERS], "A1:N1")

    def _get_existing_row_numbers(self, worksheet) -> dict[str, int]:
        values = worksheet.get_all_values()
        telegram_id_index = HEADERS.index("telegram_id")
        row_numbers = {}

        for row_number, row in enumerate(values[1:], start=2):
            if len(row) > telegram_id_index and row[telegram_id_index]:
                row_numbers[row[telegram_id_index]] = row_number

        return row_numbers
