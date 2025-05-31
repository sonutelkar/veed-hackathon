from fastapi import FastAPI
from pydantic import BaseModel, HttpUrl
import sieve

app = FastAPI()

class VideoRequest(BaseModel):
    video_url: HttpUrl
    prompt: str

@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}

@app.post("/summary-of-videos/")
async def summary_of_videos(video_request: VideoRequest):

    video = sieve.File(video_request.video_url)
    prompt = video_request.prompt
    start_time = 0
    end_time = -1
    backend = "sieve-fast"
    output_schema = [object, Object]

    ask = sieve.function.get("sieve/ask")
    output = ask.push(video, prompt, start_time, end_time, backend, output_schema)
    print('This is printing while a job is running in the background!')
    print(output.result())
    

