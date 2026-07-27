from __future__ import annotations

import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.types import BotCommand

from .config import load_settings, resolve_sqlite_path
from .handlers import create_router
from .reminders import run_webinar_reminder_worker
from .storage import VcStorage
from .webinar import webinar_is_configured


async def main() -> None:
    settings = load_settings()
    logging.basicConfig(
        level=logging.DEBUG if settings.debug else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        stream=sys.stdout,
    )

    storage = VcStorage(resolve_sqlite_path(settings), settings.timezone)
    await storage.connect()

    bot = Bot(token=settings.bot_token)
    if settings.set_bot_commands_on_start:
        await bot.set_my_commands(
            [
                BotCommand(command="start", description="Главное меню"),
                BotCommand(command="menu", description="Главное меню"),
                BotCommand(command="help", description="Помощь"),
            ]
        )
    dispatcher = Dispatcher()
    dispatcher.include_router(create_router(storage, settings))
    reminder_stop = asyncio.Event()
    reminder_task: asyncio.Task[None] | None = None
    if (
        settings.funnel_end_mode == "webinar"
        and settings.webinar_enabled
        and webinar_is_configured(settings)
    ):
        reminder_task = asyncio.create_task(
            run_webinar_reminder_worker(
                bot,
                storage,
                settings,
                reminder_stop,
            )
        )

    try:
        await dispatcher.start_polling(bot)
    finally:
        reminder_stop.set()
        if reminder_task is not None:
            await reminder_task
        await bot.session.close()
        await storage.close()


if __name__ == "__main__":
    asyncio.run(main())
