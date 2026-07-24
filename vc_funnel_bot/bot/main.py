from __future__ import annotations

import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.types import BotCommand

from .config import load_settings, resolve_sqlite_path
from .handlers import create_router
from .storage import VcStorage


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

    try:
        await dispatcher.start_polling(bot)
    finally:
        await bot.session.close()
        await storage.close()


if __name__ == "__main__":
    asyncio.run(main())
