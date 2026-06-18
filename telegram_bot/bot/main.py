from __future__ import annotations

import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher

from .config import load_settings
from .db import create_session_factory, init_db
from .handlers import create_router
from .scheduler import reminder_loop
from .sheets_sync import GoogleSheetsSync


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        stream=sys.stdout,
    )

    settings = load_settings()
    engine, session_factory = create_session_factory(settings.database_url)
    await init_db(engine)

    bot = Bot(token=settings.bot_token)
    dispatcher = Dispatcher()
    sheets_sync = GoogleSheetsSync(settings)
    dispatcher.include_router(create_router(session_factory, settings, sheets_sync))

    task = asyncio.create_task(reminder_loop(bot, session_factory, settings))
    try:
        await dispatcher.start_polling(bot)
    finally:
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
        await bot.session.close()
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
