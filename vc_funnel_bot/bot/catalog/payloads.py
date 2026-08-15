from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PayloadDefinition:
    payload: str
    group: str
    title: str
    entry_mode: str
    material_key: str | None = None
    post_id: str | None = None
    post_slug: str | None = None
    post_topic: str | None = None
    cta_type: str | None = None
    source: str | None = None
    campaign: str | None = None


PAYLOAD_CATALOG = {
    "am_e02_broadcast_1508": PayloadDefinition(
        payload="am_e02_broadcast_1508",
        group="telegram",
        title="Рассылка приглашения на эфир E02 15 августа",
        entry_mode="webinar_registration",
        post_id="e02_bot_broadcast_1508",
        post_slug="e02_bot_broadcast_1508",
        post_topic="рассылка приглашения на эфир E02 15 августа",
        cta_type="webinar_register",
        source="bot_broadcast",
        campaign="e02_1608_bot_broadcast_1508",
    ),
    "am_e02_register_1608": PayloadDefinition(
        payload="am_e02_register_1608",
        group="andrey_main",
        title="Регистрация на эфир E02 16 августа",
        entry_mode="webinar_registration",
        post_id="e02_announcement_1608",
        post_slug="e02_announcement_1608",
        post_topic="анонс эфира E02 16 августа",
        cta_type="webinar_register",
        source="andrey_main",
        campaign="e02_1608_announcement",
    ),
    "youtube_hermes": PayloadDefinition(
        payload="youtube_hermes",
        group="youtube",
        title="Hermes из YouTube",
        entry_mode="hermes_bottleneck",
        post_id="hermes",
        post_slug="hermes",
        post_topic="Hermes",
        cta_type="bottleneck_route",
        source="youtube",
        campaign="hermes",
    ),
    "telegram_hermes": PayloadDefinition(
        payload="telegram_hermes",
        group="telegram",
        title="Hermes из Telegram",
        entry_mode="hermes_bottleneck",
        post_id="hermes",
        post_slug="hermes",
        post_topic="Hermes",
        cta_type="bottleneck_route",
        source="telegram",
        campaign="hermes",
    ),
    "am_hermes_video_route": PayloadDefinition(
        payload="am_hermes_video_route",
        group="andrey_main",
        title="Hermes: определить узкое звено",
        entry_mode="hermes_bottleneck",
        material_key=None,
        post_id="hermes_video",
        post_slug="hermes_install_and_demo",
        post_topic="hermes_install_and_demo",
        cta_type="bottleneck_route",
        source="andrey_main",
        campaign="hermes_video",
    ),
    "am_p01_video": PayloadDefinition(
        "am_p01_video",
        "andrey_main",
        "Основное видео об ИИ-связке",
        "external_materials",
        "am_p01_video",
        "p01",
        "video",
        "как работает ИИ-связка",
        "video",
        "andrey_main",
        "andrey_main_p01",
    ),
    "am_p02_map": PayloadDefinition(
        "am_p02_map",
        "andrey_main",
        "Схема ИИ-связки",
        "external_materials",
        "am_p02_map",
        "p02",
        "map",
        "карта ИИ-связки от контента до РКО-заявки",
        "map",
        "andrey_main",
        "andrey_main_p02",
    ),
    "am_p03_demo": PayloadDefinition(
        "am_p03_demo",
        "andrey_main",
        "Демонстрация ИИ-связки",
        "external_materials",
        "am_p03_demo",
        "p03",
        "demo",
        "демонстрация готовой ИИ-связки",
        "demo",
        "andrey_main",
        "andrey_main_p03",
    ),
    "am_p04_route": PayloadDefinition(
        "am_p04_route",
        "andrey_main",
        "Персональный маршрут ИИ-связки",
        "external_diagnostic",
        "am_p04_route",
        "p04",
        "route",
        "персональный маршрут ИИ-связки",
        "route",
        "andrey_main",
        "andrey_main_p04",
    ),
    "am_p05_apply": PayloadDefinition(
        "am_p05_apply",
        "andrey_main",
        "Заявка на сборку ИИ-связки",
        "direct_review_request",
        "am_p05_apply",
        "p05",
        "apply",
        "заявка на сборку ИИ-связки",
        "apply",
        "andrey_main",
        "andrey_main_p05",
    ),
    "yt_video_0704_description": PayloadDefinition("yt_video_0704_description", "youtube", "YouTube description", "external_materials", "andrey_video_0704"),
    "yt_video_0704_pinned": PayloadDefinition("yt_video_0704_pinned", "youtube", "YouTube pinned comment", "external_materials", "andrey_video_0704"),
    "yt_video_0704_comment": PayloadDefinition("yt_video_0704_comment", "youtube", "YouTube comment", "external_materials", "andrey_video_0704"),
    "yt_video_0704_qr": PayloadDefinition("yt_video_0704_qr", "youtube", "YouTube QR", "external_materials", "andrey_video_0704"),
    "tg_tgk_post_0704_materials": PayloadDefinition("tg_tgk_post_0704_materials", "telegram", "Telegram post 0704 materials", "external_materials", "tg_post_0704_materials"),
    "tg_tgk_post_0705_diagnostic": PayloadDefinition("tg_tgk_post_0705_diagnostic", "telegram", "Telegram diagnostic", "external_diagnostic"),
    "tg_ztgk_post_0705_closer": PayloadDefinition("tg_ztgk_post_0705_closer", "telegram", "Telegram closer diagnostic", "external_diagnostic"),
    "tg_post_0808_access": PayloadDefinition("tg_post_0808_access", "telegram", "Telegram access", "access_gate"),
    "access_0808": PayloadDefinition("access_0808", "telegram", "Access", "access_gate"),
    "dostup_0808": PayloadDefinition("dostup_0808", "telegram", "Dostup", "access_gate"),
    "ch_0706_agent_lost_leads_materials": PayloadDefinition("ch_0706_agent_lost_leads_materials", "private_channel", "Agent lost leads materials", "channel_materials", "agent_lost_leads", "0706", "agent_lost_leads", "агента, который находит потерянные заявки", "materials"),
    "ch_0706_agent_lost_leads_diagnostic": PayloadDefinition("ch_0706_agent_lost_leads_diagnostic", "private_channel", "Agent lost leads diagnostic", "channel_diagnostic", None, "0706", "agent_lost_leads", "агента, который находит потерянные заявки", "diagnostic"),
    "ch_0706_agent_lost_leads_call": PayloadDefinition("ch_0706_agent_lost_leads_call", "private_channel", "Agent lost leads call", "channel_call", None, "0706", "agent_lost_leads", "агента, который находит потерянные заявки", "call"),
    "ch_0708_rko_bridge_check": PayloadDefinition("ch_0708_rko_bridge_check", "private_channel", "RKO bridge check", "channel_diagnostic", None, "0708", "rko_bridge", "связки полезный инструмент → диалог → РКО-заявка", "check"),
    "ch_0709_want_vc": PayloadDefinition("ch_0709_want_vc", "private_channel", "Want VC", "channel_want_vc", None, "0709", "want_vc", "участия в VC", "want_vc"),
}


def normalize_payload(raw_payload: str | None) -> str | None:
    if not raw_payload:
        return None
    return raw_payload.strip().lower().replace("-", "_").replace(":", "_")
