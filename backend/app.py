import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

# Load environment variables (e.g., GROQ_API_KEY)
load_dotenv()

app = Flask(__name__, static_folder="../frontend", static_url_path="/")
# Enable CORS for all routes so our frontend can communicate with the backend
CORS(app)

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/recommend', methods=['POST'])
def recommend():
    api_key = os.environ.get("GROQ_API_KEY")
    try:
        groq_client = Groq(api_key=api_key)
    except Exception as e:
        return jsonify({"error": f"LLM client is not configured correctly on the server. Error: {e}"}), 500

    data = request.json
    mood = data.get('mood', '').strip()
    exclude_titles = data.get('exclude', [])

    if not mood:
        return jsonify({"error": "Mood is required."}), 400

    exclude_instruction = ""
    if exclude_titles:
        exclude_instruction = f"\n    CRITICAL: You MUST NOT recommend any of these titles because the user has already seen them: {', '.join(exclude_titles)}"

    prompt = f"""
    The user is currently feeling: "{mood}".{exclude_instruction}
    Recommend exactly 5 songs, 5 movies, and 5 web series that perfectly match this mood. 
    Make sure to include a diverse mix of BOTH Hollywood/Global content AND Bollywood/Indian content.
    Return ONLY a valid JSON object in the exact format shown below, with no markdown formatting like ```json and no extra text.

    {{
      "music": [
        {{"title": "Song Title 1", "artist": "Artist Name 1", "reason": "Short reason why it fits the mood"}},
        {{"title": "Song Title 2", "artist": "Artist Name 2", "reason": "Short reason why it fits the mood"}},
        {{"title": "Song Title 3", "artist": "Artist Name 3", "reason": "Short reason why it fits the mood"}},
        {{"title": "Song Title 4", "artist": "Artist Name 4", "reason": "Short reason why it fits the mood"}},
        {{"title": "Song Title 5", "artist": "Artist Name 5", "reason": "Short reason why it fits the mood"}}
      ],
      "movies": [
        {{"title": "Movie Title 1", "year": "Year", "reason": "Short reason why it fits the mood"}},
        {{"title": "Movie Title 2", "year": "Year", "reason": "Short reason why it fits the mood"}},
        {{"title": "Movie Title 3", "year": "Year", "reason": "Short reason why it fits the mood"}},
        {{"title": "Movie Title 4", "year": "Year", "reason": "Short reason why it fits the mood"}},
        {{"title": "Movie Title 5", "year": "Year", "reason": "Short reason why it fits the mood"}}
      ],
      "series": [
        {{"title": "Series Title 1", "platform": "Platform", "reason": "Short reason why it fits the mood"}},
        {{"title": "Series Title 2", "platform": "Platform", "reason": "Short reason why it fits the mood"}},
        {{"title": "Series Title 3", "platform": "Platform", "reason": "Short reason why it fits the mood"}},
        {{"title": "Series Title 4", "platform": "Platform", "reason": "Short reason why it fits the mood"}},
        {{"title": "Series Title 5", "platform": "Platform", "reason": "Short reason why it fits the mood"}}
      ]
    }}
    """

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful media recommendation assistant. You ONLY output valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
        )

        response_content = completion.choices[0].message.content.strip()
        
        # In case the model wrapped it in markdown code blocks by accident
        if response_content.startswith("```json"):
            response_content = response_content[7:]
        if response_content.startswith("```"):
            response_content = response_content[3:]
        if response_content.endswith("```"):
            response_content = response_content[:-3]
            
        recommendations = json.loads(response_content.strip())
        return jsonify(recommendations)

    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error: {e}\nResponse Content: {response_content}")
        return jsonify({"error": "Failed to parse recommendations from the LLM."}), 500
    except Exception as e:
        print(f"LLM Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
