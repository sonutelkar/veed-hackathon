import os
import uuid
import requests
from moviepy import VideoFileClip, CompositeVideoClip
from moviepy.video.fx import Resize
from moviepy.audio.AudioClip import CompositeAudioClip
from supabase_utils import upload_to_supabase

TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)


def get_filename_from_url(url: str) -> str:
    return url.split("/")[-1].split("?")[0]


def download_video(url: str, filename: str) -> str:
    response = requests.get(url)
    if response.status_code != 200:
        raise ValueError(f"Failed to download video from {url}")
    path = os.path.join(TEMP_DIR, filename)
    with open(path, "wb") as f:
        f.write(response.content)
    return path


def overlay_videos_and_upload(background_url: str, overlay_url: str) -> str:
    background_filename = get_filename_from_url(background_url)
    overlay_filename = get_filename_from_url(overlay_url)
    
    output_filename = f"overlayed_{uuid.uuid4()}.mp4"
    output_path = os.path.join(TEMP_DIR, output_filename)

    background_path = download_video(background_url, background_filename)
    overlay_path = download_video(overlay_url, overlay_filename)

    with VideoFileClip(background_path) as background, VideoFileClip(overlay_path) as overlay_clip:
        bg_width, bg_height = background.size
        ov_width, ov_height = overlay_clip.size

        # Max allowable overlay dimensions
        max_width = bg_width * 0.25
        max_height = bg_height * 0.5

        # Maintain aspect ratio while fitting within max dimensions
        aspect_ratio = ov_width / ov_height

        if ov_width / max_width > ov_height / max_height:
            # Width is the limiting factor
            target_width = max_width
            target_height = target_width / aspect_ratio
        else:
            # Height is the limiting factor
            target_height = max_height
            target_width = target_height * aspect_ratio

        overlay_resized = overlay_clip.with_effects([
            Resize((int(target_width), int(target_height)))
        ])

        overlay = (
            overlay_resized
            .with_position((
                int(bg_width - target_width), 
                int(bg_height - target_height)
            ))
            .with_start(0)
            .with_duration(min(background.duration, overlay_clip.duration))
        )

        # Combine visuals
        final = CompositeVideoClip([background, overlay])
        
        # Mix audio tracks (only include if they exist)

        print("Background audio:", "Yes" if background.audio else "No")
        print("Overlay audio:", "Yes" if overlay_clip.audio else "No")
        
        audio_tracks = []
        if background.audio:
            audio_tracks.append(background.audio)
        if overlay.audio:
            audio_tracks.append(overlay.audio)

        if audio_tracks:
            final = final.with_audio(CompositeAudioClip(audio_tracks))

        final.write_videofile(output_path, codec="libx264", audio_codec="aac")

    public_url = upload_to_supabase(output_path, content_type="video/mp4")
    return public_url


# Example usage
if __name__ == "__main__":
    background_test_url = "https://vqgovjnvkxtkhuixookb.supabase.co/storage/v1/object/public/videos//SEV6-vPmc_ih9eXBArkhm_output.mp4"
    overlay_test_url = "https://vqgovjnvkxtkhuixookb.supabase.co/storage/v1/object/public/videos//tmptrxb7mw4.mp4-7d708a08-11eb-4452-9046-c3d2403ad904.mp4"

    try:
        result_url = overlay_videos_and_upload(background_test_url, overlay_test_url)
        print("Video uploaded to:", result_url)
    except Exception as e:
        print("Error:", str(e))