# SarthiAI — Smart Travel Itinerary Generator

A React.js web application that generates structured, day-by-day travel itineraries using Google's Gemini AI. Built for the AI/GenAI Engineer Hackathon.

## Architecture

```
React (Frontend)
      ↓
Express API (Backend)
      ↓
Gemini API (AI)
```

## Features

- **AI-powered itinerary generation** — Enter destination, duration, and interests
- **Timeline-based UI** — Clean, intuitive vertical timeline with day-by-day breakdown
- **City images** — Unsplash API for destination background photos
- **Live weather** — OpenWeatherMap current conditions
- **PDF export** — Download itinerary as a professional PDF
- **Structured JSON output** — Pure JSON from Gemini for seamless rendering

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| AI Model | Google Gemini API |
| Images | Unsplash API |
| Weather | OpenWeatherMap API |
| PDF | html2canvas + jsPDF |
| Deployment | GitHub Pages (frontend) |

## Project Structure

```
wanderpilot/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── config/env.js         # Environment config
│   │   ├── routes/               # API route definitions
│   │   ├── controllers/          # Request handlers
│   │   └── services/             # External API integrations
│   │       ├── geminiService.js  # Gemini AI prompt + call
│   │       ├── unsplashService.js
│   │       └── weatherService.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # React UI components
│   │   ├── services/api.js       # Backend API client
│   │   └── hooks/useItinerary.js # State management
│   └── package.json
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- Gemini API key (free from [Google AI Studio](https://aistudio.google.com/))
- Unsplash API key (free from [Unsplash Developers](https://unsplash.com/developers))
- OpenWeatherMap API key (free from [OpenWeatherMap](https://openweathermap.org/api))

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-itinerary` | Generate itinerary (body: destination, duration, interests) |
| GET | `/api/city-image?city=Tokyo` | Fetch city image from Unsplash |
| GET | `/api/weather?city=Tokyo` | Fetch current weather |
| GET | `/api/health` | Health check |

## Prompt Engineering

The Gemini prompt is structured with:
- **System prompt** defining exact JSON schema and constraints
- **Few-shot example** ensuring consistent output format
- **Markdown stripping** fallback for robust JSON parsing
- **Temperature 0.7** balancing creativity and consistency

## Deployment

### Frontend (GitHub Pages)

```bash
cd frontend
npm run build
npm run deploy
```

Set `VITE_API_URL` in your deployed frontend to point to your backend URL.

### Backend (Render / Railway)

Deploy the `backend/` folder as a Node.js web service.
