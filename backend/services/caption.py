import os
import random
from dotenv import load_dotenv
load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_KEY = os.getenv("GROQ_API_KEY", "")

_STYLES = [
    ("short punchy caption (under 60 words)", "3-5"),
    ("conversational caption (80-120 words)", "5-7"),
    ("storytelling caption that draws the viewer in (100-150 words)", "6-8"),
    ("question-based caption that invites comments (under 80 words)", "4-6"),
]

PROMPT_TEMPLATE = """You are a social media manager. Write an engaging {style} for this video.
Video title: {title}
Topic/tag: {tag}
Platform: {platform}

Rules:
- Include {hashtags} relevant hashtags at the end
- Engaging hook in the first line
- No emojis unless they fit naturally
- Do not mention you are an AI

Caption:"""


def generate_caption(title: str, tag: str, platform: str) -> str:
    style, hashtags = random.choice(_STYLES)
    prompt = PROMPT_TEMPLATE.format(title=title, tag=tag, platform=platform, style=style, hashtags=hashtags)

    # Try Gemini
    if GEMINI_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[Caption] Gemini failed: {e}")

    # Try Groq
    if GROQ_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=GROQ_KEY)
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Caption] Groq failed: {e}")

    # Fallback: basic caption
    return f"{title}\n\n{tag} #viral #trending #repost"
