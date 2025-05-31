import os
import uuid
import requests
from moviepy.editor import VideoFileClip, CompositeVideoClip
from supabase_utils import upload_to_supabase

TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)


def download_video(url: str, filename: str) -> str:
    response = requests.get(url)
    if response.status_code != 200:
        raise ValueError(f"Failed to download video from {url}")
    path = os.path.join(TEMP_DIR, filename)
    with open(path, "wb") as f:
        f.write(response.content)
    return path


def overlay_videos_and_upload(background_url: str, overlay_url: str) -> str:
    # Generate temp file names
    background_filename = f"{uuid.uuid4()}_background.mp4"
    overlay_filename = f"{uuid.uuid4()}_overlay.mp4"
    output_filename = f"{uuid.uuid4()}_output.mp4"
    output_path = os.path.join(TEMP_DIR, output_filename)

    # Download both videos
    background_path = download_video(background_url, background_filename)
    overlay_path = download_video(overlay_url, overlay_filename)

    # Load videos
    background = VideoFileClip(background_path)

    # Get dimensions
    print(background.size)
    bg_width, bg_height = background.size
    overlay_width, overlay_height = bg_width // 2, bg_height // 2

    # Resize and position overlay in bottom-right quadrant
    overlay = (
        VideoFileClip(overlay_path)
        .resize((overlay_width, overlay_height))
        .set_position((bg_width - overlay_width, bg_height - overlay_height))
        .set_start(0)
        .set_duration(background.duration)
    )

    # Create final composite
    final = CompositeVideoClip([background, overlay])
    final.write_videofile(output_path, codec="libx264", audio_codec="aac")

    # Upload final video to Supabase
    public_url = upload_to_supabase(output_path, content_type="video/mp4")

    return public_url


# Testing
if __name__ == "__main__":
    background_test_url = "https://your-supabase-url/storage/v1/object/public/videos/background.mp4"
    overlay_test_url = "https://your-supabase-url/storage/v1/object/public/videos/overlay.mp4"

    try:
        result_url = overlay_videos_and_upload(background_test_url, overlay_test_url)
        print("Video uploaded to:", result_url)
    except Exception as e:
        print("Error:", str(e))