from __future__ import annotations

import re

from .catalog.payloads import PAYLOAD_CATALOG, PayloadDefinition, normalize_payload
from .models import Cjm, CtaType, EntryMode, SourceChannel, SourceInfo, SourceType


TOKEN_RE = re.compile(r"[_:\-\s]+")
CONTENT_ID_RE = re.compile(r"^\d{3,8}$")

POST_TOPICS = {
    "agent_lost_leads": "заявки без ответа",
    "rko_bridge": "связку через РКО",
    "want_vc": "участие в VC",
}


def _tokens(raw_payload: str | None) -> list[str]:
    if not raw_payload:
        return []
    return [token for token in TOKEN_RE.split(raw_payload.strip().lower()) if token]


def _content_id(tokens: list[str]) -> str:
    for token in tokens:
        if CONTENT_ID_RE.fullmatch(token):
            return token
    return "unknown"


def _cta_type(tokens: list[str]) -> CtaType:
    joined = "_".join(tokens)
    if "be_closer" in joined or ("be" in tokens and "closer" in tokens):
        return "be_closer"
    for candidate in (
        "materials",
        "diagnostic",
        "access",
        "dostup",
        "closer",
        "sale",
        "call",
        "check",
    ):
        if candidate in tokens:
            return candidate  # type: ignore[return-value]
    if "want" in tokens and "vc" in tokens:
        return "want_vc"
    return "unknown"


def _source_type(tokens: list[str]) -> SourceType:
    if not tokens:
        return "direct"
    if "ch" in tokens:
        return "channel"
    if "yt" in tokens or "youtube" in tokens:
        return "youtube"
    if any(token in tokens for token in ("tg", "telegram", "tgk", "ztgk", "chat", "channel")):
        return "telegram"
    if any(token in tokens for token in ("access", "dostup", "sale")):
        return "telegram"
    return "unknown"


def _source_channel(tokens: list[str], source_type: SourceType) -> SourceChannel:
    if source_type == "direct":
        return "direct"
    if source_type == "channel":
        return "private_channel"
    if source_type == "youtube":
        if "description" in tokens:
            return "youtube_description"
        if "pinned" in tokens:
            return "youtube_pinned"
        if "comment" in tokens:
            return "youtube_comment"
        if "qr" in tokens:
            return "youtube_qr"
        return "unknown"
    if source_type == "telegram":
        if "tgk" in tokens:
            return "tgk"
        if "ztgk" in tokens:
            return "ztgk"
        if "chat" in tokens:
            return "tgchat"
        if "post" in tokens or "channel" in tokens:
            return "tg_post"
        if any(token in tokens for token in ("access", "dostup", "sale")):
            return "direct"
    return "unknown"


def _source(source_type: SourceType, source_channel: SourceChannel) -> str:
    if source_type == "channel" or source_channel == "private_channel":
        return "channel"
    if source_type == "youtube":
        return "youtube"
    if source_type == "telegram":
        return "telegram"
    if source_channel == "manual_text":
        return "manual_text"
    if source_type == "direct":
        return "direct"
    return "unknown"


def _entry_surface(source_type: SourceType, source_channel: SourceChannel) -> str:
    if source_type == "channel" or source_channel == "private_channel":
        return "private_channel"
    if source_channel == "manual_text":
        return "bot_text"
    if source_type in {"youtube", "telegram"}:
        return "external"
    if source_type == "direct":
        return "direct"
    return "unknown"


def _campaign(tokens: list[str], content_id: str, cta_type: CtaType, source_type: SourceType) -> str:
    if content_id == "unknown":
        return "unknown"
    if source_type == "channel":
        return f"channel_{content_id}"
    if "video" in tokens or source_type == "youtube":
        return f"video_{content_id}"
    if "post" in tokens or source_type == "telegram":
        if cta_type in {"access", "dostup", "sale"} and "post" not in tokens:
            return f"access_{content_id}"
        return f"post_{content_id}"
    if cta_type in {"access", "dostup", "sale"}:
        return f"access_{content_id}"
    return "unknown"


def _cjm(tokens: list[str], source_type: SourceType, cta_type: CtaType) -> Cjm:
    if source_type == "direct":
        return "direct"
    if source_type == "channel":
        if cta_type == "materials":
            return "channel_materials"
        if cta_type in {"diagnostic", "check"}:
            return "channel_diagnostic"
        if cta_type == "call":
            return "channel_call"
        if cta_type == "want_vc":
            return "channel_want_vc"
        return "channel_diagnostic"
    if source_type == "youtube":
        return "youtube_materials"
    if source_type == "telegram":
        if cta_type == "materials":
            return "telegram_materials"
        if cta_type in {"diagnostic", "closer", "be_closer"}:
            return "telegram_diagnostic"
        if cta_type in {"access", "dostup", "sale"}:
            return "telegram_access"
        if any(token in tokens for token in ("tgk", "ztgk", "chat", "channel", "post")):
            return "telegram_diagnostic"
    return "unknown"


def _entry_mode(source_type: SourceType, cta_type: CtaType, cjm: Cjm) -> EntryMode:
    if source_type == "direct":
        return "universal_start"
    if source_type == "youtube":
        return "external_materials"
    if source_type == "telegram":
        if cta_type == "materials" or cjm == "telegram_materials":
            return "external_materials"
        if cta_type in {"access", "dostup", "sale"} or cjm == "telegram_access":
            return "access_gate"
        return "external_diagnostic"
    if source_type == "channel":
        if cta_type == "materials":
            return "channel_materials"
        if cta_type == "call":
            return "channel_call"
        if cta_type == "want_vc":
            return "channel_want_vc"
        return "channel_diagnostic"
    return "universal_start"


def _post_slug(tokens: list[str], content_id: str, cta_type: CtaType, source_type: SourceType) -> str:
    if source_type != "channel":
        return "unknown"
    ignored = {"ch", "channel", content_id, cta_type}
    if cta_type == "want_vc":
        ignored.update({"want", "vc"})
    slug_tokens = [token for token in tokens if token not in ignored and not CONTENT_ID_RE.fullmatch(token)]
    return "_".join(slug_tokens) or "unknown"


def _post_topic(post_slug: str) -> str:
    return POST_TOPICS.get(post_slug, post_slug.replace("_", " ") if post_slug != "unknown" else "пост")


def parse_start_payload(raw_payload: str | None) -> SourceInfo:
    raw = raw_payload.strip() if raw_payload else None
    definition = PAYLOAD_CATALOG.get(normalize_payload(raw) or "")
    if definition is not None:
        return _source_from_catalog(raw, definition)

    tokens = _tokens(raw)
    source_type = _source_type(tokens)
    if source_type == "unknown":
        source_type = "direct"
    cta_type = _cta_type(tokens)
    content_id = _content_id(tokens)
    source_channel = _source_channel(tokens, source_type)
    cjm = _cjm(tokens, source_type, cta_type)
    post_slug = _post_slug(tokens, content_id, cta_type, source_type)

    return SourceInfo(
        raw_start_payload=raw,
        source_type=source_type,
        source_channel=source_channel,
        source=_source(source_type, source_channel),
        entry_surface=_entry_surface(source_type, source_channel),
        entry_mode=_entry_mode(source_type, cta_type, cjm),
        campaign=_campaign(tokens, content_id, cta_type, source_type),
        content_id=content_id,
        cta_type=cta_type,
        cjm=cjm,
        post_id=content_id if source_type == "channel" else "unknown",
        post_slug=post_slug,
        post_topic=_post_topic(post_slug),
    )


def _source_from_catalog(raw: str | None, definition: PayloadDefinition) -> SourceInfo:
    source_type: SourceType = (
        "channel"
        if definition.group == "private_channel"
        else "telegram"
        if definition.group == "andrey_main"
        else definition.group  # type: ignore[assignment]
    )
    source_channel: SourceChannel = "private_channel" if definition.group == "private_channel" else "unknown"
    if definition.group == "andrey_main":
        source_channel = "tg_post"
    elif definition.group == "youtube":
        if "description" in definition.payload:
            source_channel = "youtube_description"
        elif "pinned" in definition.payload:
            source_channel = "youtube_pinned"
        elif "comment" in definition.payload:
            source_channel = "youtube_comment"
        elif "qr" in definition.payload:
            source_channel = "youtube_qr"
    elif definition.group == "telegram":
        source_channel = "tgk" if "_tgk_" in definition.payload else "ztgk" if "_ztgk_" in definition.payload else "tg_post" if "_post_" in definition.payload else "direct"

    cta_type: CtaType = (definition.cta_type or _cta_type(_tokens(definition.payload)))  # type: ignore[assignment]
    cjm: Cjm
    if definition.entry_mode == "external_materials":
        cjm = "youtube_materials" if definition.group == "youtube" else "telegram_materials"
    elif definition.entry_mode == "external_diagnostic":
        cjm = "telegram_diagnostic"
    elif definition.entry_mode == "access_gate":
        cjm = "telegram_access"
    elif definition.entry_mode == "channel_materials":
        cjm = "channel_materials"
    elif definition.entry_mode == "channel_call":
        cjm = "channel_call"
    elif definition.entry_mode == "channel_want_vc":
        cjm = "channel_want_vc"
    elif definition.entry_mode == "direct_review_request":
        cjm = "direct"
    elif definition.entry_mode == "hermes_bottleneck":
        cjm = "hermes_bottleneck"
    elif definition.entry_mode == "webinar_registration":
        cjm = "webinar_registration"
    else:
        cjm = "channel_diagnostic"

    return SourceInfo(
        raw_start_payload=raw,
        source_type=source_type,
        source_channel=source_channel,
        source=definition.source or _source(source_type, source_channel),
        entry_surface=_entry_surface(source_type, source_channel),
        entry_mode=definition.entry_mode,  # type: ignore[arg-type]
        campaign=definition.campaign
        or _campaign(
            _tokens(definition.payload),
            definition.post_id or _content_id(_tokens(definition.payload)),
            cta_type,
            source_type,
        ),
        content_id=definition.post_id or _content_id(_tokens(definition.payload)),
        cta_type=cta_type,
        cjm=cjm,
        post_id=definition.post_id or ("unknown" if source_type != "channel" else _content_id(_tokens(definition.payload))),
        post_slug=definition.post_slug or "unknown",
        post_topic=definition.post_topic or _post_topic(definition.post_slug or "unknown"),
    )


def parse_text_trigger(text: str) -> SourceInfo | None:
    normalized = " ".join(text.strip().lower().split())
    if not normalized:
        return None

    if "доступ" in normalized:
        return SourceInfo(None, "telegram", "manual_text", "manual_text", "bot_text", "access_gate", "unknown", "unknown", "dostup", "telegram_access", "unknown", "unknown", "пост")
    if "стать ближе" in normalized:
        return SourceInfo(None, "telegram", "manual_text", "manual_text", "bot_text", "access_gate", "unknown", "unknown", "be_closer", "telegram_access", "unknown", "unknown", "пост")
    if "материал" in normalized:
        return SourceInfo(None, "direct", "manual_text", "manual_text", "bot_text", "direct_materials", "unknown", "unknown", "materials", "direct", "unknown", "unknown", "пост")
    if "разбор" in normalized or "созвон" in normalized:
        return SourceInfo(None, "direct", "manual_text", "manual_text", "bot_text", "direct_review_request", "unknown", "unknown", "call", "direct", "unknown", "unknown", "пост")
    return None
