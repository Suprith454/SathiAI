import { callAI } from './callAI.js';

const SYSTEM_PROMPT = `You are a specialized itinerary planning agent. Your task is to create detailed day-by-day travel itineraries given budget and weather context.

Return ONLY valid JSON. No markdown, no code fences, no extra text.

Use this exact JSON structure:
{
  "title": "City Name, Country",
  "tagline": "A catchy one-line summary of this trip",
  "destination": "City Name",
  "summary": "2-3 sentence overview of the trip",
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
          "estimated_cost": "Cost estimate in local currency"
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
- Include practical money-saving or safety tips
- Budget context: allocate daily spending based on the budget breakdown provided
- Weather context: adjust activities (indoor if rain, outdoor if sunny)`;

export async function runItineraryAgent(destination, duration, interests, budgetData, weatherData) {
  const level = budgetData?.level || 'medium';
  const breakdown = budgetData?.breakdown || {};
  const weatherSummary = Array.isArray(weatherData) && weatherData.length > 0
    ? `Current weather: ${weatherData[0].temp}°C, ${weatherData[0].condition}`
    : 'Weather data unavailable';

  const userPrompt = `Create a ${duration}-day travel itinerary for ${destination}.
The traveler is interested in: ${(interests || ['Food']).join(', ')}.
Budget level: ${level}
Budget breakdown: Accommodation ${breakdown.accommodation?.percentage || 40}%, Food ${breakdown.food?.percentage || 24}%, Activities ${breakdown.activities?.percentage || 20}%, Transport ${breakdown.transport?.percentage || 16}%
Daily activity budget target: approximately ${Math.round((budgetData?.total || 500) / duration * (breakdown.activities?.percentage || 20) / 100)} ${budgetData?.currency || '$'} per day
${weatherSummary}

Ensure activities are specific to ${destination}, include realistic locations and landmarks, and fit the budget constraints.`;

  try {
    const result = await callAI(SYSTEM_PROMPT, userPrompt, 0.7);
    return {
      title: result.title || `${destination}, Destination`,
      tagline: result.tagline || `Explore ${destination}`,
      destination: result.destination || destination,
      summary: result.summary || `A ${duration}-day trip to ${destination}`,
      language: result.language || 'Local language',
      best_time_to_visit: result.best_time_to_visit || 'Year-round',
      days: Array.isArray(result.days) ? result.days : [],
    };
  } catch (e) {
    console.error('ItineraryAgent failed:', e?.message || e);
    return {
      title: `${destination}, Destination`,
      tagline: `Explore ${destination}`,
      destination,
      summary: `A ${duration}-day trip to ${destination}`,
      language: 'Local language',
      best_time_to_visit: 'Year-round',
      days: Array.from({ length: duration }, (_, i) => ({
        day: i + 1,
        theme: `Day ${i + 1} in ${destination}`,
        activities: [
          { time: '09:00', title: `Explore ${destination}`, description: `Discover the best of ${destination}`, category: 'Culture', duration: '3 hours', tips: 'Start early', estimated_cost: 'Free' },
          { time: '12:00', title: 'Local Lunch', description: 'Try local cuisine', category: 'Food', duration: '1 hour', tips: 'Ask locals for recommendations', estimated_cost: '$$' },
          { time: '14:00', title: 'Sightseeing', description: 'Visit famous landmarks', category: 'History', duration: '3 hours', tips: 'Wear comfortable shoes', estimated_cost: '$$' },
          { time: '19:00', title: 'Dinner', description: 'Enjoy dinner at a popular restaurant', category: 'Food', duration: '1.5 hours', tips: 'Make a reservation', estimated_cost: '$$' },
        ],
      })),
    };
  }
}
