from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
import sieve
import gemini
import fal_client
from fal import generate_kling_video, generate_ffmpeg_comp
import background_removal
from elevenlabs.client import ElevenLabs
from fastapi.middleware.cors import CORSMiddleware
from tts import tts_from_script
from veed import generate_avatar_video, lip_sync_video_audio
from fal_kling_duet import generate_kling_duet_video
from finale import overlay_videos_and_upload
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class SceneRequest(BaseModel):
    prompt: str

class VideoRequest(BaseModel):
    video_url: str
    prompt: str

class SceneStitchRequest(BaseModel):
    scenes: list[str]

class ScriptRequest(BaseModel):
    video_summaries: list[str]
    scenes: dict[str, str]

class BackgroundRemovalRequest(BaseModel):
    image_url: str

class KlingRequest(BaseModel):
    prompt: str
    image_url_1: str

class MultiKlingRequest(BaseModel):
    prompts: list[str]
    image_url: str

class TTSRequest(BaseModel):
    text: str

class AvatarRequest(BaseModel):
    audio_url: str

class VideoAudioRequest(BaseModel):
    video_url: str
    audio_url: str

class KlingDuetRequest(BaseModel):
    prompt: str
    image_url_1: str
    image_url_2: str

class VideoOverlayRequest(BaseModel):
    background_url: str
    overlay_url: str


@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}


@app.post("/generate-scenes/")
async def generate_storyline(scene_request: SceneRequest):

    try:
        scenes = gemini.create_pet_scenes(scene_request.prompt)

        return {"scenes": scenes}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    

@app.post("/generate-script/")
async def generate_storyline(scene_request: ScriptRequest):

    try:
        video_summaries = scene_request.video_summaries
        scenes = scene_request.scenes
        script = gemini.create_pet_script(video_summaries, scenes)

        return {"script": script}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def generate_kling_video(prompt, image_url):
    try:
        handler = await fal_client.submit_async(
            "fal-ai/kling-video/v1.6/standard/elements",
            arguments={
                "prompt": prompt,
                "input_image_urls": [image_url, image_url]  # Using the same image twice
            },
        )
        result = await handler.get()
        return result
    except Exception as e:
        raise Exception(f"Error generating Kling video: {str(e)}")


@app.post("/generate-kling-video/")
async def kling_video_endpoint(kling_request: KlingRequest):
    try:
        result = await generate_kling_video(
            kling_request.prompt,
            kling_request.image_url_1
        )
        
        return {
            "status": "processing",
            "result": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-multiple-kling-videos/")
async def generate_multiple_videos(request: MultiKlingRequest):
    try:
        # Create a list of tasks for concurrent execution
        tasks = [
            generate_kling_video(prompt, request.image_url)
            for prompt in request.prompts
        ]
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle any exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "prompt": request.prompts[i],
                    "status": "error",
                    "error": str(result)
                })
            else:
                processed_results.append({
                    "prompt": request.prompts[i],
                    "status": "processing",
                    "result": result
                })
        
        return {
            "status": "processing",
            "results": processed_results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/remove-background/")
async def remove_background(request: BackgroundRemovalRequest):
    try:
        result_url = background_removal.remove_background_from_supabase_url(request.image_url)
        return {"background_removed_url": result_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tts-from-script/")
async def generate_tts_from_script(request: TTSRequest):
    try:

        audio_path = tts_from_script(request.text)

        return {"audio_path": audio_path}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-avatar-video/")
async def avatar_video(request: AvatarRequest):
    try:
        lip_sync_result = await generate_avatar_video(request.audio_url)
        result = background_removal.remove_background_from_video_url(lip_sync_result["video"]["url"])

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# @app.post("/lip-sync-video-audio/")
# async def lip_sync(request: VideoAudioRequest):
#     try:
#         result = await lip_sync_video_audio(request.video_url, request.audio_url)
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     

@app.post("/stitch-scenes/")
async def stitch_scenes(request: SceneStitchRequest):
    try:
        result = await generate_ffmpeg_comp(request.scenes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-kling-duet/")
async def kling_duet(request: KlingDuetRequest):
    try:
        result = await generate_kling_duet_video(request.prompt, request.image_url_1, request.image_url_2)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/remove-background-video/")
async def remove_background(request: BackgroundRemovalRequest):
    try:
        result_url = background_removal.remove_background_from_video_url(request.url)
        return {"background_removed_url": result_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/final-overlay")
async def overlay_video_endpoint(req: VideoOverlayRequest):
    try:
        video_url = overlay_videos_and_upload(req.background_url, req.overlay_url)
        return {"status": "success", "video_url": video_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))