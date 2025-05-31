from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sieve
from dotenv import load_dotenv
import asyncio

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

class VideoRequest(BaseModel):
    video_url: str 
    prompt: str

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
    

