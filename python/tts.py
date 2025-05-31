from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
import os
from tempfile import NamedTemporaryFile
from supabase_utils import upload_to_supabase

load_dotenv()

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    raise ValueError("❌ ELEVENLABS_API_KEY not set in environment!")

# Initialize ElevenLabs client
elevenlabs = ElevenLabs(api_key=ELEVENLABS_API_KEY)


def generate_tts_from_script(script):
    try:
        # Generate the audio as a stream of chunks (generator)
        audio_generator = elevenlabs.text_to_speech.convert(
            text=script,
            voice_id="sIsyDvq54C8vCgtvpJac",
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
        )

        # Write the streamed chunks into a temp .mp3 file
        with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
            for chunk in audio_generator:
                tmp_file.write(chunk)
            audio_file_path = tmp_file.name

        print(f"✅ Audio file written at: {audio_file_path}")

        # Upload to Supabase (set correct audio MIME type)
        public_url = upload_to_supabase(audio_file_path, content_type="audio/mpeg")
        print(f"✅ Final Public URL: {public_url}")

        # Optional: Clean up temp file after upload
        os.remove(audio_file_path)

        return public_url

    except Exception as e:
        print("❌ Error:", e)
        return None


if __name__ == "__main__":
    script = "The quick brown fox jumps over the lazy dog."
    result_url = generate_tts_from_script(script)
    print("Final Public URL:", result_url)
