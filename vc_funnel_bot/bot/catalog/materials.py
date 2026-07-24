from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class MaterialDefinition:
    material_key: str
    title: str
    body: str | None = None
    url: str | None = None
    env_url_name: str | None = None
    env_title_name: str | None = None


MATERIAL_CATALOG = {
    "hermes_find_business_guide": MaterialDefinition(
        material_key="hermes_find_business_guide",
        title="Кому предложить Hermes-аудит",
    ),
    "hermes_offer_pack": MaterialDefinition(
        material_key="hermes_offer_pack",
        title="Оффер для бизнеса",
    ),
    "hermes_audit_kit": MaterialDefinition(
        material_key="hermes_audit_kit",
        title="Комплект Hermes-аудита",
    ),
    "hermes_result_to_deal": MaterialDefinition(
        material_key="hermes_result_to_deal",
        title="От отчёта к сделке и РКО",
    ),
    "hermes_audit_prompt": MaterialDefinition(
        material_key="hermes_audit_prompt",
        title="Промпт для Hermes-аудита",
    ),
    "hermes_audit_workbook": MaterialDefinition(
        material_key="hermes_audit_workbook",
        title="Рабочая книга Hermes-аудита",
    ),
    "hermes_outreach_templates": MaterialDefinition(
        material_key="hermes_outreach_templates",
        title="Шаблоны первого контакта",
    ),
    "hermes_presentation_script": MaterialDefinition(
        material_key="hermes_presentation_script",
        title="Сценарий презентации результата",
    ),
    "hermes_setup_windows_video": MaterialDefinition(
        material_key="hermes_setup_windows_video",
        title="Установка Hermes на Windows",
    ),
    "hermes_setup_macos_video": MaterialDefinition(
        material_key="hermes_setup_macos_video",
        title="Установка Hermes на macOS",
    ),
    "hermes_model_connection_video": MaterialDefinition(
        material_key="hermes_model_connection_video",
        title="Подключение модели или подписки",
    ),
    "hermes_full_playbook": MaterialDefinition(
        material_key="hermes_full_playbook",
        title="Полная инструкция по всей связке",
    ),
    "am_p01_video": MaterialDefinition(
        material_key="am_p01_video",
        title="Основное видео: как работает ИИ-связка",
    ),
    "am_p02_map": MaterialDefinition(
        material_key="am_p02_map",
        title="Схема ИИ-связки",
    ),
    "am_p03_demo": MaterialDefinition(
        material_key="am_p03_demo",
        title="Демонстрация готовой ИИ-связки",
    ),
    "am_p04_route": MaterialDefinition(
        material_key="am_p04_route",
        title="Персональный маршрут ИИ-связки",
    ),
    "am_p05_apply": MaterialDefinition(
        material_key="am_p05_apply",
        title="Заявка на сборку ИИ-связки",
    ),
    "andrey_video_0704": MaterialDefinition(
        material_key="andrey_video_0704",
        title="Материалы к ролику Андрея",
        body="Связка: как заходить к бизнесу через полезный инструмент.",
        env_url_name="VC_YOUTUBE_MATERIALS_URL",
        env_title_name="VC_MATERIALS_TITLE",
    ),
    "tg_post_0704_materials": MaterialDefinition(
        material_key="tg_post_0704_materials",
        title="Материалы к Telegram-посту",
        body="Связка из поста и следующие шаги.",
        env_url_name="VC_TELEGRAM_MATERIALS_URL",
        env_title_name="VC_MATERIALS_TITLE",
    ),
    "agent_lost_leads": MaterialDefinition(
        material_key="agent_lost_leads",
        title="Схема агента по потерянным заявкам",
        body="Как агент помогает увидеть лидов без ответа, потерянные заявки и следующий шаг.",
        env_url_name="VC_MATERIALS_URL",
    ),
}
