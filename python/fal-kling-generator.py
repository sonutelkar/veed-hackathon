import asyncio
import fal_client

async def subscribe():
    handler = await fal_client.submit_async(
        "fal-ai/kling-video/v1.6/standard/elements",
        arguments={
            "prompt": "A cute girl and a baby cow sleeping together on a bed",
            "input_image_urls": ["https://storage.googleapis.com/falserverless/web-examples/kling-elements/first_image.jpeg", "https://storage.googleapis.com/falserverless/web-examples/kling-elements/second_image.png"]
        },
    )

    async for event in handler.iter_events(with_logs=True):
        print(event)

    result = await handler.get()

    print(result)


if __name__ == "__main__":
    asyncio.run(subscribe())