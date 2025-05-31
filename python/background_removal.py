import os
import uuid
import requests
import sieve
from tempfile import NamedTemporaryFile
from supabase import create_client, Client
from dotenv import load_dotenv
import shutil

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = "videos"


def upload_to_supabase(file_path: str) -> str:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    filename = os.path.basename(file_path)
    unique_filename = f"{filename}-{uuid.uuid4()}.png"
    storage_path = f"{unique_filename}"

    with open(file_path, "rb") as f:
        res = supabase.storage.from_(SUPABASE_BUCKET).upload(
            storage_path,
            f,
            file_options={"content-type": "image/png"}
        )

    # Handle both object and dict responses
    error = getattr(res, "error", None)
    if error:
        raise Exception(f"Upload failed: {getattr(error, 'message', str(error))}")

    # Get public URL
    public_url_response = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(storage_path)

    # Handle different response types safely
    if isinstance(public_url_response, str):
        public_url = public_url_response
    elif hasattr(public_url_response, "public_url"):
        public_url = public_url_response.public_url
    elif isinstance(public_url_response, dict):
        public_url = public_url_response.get("publicUrl")
    else:
        raise Exception("Could not determine public URL from response")

    print(f"Uploaded to Supabase: {public_url}")
    return public_url


def remove_background_from_supabase_url(image_url: str) -> str:
    response = requests.get(image_url)
    response.raise_for_status()

    with NamedTemporaryFile(delete=False, suffix=".png") as input_tmp:
        input_tmp.write(response.content)
        input_path = input_tmp.name

    try:
        bgr_fn = sieve.function.get("sieve/background-removal")
        input_image = sieve.File(path=input_path)
        output_file = next(bgr_fn.run(input_file=input_image))

        # Copy Sieve's output to a properly named .png temp file
        with NamedTemporaryFile(delete=False, suffix=".png") as final_output:
            shutil.copy(output_file.path, final_output.name)
            final_output_path = final_output.name

        # Upload to Supabase
        public_url = upload_to_supabase(final_output_path)
        return public_url

    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
        if 'output_file' in locals() and os.path.exists(output_file.path):
            os.remove(output_file.path)
        if 'final_output_path' in locals() and os.path.exists(final_output_path):
            os.remove(final_output_path)


if __name__ == "__main__":
    supabase_image_url = "https://vqgovjnvkxtkhuixookb.supabase.co/storage/v1/object/public/videos/b6cfdf23-314c-42a0-865a-fbc6159f6c54/7ae56038-9555-4232-a6c5-136e0d1952fb-image-asset.jpeg"

    try:
        result_url = remove_background_from_supabase_url(supabase_image_url)
        print("Final Public URL:", result_url)
    except Exception as e:
        print("Error:", e)
