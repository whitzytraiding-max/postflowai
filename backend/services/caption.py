import os
from dotenv import load_dotenv
load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_KEY = os.getenv("GROQ_API_KEY", "")

PROMPT_TEMPLATE = """You are a social media manager. Write an engaging caption for this video.
Video title: {title}
Topic/tag: {tag}
Platform: {platform}

Rules:
- Max 150 words
- Include 5-8 relevant hashtags at the end
- Engaging hook in the first line
- No emojis unless they fit naturally
- Do not mention you are an AI

Caption:"""


def generate_caption(title: str, tag: str, platform: str) -> str:
    prompt = PROMPT_TEMPLATE.format(title=title, tag=tag, platform=platform)

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
