from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal


SourceType = Literal["youtube", "telegram", "direct", "channel", "unknown"]
SourceChannel = Literal[
    "youtube_description",
    "youtube_pinned",
    "youtube_comment",
    "youtube_qr",
    "tgk",
    "ztgk",
    "tgchat",
    "tg_post",
    "private_channel",
    "direct",
    "manual_text",
    "unknown",
]
CtaType = Literal[
    "materials",
    "diagnostic",
    "access",
    "dostup",
    "closer",
    "be_closer",
    "sale",
    "call",
    "check",
    "want_vc",
    "video",
    "map",
    "demo",
    "route",
    "apply",
    "bottleneck_route",
    "unknown",
]
Cjm = Literal[
    "youtube_materials",
    "telegram_materials",
    "telegram_diagnostic",
    "telegram_access",
    "channel_materials",
    "channel_diagnostic",
    "channel_call",
    "channel_want_vc",
    "hermes_bottleneck",
    "direct",
    "unknown",
]
EntryMode = Literal[
    "universal_start",
    "external_materials",
    "external_diagnostic",
    "access_gate",
    "direct_materials",
    "direct_review_request",
    "channel_materials",
    "channel_diagnostic",
    "channel_call",
    "channel_want_vc",
    "returning_after_sales",
    "hermes_bottleneck",
    "unknown_text",
    "unsafe_data",
]


@dataclass(frozen=True)
class SourceInfo:
    raw_start_payload: str | None
    source_type: SourceType
    source_channel: SourceChannel
    source: str
    entry_surface: str
    entry_mode: EntryMode
    campaign: str
    content_id: str
    cta_type: CtaType
    cjm: Cjm
    post_id: str
    post_slug: str
    post_topic: str


@dataclass(frozen=True)
class Lead:
    id: int
    telegram_id: int
    username: str | None
    first_name: str | None
    contact: str | None
    raw_start_payload: str | None
    latest_start_payload: str | None
    source_type: str
    source_channel: str
    source: str
    entry_surface: str
    entry_mode: str
    campaign: str
    content_id: str
    cta_type: str
    cjm: str
    post_id: str | None
    post_slug: str | None
    post_topic: str | None
    segment: str | None
    pain: str | None
    intent: str | None
    urgency: str | None
    application_context: str | None
    lead_status: str
    lead_temperature: str
    materials_sent: bool
    private_channel_sent: bool
    call_requested: bool
    sales_notified: bool
    sales_notified_at: str | None
    support_notified: bool
    support_notified_at: str | None
    last_bot_screen_message_id: int | None
    bot_screen_message_ids: list[int]
    created_at: str
    updated_at: str
    last_interaction_at: str


@dataclass(frozen=True)
class Event:
    id: int
    telegram_id: int | None
    event_type: str
    event_payload: dict[str, Any]
    created_at: str


@dataclass(frozen=True)
class Material:
    material_key: str
    title: str
    body: str | None
    url: str | None
    telegram_file_id: str | None
    telegram_file_type: str | None
    telegram_file_name: str | None
    telegram_caption: str | None
    is_active: bool
    telegram_file_status: str
    telegram_file_verified_at: str | None
    telegram_file_error: str | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class WebinarRegistration:
    id: int
    event_id: str
    telegram_user_id: int
    telegram_chat_id: int
    username: str | None
    first_name: str | None
    source: str
    start_payload: str | None
    campaign: str | None
    post: str | None
    selected_route: str | None
    bottleneck: str | None
    registered_at: str
    registration_status: str
    reminder_24h_sent_at: str | None
    reminder_3h_sent_at: str | None
    reminder_15m_sent_at: str | None
    join_clicked_at: str | None
    replay_clicked_at: str | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class WebinarEventConfig:
    event_id: str
    title: str
    start_at: str | None
    timezone: str
    join_url: str | None
    replay_url: str | None
    phase: str
    event_version: int
    support_manager_chat_id: int | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class WebinarDelivery:
    id: int
    event_id: str
    event_version: int
    telegram_user_id: int
    telegram_chat_id: int
    delivery_type: str
    scheduled_at: str
    status: str
    payload_json: str | None
    sent_at: str | None
    error_type: str | None
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class SupportTicket:
    id: int
    user_id: int
    telegram_chat_id: int
    username: str | None
    source: str
    topic: str
    message: str
    status: str
    assigned_admin_id: int | None
    answer_text: str | None
    answered_by_admin_id: int | None
    created_at: str
    updated_at: str
    answered_at: str | None
    event_version: int | None
    route_key: str | None


LEAD_STATUSES = {
    "started",
    "materials_requested",
    "materials_sent",
    "qual_started",
    "qual_completed",
    "route_completed",
    "private_channel_sent",
    "call_cta_shown",
    "contact_requested",
    "review_context_requested",
    "application_started",
    "application_context_requested",
    "application_submitted",
    "setup_context_requested",
    "support_requested",
    "call_requested",
    "sales_notified",
    "not_ready",
}

LEAD_TEMPERATURES = {"cold", "warm", "sql", "hot_sql"}
