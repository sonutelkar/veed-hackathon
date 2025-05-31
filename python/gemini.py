from google import genai
import os

def create_pet_storyline(video_summaries):
    try:
        client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
        model = client.models.GenerativeModel("gemini-2.0-flash")

        # Combine the summaries into a single prompt for the model
        combined_summaries = "\n".join([f"- {summary}" for summary in video_summaries])
        prompt = (
            "You are a master storyteller. I have a series of video summaries about a person's pet. "
            "Turn these summaries into a cohesive and engaging storyline about the pet's adventures or daily life. "
            "Here are the video summaries:\n"
            f"{combined_summaries}"
            "Now, give me the storyline:"
        )

        # Generate the storyline using the model instance from the client
        response = model.generate_content(prompt)

        return response.text

    except Exception as e:
        print(f"An error occurred: {e}")
        return None

if __name__ == "__main__":
    # Example usage:
    pet_video_summaries = [
        "Fluffy the cat chases a laser pointer all over the living room, showing off impressive acrobatics.",
        "Fluffy discovers a new favorite napping spot in a sunbeam on the kitchen floor.",
        "Fluffy attempts to 'help' with laundry, batting at socks and getting tangled in a towel.",
        "Fluffy stares intently at a bird outside the window, chattering softly.",
        "Fluffy enjoys a vigorous scratching session on her favorite scratching post, then grooms herself meticulously."
    ]

    story = create_pet_storyline(pet_video_summaries)

    if story:
        print("Pet Storyline:")
        print(story)
    else:
        print("Could not generate a storyline.")