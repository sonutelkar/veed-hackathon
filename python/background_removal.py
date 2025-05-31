import os
import requests
import sieve
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv
import shutil
from supabase_utils import upload_to_supabase

# Load environment variables
load_dotenv()


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
        output_file = next(bgr_fn.run(input_file=input_image))

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


if __name__ == "__main__":
    supabase_image_url = "https://vqgovjnvkxtkhuixookb.supabase.co/storage/v1/object/public/videos/b6cfdf23-314c-42a0-865a-fbc6159f6c54/7ae56038-9555-4232-a6c5-136e0d1952fb-image-asset.jpeg"

    try:
        result_url = remove_background_from_supabase_url(supabase_image_url)
        print("Final Public URL:", result_url)
    except Exception as e:
        print("Error:", e)
