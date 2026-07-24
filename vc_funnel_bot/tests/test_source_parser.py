from __future__ import annotations

import unittest

from bot.catalog.payloads import PAYLOAD_CATALOG
from bot.source_parser import parse_start_payload


class SourceParserTest(unittest.TestCase):
    def test_andrey_main_payloads_have_exact_attribution(self) -> None:
        expected = {
            "am_p01_video": ("external_materials", "p01", "video", "andrey_main_p01", "video"),
            "am_p02_map": ("external_materials", "p02", "map", "andrey_main_p02", "map"),
            "am_p03_demo": ("external_materials", "p03", "demo", "andrey_main_p03", "demo"),
            "am_p04_route": ("external_diagnostic", "p04", "route", "andrey_main_p04", "route"),
            "am_p05_apply": ("direct_review_request", "p05", "apply", "andrey_main_p05", "apply"),
        }

        for payload, (entry_mode, post_id, slug, campaign, cta) in expected.items():
            with self.subTest(payload=payload):
                source = parse_start_payload(payload)
                self.assertEqual(source.source, "andrey_main")
                self.assertEqual(source.source_type, "telegram")
                self.assertEqual(source.source_channel, "tg_post")
                self.assertEqual(source.entry_surface, "external")
                self.assertEqual(source.entry_mode, entry_mode)
                self.assertEqual(source.post_id, post_id)
                self.assertEqual(source.post_slug, slug)
                self.assertEqual(source.campaign, campaign)
                self.assertEqual(source.cta_type, cta)
                self.assertEqual(PAYLOAD_CATALOG[payload].material_key, payload)

    def test_unknown_payload_falls_back_to_universal_start(self) -> None:
        source = parse_start_payload("unknown_campaign_payload")
        self.assertEqual(source.source_type, "unknown")
        self.assertEqual(source.entry_mode, "universal_start")

    def test_youtube_description(self) -> None:
        source = parse_start_payload("yt_video_0704_description")
        self.assertEqual(source.source_type, "youtube")
        self.assertEqual(source.source_channel, "youtube_description")
        self.assertEqual(source.campaign, "video_0704")
        self.assertEqual(source.content_id, "0704")
        self.assertEqual(source.cjm, "youtube_materials")
        self.assertEqual(source.entry_mode, "external_materials")

    def test_youtube_pinned(self) -> None:
        source = parse_start_payload("yt_video_0704_pinned")
        self.assertEqual(source.source_channel, "youtube_pinned")
        self.assertEqual(source.cjm, "youtube_materials")

    def test_youtube_comment_mixed_separator(self) -> None:
        source = parse_start_payload("youtube-video:0704-comment")
        self.assertEqual(source.source_channel, "youtube_comment")
        self.assertEqual(source.campaign, "video_0704")
        self.assertEqual(source.cjm, "youtube_materials")

    def test_youtube_qr(self) -> None:
        source = parse_start_payload("yt_video_0704_qr")
        self.assertEqual(source.source_channel, "youtube_qr")
        self.assertEqual(source.cjm, "youtube_materials")

    def test_telegram_tgk_diagnostic(self) -> None:
        source = parse_start_payload("tg_tgk_post_0705_diagnostic")
        self.assertEqual(source.source_type, "telegram")
        self.assertEqual(source.source_channel, "tgk")
        self.assertEqual(source.campaign, "post_0705")
        self.assertEqual(source.cta_type, "diagnostic")
        self.assertEqual(source.cjm, "telegram_diagnostic")
        self.assertEqual(source.entry_mode, "external_diagnostic")

    def test_telegram_ztgk_closer(self) -> None:
        source = parse_start_payload("tg_ztgk_post_0705_closer")
        self.assertEqual(source.source_channel, "ztgk")
        self.assertEqual(source.cta_type, "closer")
        self.assertEqual(source.cjm, "telegram_diagnostic")

    def test_telegram_access(self) -> None:
        source = parse_start_payload("tg_post_0808_access")
        self.assertEqual(source.campaign, "post_0808")
        self.assertEqual(source.cta_type, "access")
        self.assertEqual(source.cjm, "telegram_access")
        self.assertEqual(source.entry_mode, "access_gate")

    def test_access_without_tg_prefix(self) -> None:
        source = parse_start_payload("access_0808")
        self.assertEqual(source.source_type, "telegram")
        self.assertEqual(source.source_channel, "direct")
        self.assertEqual(source.campaign, "access_0808")
        self.assertEqual(source.cta_type, "access")
        self.assertEqual(source.cjm, "telegram_access")
        self.assertEqual(source.entry_mode, "access_gate")

    def test_dostup_without_tg_prefix(self) -> None:
        source = parse_start_payload("dostup_0808")
        self.assertEqual(source.source_type, "telegram")
        self.assertEqual(source.cta_type, "dostup")
        self.assertEqual(source.cjm, "telegram_access")

    def test_empty_payload_is_direct(self) -> None:
        source = parse_start_payload(None)
        self.assertEqual(source.source_type, "direct")
        self.assertEqual(source.source_channel, "direct")
        self.assertEqual(source.cjm, "direct")
        self.assertEqual(source.entry_mode, "universal_start")

    def test_channel_diagnostic_payload(self) -> None:
        source = parse_start_payload("ch_0706_agent_lost_leads_diagnostic")
        self.assertEqual(source.source_type, "channel")
        self.assertEqual(source.source, "channel")
        self.assertEqual(source.source_channel, "private_channel")
        self.assertEqual(source.entry_surface, "private_channel")
        self.assertEqual(source.entry_mode, "channel_diagnostic")
        self.assertEqual(source.post_id, "0706")
        self.assertEqual(source.post_slug, "agent_lost_leads")
        self.assertEqual(source.cta_type, "diagnostic")

    def test_channel_materials_payload(self) -> None:
        source = parse_start_payload("ch-0706-agent-lost-leads-materials")
        self.assertEqual(source.entry_mode, "channel_materials")
        self.assertEqual(source.cta_type, "materials")

    def test_channel_call_payload(self) -> None:
        source = parse_start_payload("ch:0706:agent_lost_leads:call")
        self.assertEqual(source.entry_mode, "channel_call")
        self.assertEqual(source.cta_type, "call")

    def test_channel_want_vc_payload(self) -> None:
        source = parse_start_payload("ch_0709_want_vc")
        self.assertEqual(source.entry_mode, "channel_want_vc")
        self.assertEqual(source.cta_type, "want_vc")


if __name__ == "__main__":
    unittest.main()
