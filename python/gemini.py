from google import genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

# Define the response schema using Pydantic
class PetStoryline(BaseModel):
    scene1: str
    scene2: str
    scene3: str
    scene4: str

# Initialize the Gemini client
client = genai.Client(api_key=GOOGLE_API_KEY)

def create_pet_scenes(user_prompt: str):
    try:
        # Define the prompt
        prompt = (
            "You are a master storyteller. I have a user prompt that a user wants to integrate into scenes of the story. "
            "Use the user prompt to create an adventure storyline in four scenes. "
            "Turn this storyline into a cohesive and engaging narrative about the pet's adventures. "
            "Don't use names, limit each scene to 10 words."
            "Don't use more than one adjective in each scene."
            "Make the scenes suited for a text to video model prompts which can use and generate videos."
            "Here is the user prompt:\n"
            f"{user_prompt}\n"
            "Now, provide the storyline divided into four scenes."
        )

        # Generate the storyline using the model instance from the client
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": PetStoryline
            }
        )

        # Access the structured response
        return response.parsed

    except Exception as e:
        print(f"An error occurred: {e}")
        return None


def create_pet_script(video_summaries, scenes):
    try:
        model = "gemini-2.0-flash"
        client = genai.Client(api_key=GOOGLE_API_KEY)

        # Combine the summaries into a single prompt for the model
        combined_summaries = "\n".join([f"- {summary}" for summary in video_summaries])
        # combined_scenes = "\n".join([f"Scene {scenes.index(scene) + 1}: {scene}" for scene in scenes])
        prompt = (
            "You are a master script writer for narration. I have a series of video summaries and scene descriptions about a person's pet. "
            "Turn these summaries into a cohesive and engaging storyline about the pet's adventures. "
            "Here are the video summaries:\n"
            f"{combined_summaries}"
            "Here are the scenes:\n"
            f"{scenes}"
            "Now, only give me the script for narration per scene (each scene must only be 10 words):"
        )

        # Generate the storyline using the model instance from the client

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": PetStoryline
            }
        )

        # Access the structured response
        return response.parsed

    except Exception as e:
        print(f"An error occurred: {e}")
        return None


if __name__ == "__main__":
    # Example usage:
    user_prompt = "Story where the cat saves a dog from a lion and then marries dog after"

    story = create_pet_scenes(user_prompt)

    if story:
        print("Here are the Scenes:")
        print(story)
    else:
        print("Could not generate a scenes")
