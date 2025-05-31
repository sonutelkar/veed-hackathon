import os
import requests
import sieve
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv
import subprocess
import shutil
from supabase_utils import upload_to_supabase

# Load environment variables
load_dotenv()


def convert_mov_to_mp4(input_path: str) -> str:
    output_path = input_path.replace(".mov", ".mp4")
    print(f"[DEBUG] Starting conversion from MOV to MP4")
    print(f"[DEBUG] Input path: {input_path}")
    print(f"[DEBUG] Output path: {output_path}")

    try:
        result = subprocess.run([
            "ffmpeg", "-y",  # Overwrite output if it exists
            "-i", input_path,
            "-vcodec", "libx264",
            "-acodec", "aac",
            output_path
        ], check=True, capture_output=True, text=True)

        print(f"[DEBUG] ffmpeg stdout:\n{result.stdout}")
        print(f"[DEBUG] ffmpeg stderr:\n{result.stderr}")
        print(f"[DEBUG] Conversion successful. Output saved at: {output_path}")

    except subprocess.CalledProcessError as e:
        print(f"[ERROR] ffmpeg conversion failed with return code {e.returncode}")
        print(f"[ERROR] ffmpeg stdout:\n{e.stdout}")
        print(f"[ERROR] ffmpeg stderr:\n{e.stderr}")
        raise

    return output_path


def remove_background_from_supabase_url(image_url: str) -> str:
    print(f"Removing background from image URL: {image_url}")  # Debug print
    response = requests.get(image_url)
    response.raise_for_status()

    with NamedTemporaryFile(delete=False, suffix=".png") as input_tmp:
        input_tmp.write(response.content)
        input_path = input_tmp.name
        print(f"Temporary input file created: {input_path}")  # Debug print

    try:
        bgr_fn = sieve.function.get("sieve/background-removal")
        input_image = sieve.File(path=input_path)
        output_file = next(bgr_fn.run(input_file=input_image, background_color_rgb= "-1"))

        # Copy Sieve's output to a properly named .png temp file
        with NamedTemporaryFile(delete=False, suffix=".png") as final_output:
            shutil.copy(output_file.path, final_output.name)
            final_output_path = final_output.name
            print(f"Final output file created: {final_output_path}")  # Debug print

        # Upload to Supabase
        public_url = upload_to_supabase(final_output_path)
        return public_url

    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
            print(f"Removed temporary input file: {input_path}")  # Debug print
        if 'output_file' in locals() and os.path.exists(output_file.path):
            os.remove(output_file.path)
            print(f"Removed output file: {output_file.path}")  # Debug print
        if 'final_output_path' in locals() and os.path.exists(final_output_path):
            os.remove(final_output_path)
            print(f"Removed final output file: {final_output_path}")  # Debug print


def remove_background_from_video_url(video_url: str) -> str:
    print(f"Removing background from video URL: {video_url}")  # Debug print
    response = requests.get(video_url)
    response.raise_for_status()

    with NamedTemporaryFile(delete=False, suffix=".mp4") as input_tmp:
        input_tmp.write(response.content)
        input_path = input_tmp.name
        print(f"Temporary input file created: {input_path}")  # Debug print

    try:
        # Initialize the Sieve background removal function
        background_removal = sieve.function.get("sieve/background-removal")

        # Prepare the input file for Sieve
        input_file = sieve.File(path=input_path)

        # Set parameters for background removal
        backend = "parallax"
        background_color_rgb = "-1"  # Transparent background
        background_media = sieve.File(url="")  # Optional: provide a background media URL
        output_type = "masked_frame"
        video_output_format = "mp4"
        yield_output_batches = False
        start_frame = 0
        end_frame = -1
        # vanish_allow_scene_splitting = True

        # Run the background removal process
        output = background_removal.push(
            input_file,
            backend,
            background_color_rgb,
            background_media,
            output_type,
            video_output_format,
            yield_output_batches,
            start_frame,
            end_frame
            # vanish_allow_scene_splitting
        )

        print('Processing video in the background...')

        for output_object in output.result():
            print(output_object, output_object.path)
            processed_video_path = output_object.path
            print(f"Processed video saved at: {processed_video_path}")
            
            size_mb = os.path.getsize(processed_video_path) / 1024 / 1024
            print(f"[DEBUG] Final video file size: {size_mb:.2f} MB")

            # Convert if it's .mov
            if processed_video_path.lower().endswith(".mov"):
                print(f"Video is .mov file format")
                processed_video_path = convert_mov_to_mp4(processed_video_path)

            print(f"Ready to upload...")
            public_url = upload_to_supabase(processed_video_path, content_type="video/mp4")
            print(f"Uploaded processed video to Supabase: {public_url}")
            return public_url
        
    except Exception as e:
        print("Error:", e)

    # finally:
    #     # Clean up temporary files
    #     if os.path.exists(input_path):
    #         os.remove(input_path)
    #         print(f"Removed temporary input file: {input_path}")  # Debug print


if __name__ == "__main__":
    supabase_image_url = "https://vqgovjnvkxtkhuixookb.supabase.co/storage/v1/object/public/videos/b6cfdf23-314c-42a0-865a-fbc6159f6c54/7ae56038-9555-4232-a6c5-136e0d1952fb-image-asset.jpeg"
    video_url = "https://v3.fal.media/files/monkey/ZF4I_LbXueILl05SjAKV2_tmpkk6ff5v3.mp4"

    try:
        # result_url = remove_background_from_video_url(video_url)
        # print("Final Public URL:", result_url)
        convert_mov_to_mp4(input_path="test.mov")
    except Exception as e:
        print("Error:", e)
