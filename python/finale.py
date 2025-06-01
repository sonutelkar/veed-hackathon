import os
import uuid
import requests
import sieve
from tempfile import NamedTemporaryFile
from moviepy import VideoFileClip, CompositeVideoClip
from moviepy.audio.io.AudioFileClip import AudioFileClip
from moviepy.audio.AudioClip import CompositeAudioClip
from moviepy.video.fx.Resize import Resize
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


def scout_video_search_audio(clip_length: float) -> str:
    query = "instrumental background music with no voiceover"
    print(f"Searching videos on Scout with query: '{query}'")

    try:
        scout_search = sieve.function.get("sieve/scout-search")

        # Search parameters
        num_results = 1
        format_results = "raw_video_480p"
        return_metadata = []
        min_relevance_score = 0.7
        aspect_ratio = []
        only_creative_commons = False
        exclude_black_bar = True
        exclude_static = True
        exclude_overlay = True
        min_quality_score = 0.5
        max_quality_score = 1
        min_video_width = 0
        max_video_width = -1
        min_video_height = 0
        max_video_height = -1
        min_motion_score = 0
        max_motion_score = 0.3
        min_duration = clip_length - 1
        max_duration = clip_length + 1

        # Push search
        output = scout_search.push(
            query,
            num_results,
            format_results,
            return_metadata,
            min_relevance_score,
            aspect_ratio,
            only_creative_commons,
            exclude_black_bar,
            exclude_static,
            exclude_overlay,
            min_quality_score,
            max_quality_score,
            min_video_width,
            max_video_width,
            min_video_height,
            max_video_height,
            min_motion_score,
            max_motion_score,
            min_duration,
            max_duration
        )

        print("Processing scout search in the background...")
        print(output.result())

        for output_object in output.result():
            print("Scout search result:", output_object)

            raw_video_file, metadata = output_object
            video_url = raw_video_file.path
            print(f"Video path: {video_url}")

            # Extract audio and save as mp3
            with VideoFileClip(video_url) as clip:
                audio_path = video_url.replace(".mp4", ".mp3")
                clip.audio.write_audiofile(audio_path, logger=None)
                print(f"Extracted audio saved at: {audio_path}")

            return audio_path

    except Exception as e:
        print("Error during scout search or audio extraction:", e)
        return ""


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
        print(f"Clip duration: {final.duration}")

        # Collect audio tracks
        audio_tracks = []
        if background.audio:
            audio_tracks.append(background.audio)
        if overlay.audio:
            audio_tracks.append(overlay.audio)

        # Add background music
        music_path = scout_video_search_audio(final.duration)

        if music_path and os.path.exists(music_path):
            music_audio = AudioFileClip(music_path)
            audio_tracks.append(music_audio)

        if audio_tracks:
            print(audio_tracks)
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