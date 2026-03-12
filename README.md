# 🌟 Mood-Based Entertainment Recommender

A stunning, dynamic web application that generates personalized, mood-based recommendations for Music, Movies, and TV Series using the Groq LLM API. 

## ✨ Features

- **🧠 AI-Powered Recommendations:** Analyzes your mood in real-time via the `llama-3.1-8b-instant` LLM to curate 5 highly specific pieces of media per category.
- **🎨 Premium Dynamic UI:** Built with sleek Glassmorphism, CSS neon gradients, and a Dark Mode palette. Includes 3D tilt hover effects, dynamic typewriter placeholders, and infinite scroll.
- **🖼️ Smart Thumbnails:** Implements a robust multi-API fallback strategy (TVMaze, iTunes, Wikipedia Search API) to beautifully render cover art for global and localized Bollywood content.
- **♾️ Infinite Scrolling:** Effortlessly discover more recommendations by simply scrolling to right on any genre slider. The app remembers what you've seen and automatically fetches completely entirely new, unique suggestions without reloading!

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+), FontAwesome Icons.
- **Backend:** Python, Flask, Flask-CORS.
- **AI Integration:** Groq SDK (`llama-3.1-8b-instant`).
- **External APIs:** iTunes Search API, TVMaze Show API, Wikipedia Action API.

## 🚀 How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/Yash-kakade/Entertainment_recommendation.git
cd Entertainment_recommendation/backend
```

### 2. Set up the Environment
Ensure you have Python 3.8+ installed. 
```bash
pip install -r requirements.txt
```

### 3. Add your Groq API Key
Create a `.env` file inside the `/backend` directory based on the `.env.example` file:
```env
PORT=5000
GROQ_API_KEY=your_actual_groq_api_key_here
```
*(You can get a free API key from [console.groq.com](https://console.groq.com/))*

### 4. Start the Application
Run the Flask server, which will also automatically serve the frontend on the root URL:
```bash
python app.py
```
Open your browser and navigate to `http://localhost:5000` to start exploring!

## 🎬 How it works
1. **Input:** Type how you're feeling (e.g., "I'm feeling nostalgic and want to relax").
2. **Process:** The frontend sends your mood to the Flask backend, which constructs a highly-specific prompt—excluding any media you've already seen during the session—and queries the Groq LLM.
3. **Render:** The LLM returns structured JSON. The frontend parses this, hits multiple poster APIs simultaneously to fetch high-res cover art, and instantly renders the gorgeous 3D CSS cards onto your screen.

---
*Built with ❤️ for a seamless entertainment discovery experience.*
