import { config } from '../config/env.js';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

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

export async function generateWithOpenRouter(destination, duration, interests, budget = 500, currency = '$') {
  const apiKey = config.openrouter?.apiKey;
  if (!apiKey) throw new Error('OpenRouter API key not configured');

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

  const userPrompt = `Create a ${duration}-day travel itinerary for ${destination}. 
The user is interested in: ${interests.join(', ')}.
Budget level: ${budgetLevel}. ${budgetNote}

Ensure activities are specific to ${destination}, include realistic locations and landmarks, and provide practical advice.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(OPENROUTER_API, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'SarthiAI',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      throw new Error(`OpenRouter API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    let text = data.choices?.[0]?.message?.content?.trim();

    if (!text) throw new Error('OpenRouter returned empty response');

    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) text = jsonMatch[1].trim();

    let itinerary;
    try {
      itinerary = JSON.parse(text);
    } catch (e) {
      throw new Error(`Failed to parse OpenRouter response as JSON: ${e.message}\nRaw: ${text.slice(0, 500)}`);
    }

    if (currency && currency !== '$') {
      try {
        const { convertItineraryCosts } = await import('./exchangeService.js');
        return await convertItineraryCosts(itinerary, destination, currency);
      } catch (e) {
        console.error('OpenRouter currency conversion error (returning raw):', e?.message || e);
        if (itinerary) itinerary.currency = currency || itinerary.currency;
      }
    }

    return itinerary;
  } finally {
    clearTimeout(timeout);
  }
}
