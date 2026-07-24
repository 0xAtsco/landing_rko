from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from zoneinfo import ZoneInfo

from bot.analytics import (
    PAIN_OPTIONS,
    SEGMENT_OPTIONS,
    is_qualification_complete,
    next_required_question,
)
from bot.source_parser import parse_start_payload
from bot.storage import VcStorage


class FlowRulesTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.storage = VcStorage(Path(self.tmp.name) / "vc_funnel.db", ZoneInfo("Europe/Moscow"))
        await self.storage.connect()

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    async def create_lead(self, payload: str):
        return await self.storage.upsert_lead(
            telegram_id=100,
            username="vc_user",
            first_name="VC",
            source=parse_start_payload(payload),
        )

    async def test_youtube_full_flow_rules(self) -> None:
        lead = await self.create_lead("yt_video_0704_description")
        self.assertEqual(lead.cjm, "youtube_materials")

        lead = await self.storage.mark_materials_sent(lead.telegram_id)
        lead = await self.storage.mark_qual_started(lead.telegram_id)
        self.assertEqual(next_required_question(lead), "q1")

        lead = await self.storage.save_answer(lead.telegram_id, "segment", SEGMENT_OPTIONS["rko"])
        self.assertEqual(next_required_question(lead), "q2")
        lead = await self.storage.save_answer(lead.telegram_id, "pain", PAIN_OPTIONS["more_leads"])
        self.assertTrue(is_qualification_complete(lead))

        lead = await self.storage.mark_qual_completed(lead.telegram_id)
        lead = await self.storage.mark_private_channel_sent(lead.telegram_id)
        lead = await self.storage.mark_call_requested(lead.telegram_id)
        self.assertTrue(lead.call_requested)
        self.assertEqual(lead.lead_temperature, "sql")

    async def test_telegram_materials_flow_rules(self) -> None:
        lead = await self.create_lead("tg_tgk_post_0704_materials")
        self.assertEqual(lead.cjm, "telegram_materials")
        lead = await self.storage.mark_materials_sent(lead.telegram_id)
        await self.storage.save_answer(lead.telegram_id, "segment", SEGMENT_OPTIONS["audience"])
        lead = await self.storage.save_answer(lead.telegram_id, "pain", PAIN_OPTIONS["automate_people"])
        self.assertTrue(is_qualification_complete(lead))
        lead = await self.storage.mark_private_channel_sent(lead.telegram_id)
        self.assertTrue(lead.private_channel_sent)
        self.assertFalse(lead.call_requested)

    async def test_telegram_diagnostic_flow_rules(self) -> None:
        lead = await self.create_lead("tg_ztgk_post_0705_closer")
        self.assertEqual(lead.cjm, "telegram_diagnostic")
        await self.storage.save_answer(lead.telegram_id, "segment", SEGMENT_OPTIONS["product"])
        lead = await self.storage.save_answer(lead.telegram_id, "pain", PAIN_OPTIONS["build_funnel"])
        self.assertTrue(is_qualification_complete(lead))

    async def test_telegram_access_short_qual_rules(self) -> None:
        lead = await self.create_lead("access_0808")
        self.assertEqual(lead.cjm, "telegram_access")
        self.assertEqual(lead.entry_mode, "access_gate")

        lead = await self.storage.mark_private_channel_sent(lead.telegram_id)
        self.assertTrue(lead.private_channel_sent)
        self.assertFalse(lead.call_requested)

    async def test_channel_payload_flow_rules(self) -> None:
        lead = await self.create_lead("ch_0706_agent_lost_leads_diagnostic")
        self.assertEqual(lead.entry_surface, "private_channel")
        self.assertEqual(lead.source, "channel")
        self.assertEqual(lead.entry_mode, "channel_diagnostic")
        self.assertEqual(lead.post_id, "0706")
        self.assertEqual(lead.post_slug, "agent_lost_leads")


if __name__ == "__main__":
    unittest.main()
