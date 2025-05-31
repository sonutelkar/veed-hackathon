import asyncio
import fal_client
import uuid


async def generate_kling_video(prompt, image_url_1):
    try:
        handler = await fal_client.submit_async(
            "fal-ai/kling-video/v1.6/standard/elements",
            arguments={
                "prompt": prompt,
                "input_image_urls": [image_url_1]
            },
        )

        # Get the initial response
        result = await handler.get()
        return result

    except Exception as e:
        raise Exception(f"Error generating Kling video: {str(e)}")


# Example function to demonstrate usage
async def example_kling_generation():
    result = await generate_kling_video(
        "A cute girl and a baby cow sleeping together on a bed",
        "https://storage.googleapis.com/falserverless/web-examples/kling-elements/first_image.jpeg",
    )
    print(result)


# Stitching function
async def generate_ffmpeg_comp(scene_urls: list):
    track_id = str(uuid.uuid4())
    keyframes = []

    for index, url in enumerate(scene_urls):
        keyframes.append({
            "timestamp": str(index * 5000),  # in milliseconds
            "duration": "5000",              # fixed 5 seconds per scene
            "url": url
        })

    handler = await fal_client.submit_async(
        "fal-ai/ffmpeg-api/compose",
        arguments={
            "tracks": [{
                "id": track_id,
                "type": "video",
                "keyframes": keyframes
            }]
        },
    )

    async for event in handler.iter_events(with_logs=True):
        print(event)

    result = await handler.get()
    print(result)
    return result


if __name__ == "__main__":
    # asyncio.run(example_kling_generation())

    scene_urls = [
        "https://example.com/video1.mp4",
        "https://example.com/video2.mp4",
        "https://example.com/video3.mp4",
    ]

    # asyncio.run(generate_ffmpeg_comp(scene_urls))