import os
import asyncio
import fal_client
from dotenv import load_dotenv
import sys

# Load env vars once on import
load_dotenv()


async def generate_avatar_video(text_script: str) -> dict:
    handler = await fal_client.submit_async(
        "veed/avatars/text-to-video",
        arguments={
            "avatar_id": "emily_primary",
            "text": text_script
        },
    )

    # Optionally print logs
    async for event in handler.iter_events(with_logs=True):
        print(event)

    result = await handler.get()
    print(result)

    return result


if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    text_script = """
    Ever wondered how to get that flawless glow?
    Introducing our new skincare line, designed for real life.
    Step one: Cleanse with our gentle, nourishing formula.
    """

    try:
        loop.run_until_complete(generate_avatar_video(text_script))
    finally:
        loop.close()