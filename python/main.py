from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sieve
from dotenv import load_dotenv
import asyncio
import gemini
from fal_kling_generator import generate_kling_video

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

class VideoRequest(BaseModel):
    video_url: str 
    prompt: str

class StorylineRequest(BaseModel):
    video_summaries: list[str]

class KlingRequest(BaseModel):
    prompt: str
    image_url_1: str
    image_url_2: str

@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}


@app.post("/summary-of-videos/")
async def summary_of_videos(video_request: VideoRequest):

    try:
        video = sieve.File(url=video_request.video_url)
        prompt = video_request.prompt
        start_time = 0
        end_time = -1
        backend = "sieve-fast"

        ask = sieve.function.get("sieve/ask")
        output = ask.push(
            video,
            prompt,
            start_time,
            end_time,
            backend
        )
        print('This is printing while a job is running in the background!')
        print(output.result())

    # Run the blocking output.result() in a separate thread
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, output.result)

        return {"summary": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/generate-storyline/")
async def generate_storyline(storyline_request: StorylineRequest):

    try:
        video_summaries = storyline_request.video_summaries
        storyline = gemini.create_pet_storyline(video_summaries)

        return {"storyline": storyline}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-kling-video/")
async def kling_video_endpoint(kling_request: KlingRequest):
    try:
        result = await generate_kling_video(
            kling_request.prompt,
            kling_request.image_url_1,
            kling_request.image_url_2
        )
        
        return {
            "status": "processing",
            "result": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))