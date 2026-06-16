const OLLAMA_API = 'http://localhost:11434/api/chat';
const MODEL = 'llama3.2:3b';

const SYSTEM_PROMPT = `You are a professional travel itinerary planner. Your task is to create detailed, realistic travel itineraries.

Return ONLY valid JSON. No markdown, no code fences, no extra text.

Use this exact JSON structure:
{
  "title": "City Name, Country",
  "tagline": "A catchy one-line summary of this trip",
  "destination": "City Name",
  "summary": "2-3 sentence overview of the trip",
  "budget": "low, medium, or high",
  "currency": "Local currency",
  "language": "Official language(s)",
  "best_time_to_visit": "Brief note on best season",
  "days": [
    {
      "day": 1,
      "theme": "Short theme for the day",
      "activities": [
        {
          "time": "HH:00",
          "title": "Activity name",
          "description": "1-2 sentence description",
          "category": "One of: Food, History, Adventure, Culture, Nature, Shopping, Nightlife",
          "duration": "X hours/minutes",
          "tips": "Practical tip for this activity",
          "estimated_cost": "Cost estimate"
        }
      ]
    }
  ]
}

CONSTRAINTS:
- Each day must have 4-6 activities
- Time slots between 07:00 and 22:00
- Activities must be realistic and logically ordered (geographically)
- Include breakfast/lunch/dinner when appropriate
- Categories must be exactly one of: Food, History, Adventure, Culture, Nature, Shopping, Nightlife
- Include practical money-saving or safety tips`;

function buildUserPrompt(destination, duration, interests, budget, budgetLevel, budgetNote) {
  return `Create a ${duration}-day travel itinerary for ${destination}. 
The user is interested in: ${interests.join(', ')}.
Budget level: ${budgetLevel}. ${budgetNote}

Ensure activities are specific to ${destination}, include realistic locations and landmarks, and provide practical advice.`;
}

function parseResponse(text) {
  const cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
  return JSON.parse(cleaned);
}

export async function generateWithOllama(destination, duration, interests, budget = 500, currency = '$') {
  let budgetLevel, budgetNote;
  if (typeof budget === 'number') {
    budgetLevel = budget < 300 ? 'low' : budget < 1500 ? 'medium' : 'high';
    budgetNote = `Total trip budget: $${budget}. ` + (budgetLevel === 'low' ? 'Focus on budget-friendly, free, and low-cost activities.' :
      budgetLevel === 'high' ? 'Include premium experiences, fine dining, and luxury options.' :
      'Mix of mid-range activities and dining options.');
  } else {
    budgetLevel = budget;
    budgetNote = budgetLevel === 'low' ? 'Focus on budget-friendly, free, and low-cost activities.' :
      budgetLevel === 'high' ? 'Include premium experiences, fine dining, and luxury options.' :
      'Mix of mid-range activities and dining options.';
  }

  const userPrompt = buildUserPrompt(destination, duration, interests, budget, budgetLevel, budgetNote);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600000);

  try {
    const res = await fetch(OLLAMA_API, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        options: { temperature: 0.3 },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      throw new Error(`Ollama API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    let text = data.message?.content?.trim();

    if (!text) {
      throw new Error('Ollama returned empty response');
    }

    let itinerary;
    try {
      itinerary = parseResponse(text);
    } catch (e) {
      throw new Error(`Failed to parse Ollama response as JSON: ${e.message}\nRaw: ${text.slice(0, 500)}`);
    }

    if (currency && currency !== '$') {
      try {
        const { convertItineraryCosts } = await import('./exchangeService.js');
        return await convertItineraryCosts(itinerary, destination, currency);
      } catch (e) {
        console.error('Ollama currency conversion error (returning raw):', e?.message || e);
        if (itinerary) itinerary.currency = currency || itinerary.currency;
      }
    }

    return itinerary;
  } finally {
    clearTimeout(timeout);
  }
}
