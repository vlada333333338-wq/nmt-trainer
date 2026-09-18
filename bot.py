# bot.py — мінімальний бот, який відкриває Mini App.
#
# Уся гра живе у веб-сторінці (папка вище), тож боту тут майже нічого робити:
# він лише показує кнопку «Відкрити тренажер».
#
# Якщо не хочеш узагалі тримати цей код запущеним — можна обійтися без нього:
# у @BotFather → Bot Settings → Menu Button → вказати адресу Mini App.
# Тоді кнопка з'явиться в боті сама, і жоден процес крутитися не мусить.

import os
import asyncio
import logging

from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()
TOKEN = os.getenv("BOT_TOKEN")
# Адреса, де лежить index.html. Обов'язково https:// — Telegram інших не відкриває.
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://USERNAME.github.io/nmt-trainer/")

if not TOKEN:
    raise RuntimeError("Не задано BOT_TOKEN — додай його у файл .env")

bot = Bot(token=TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    builder = InlineKeyboardBuilder()
    builder.button(text="🎓 Відкрити тренажер", web_app=WebAppInfo(url=WEBAPP_URL))
    builder.adjust(1)

    await message.answer(
        "Привіт! Це тренажер для підготовки до НМТ.\n\n"
        "Усередині — наголоси, фразеологізми та дати з історії України.\n"
        "Тисни кнопку нижче 👇",
        reply_markup=builder.as_markup()
    )


@dp.errors()
async def on_error(event):
    logger.exception("Помилка при обробці апдейта", exc_info=event.exception)
    return True


async def main():
    logger.info("Бот запущено. Mini App: %s", WEBAPP_URL)
    while True:
        try:
            await dp.start_polling(bot)
            break
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Polling впав, перезапуск через 5 секунд")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
