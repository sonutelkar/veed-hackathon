from supabase import create_client, Client
from dotenv import load_dotenv
import uuid
import os

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = "videos"


def upload_to_supabase(file_path: str, content_type: str = "image/png") -> str:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    filename = os.path.basename(file_path)

    # Generate unique filename
    if content_type == "image/png":
        unique_filename = f"{filename}-{uuid.uuid4()}.png"
    elif content_type == "audio/mpeg":
        unique_filename = f"{filename}-{uuid.uuid4()}.mp3"
    elif content_type == "video/mp4":
        unique_filename = f"{filename}-{uuid.uuid4()}.mp4"
    else:
        raise Exception(f"Unsupported content type: {content_type}")

    storage_path = f"{unique_filename}"

    with open(file_path, "rb") as f:
        res = supabase.storage.from_(SUPABASE_BUCKET).upload(
            storage_path,
            f,
            file_options={"content-type": content_type},
        )

    # Handle both object and dict responses
    error = getattr(res, "error", None)
    if error:
        print(f"Upload failed: {getattr(error, 'message', str(error))}")
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
        print("Could not determine public URL from response")
        raise Exception("Could not determine public URL from response")

    print(f"Uploaded to Supabase: {public_url}")
    return public_url
