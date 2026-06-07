import { config } from '../config/env.js';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

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

export async function generateItinerary(destination, duration, interests, budget = 'medium') {
  const budgetNote = budget === 'low' ? 'Focus on budget-friendly, free, and low-cost activities.' :
    budget === 'high' ? 'Include premium experiences, fine dining, and luxury options.' :
    'Mix of mid-range activities and dining options.';
  const userPrompt = `Create a ${duration}-day travel itinerary for ${destination}. 
The user is interested in: ${interests.join(', ')}.
Budget level: ${budget}. ${budgetNote}

Ensure activities are specific to ${destination}, include realistic locations and landmarks, and provide practical advice.`;

  const res = await fetch(GROQ_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.groq.apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  let text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error('Groq returned empty response');
  }

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    text = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse Groq response as JSON: ${e.message}\nRaw: ${text.slice(0, 500)}`);
  }
}
