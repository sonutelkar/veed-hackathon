import asyncio
import fal_client

async def generate_kling_video(prompt, image_url_1):
    try:
        handler = await fal_client.submit_async(
            "fal-ai/kling-video/v1.6/standard/elements",
            arguments={
                "prompt": prompt,
                "input_image_urls": [image_url_1, image_url_2]
            },
        )

        # Get the initial response
        result = await handler.get()
        return result

    except Exception as e:
        raise Exception(f"Error generating Kling video: {str(e)}")

# Example function to demonstrate usage
async def example_generation():
    result = await generate_kling_video(
        "A cute girl and a baby cow sleeping together on a bed",
        "https://storage.googleapis.com/falserverless/web-examples/kling-elements/first_image.jpeg",
    )
    print(result)

if __name__ == "__main__":
    asyncio.run(example_generation())