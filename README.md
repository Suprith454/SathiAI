# SarthiAI — AI Travel Companion

A production-ready React travel itinerary web app with multi-agent AI planning, real-time weather, currency conversion, PDF export, and native sharing.

## Architecture

```
User Input (Chat / Manual Form)
        │
        ▼
  Orchestrator (sequential pipeline)
        │
  ┌─────┼──────┬──────┬──────┐
  ▼     ▼      ▼      ▼      ▼
Budget Weather Itinerary Hotel Booking
Agent  Agent  Agent     Agent Agent
  │     │      │        │      │
  └─────┴──┬───┴────────┴──────┘
           ▼
      AI Fallback Chain
  Groq → OpenRouter → Gemini → Ollama
           ▼
    Currency Conversion (Frankfurter API)
           ▼
     Frontend (React + Tailwind v4)
```

## Features

- **Multi-Agent Pipeline**: 5 specialized AI agents run sequentially — Budget → Weather → Itinerary → Hotel → Booking
- **4-Tier AI Fallback**: Groq → OpenRouter → Gemini → Ollama (local). Smart caching skips exhausted providers.
- **Chat Sidebar**: Conversational trip planning with AI
- **Manual Form**: Date pickers, budget + currency dropdown ($ ₹ € £ ¥), interest chips
- **Suggestion Cards**: 1-click generate for Paris, Tokyo, Bali, New York, Dubai
- **Budget Breakdown**: Visual spending splits with saving tips
- **Hotel Cards**: 3-tier recommendations (budget, mid-range, luxury)
- **Booking Drafts**: Professional email drafts with copy-to-clipboard
- **Weather**: Real-time OpenWeatherMap data
- **Photo Gallery**: Unsplash-powered activity photo modal
- **PDF Export**: jsPDF programmatic itinerary PDF
- **Native Share**: PDF sharing via OS share sheet
- **Currency Conversion**: Auto-detect local currency → user's currency via Frankfurter API
- **Edit/Regenerate**: Modify duration, budget, interests and regenerate

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS v4 |
| Backend | Node.js, Express |
| AI | Groq, OpenRouter, Gemini, Ollama (local) |
| APIs | Unsplash (photos), OpenWeatherMap, Frankfurter (forex) |
| PDF | jsPDF |
| Sharing | Web Share API (`navigator.share`) |

## Setup

### Prerequisites

- Node.js 18+
- Ollama (optional, for local fallback): `ollama pull llama3.2:3b`

### Quick Start

```bash
# Install dependencies
cd SarthiAI
npm run install:all

# Configure API keys (copy from .env.example template)
# Edit SarthiAI/backend/.env with your keys

# Start both servers
npm run dev
```

Frontend → http://localhost:5173
Backend → http://localhost:5000

### Environment Variables

Create `SarthiAI/backend/.env`:

```env
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIza...
UNSPLASH_ACCESS_KEY=...
OPENWEATHER_API_KEY=...
```

All keys are optional — the fallback chain handles missing/exhausted providers.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/itinerary` | POST | Generate itinerary (triggers multi-agent pipeline) |
| `/api/chat` | POST | Conversational chat with AI |
| `/api/photos` | GET | Fetch destination photos (Unsplash) |
| `/api/weather` | GET | Current weather (OpenWeatherMap) |
| `/api/unsplash` | GET | Raw Unsplash search |
| `/api/share-pdf` | GET | Generate shareable PDF URL |

## Pipeline Output

```json
{
  "title": "Goa, India",
  "days": [{ "day": 1, "activities": [...] }],
  "budget": { "total": 500, "breakdown": {...}, "saving_tips": [...] },
  "weather": [{ "temp": 28, "condition": "Clouds" }],
  "hotels": [{ "name": "...", "price_per_night": 30, "rating": 3.5 }],
  "booking_emails": [{ "to": "...", "subject": "...", "body": "..." }]
}
```

## Project Structure

```
SarthiAI/
├── backend/src/
│   ├── agents/           # Multi-agent pipeline
│   │   ├── orchestrator.js   # Sequential pipeline runner
│   │   ├── callAI.js         # Shared AI fallback utility
│   │   ├── budgetAgent.js    # Budget breakdowns
│   │   ├── weatherAgent.js   # OpenWeatherMap wrapper
│   │   ├── itineraryAgent.js # Day-by-day planner
│   │   ├── hotelAgent.js     # Hotel recommendations
│   │   └── bookingAgent.js   # Email drafts
│   ├── controllers/
│   ├── services/          # AI providers, exchange, photos, weather
│   ├── routes/
│   └── config/
├── frontend/src/
│   ├── components/
│   │   ├── DashboardContent.jsx  # All agent sections rendered
│   │   ├── BudgetBreakdown.jsx   # Spending breakdown chart
│   │   ├── HotelCard.jsx         # Hotel recommendations
│   │   ├── BookingDraft.jsx      # Email preview cards
│   │   ├── ChatSidebar.jsx       # AI chat panel
│   │   ├── ManualForm.jsx        # Trip input form
│   │   └── ...
│   └── hooks/
└── package.json
```
