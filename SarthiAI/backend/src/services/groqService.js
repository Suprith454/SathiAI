import { config } from '../config/env.js';
import { convertItineraryCosts, getExchangeRate, symbolToCode } from './exchangeService.js';
import { generateWithOllama } from './ollamaService.js';
import { generateWithGemini } from './geminiService.js';
import { generateWithOpenRouter } from './openrouterService.js';

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

async function applyCurrencyConversion(itinerary, destination, currency) {
  if (currency && currency !== '$') {
    try {
      return await convertItineraryCosts(itinerary, destination, currency);
    } catch (e) {
      console.error('Currency conversion error (returning raw):', e?.message || e);
      if (itinerary) itinerary.currency = currency || itinerary.currency;
    }
  }
  return itinerary;
}

const MIN_BUDGET_PER_DAY = {
  'new york': 80, 'london': 75, 'paris': 60, 'tokyo': 60,
  'zurich': 100, 'oslo': 85, 'reykjavik': 100,
  'dubai': 80, 'singapore': 65, 'hong kong': 60,
  'sydney': 65, 'san francisco': 80, 'los angeles': 65,
  'bangkok': 15, 'bali': 15, 'phuket': 15, 'goa': 10, 'hanoi': 12,
  'mumbai': 12, 'delhi': 10, 'cairo': 12, 'prague': 25,
  'budapest': 20, 'istanbul': 20, 'marrakech': 12,
};
const DEFAULT_MIN_PER_DAY = 30;

async function checkBudgetRealistic(destination, duration, budget, currency) {
  if (typeof budget !== 'number' || budget <= 0 || !duration || duration <= 0) return;
  const currencyCode = symbolToCode(currency || '$');
  let budgetUSD = budget;
  if (currencyCode !== 'USD') {
    try {
      const rate = await getExchangeRate(currencyCode, 'USD');
      budgetUSD = budget * rate;
    } catch {
      return;
    }
  }
  const perDay = budgetUSD / duration;
  const destKey = destination.toLowerCase().trim();
  let minPerDay = DEFAULT_MIN_PER_DAY;
  for (const [key, val] of Object.entries(MIN_BUDGET_PER_DAY)) {
    if (destKey.includes(key)) {
      minPerDay = val;
      break;
    }
  }
  if (perDay < minPerDay) {
    throw new Error('The budget which you entered is unrealistic');
  }
}

export async function generateItinerary(destination, duration, interests, budget = 500, currency = '$') {
  await checkBudgetRealistic(destination, duration, budget, currency);
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

  const keys = [config.groq.apiKey].filter(Boolean);
  let lastErr;

  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await fetch(GROQ_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keys[i]}`,
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
        lastErr = new Error(`Groq API error (${res.status}): ${err}`);
        if (res.status === 429) {
          console.warn(`Groq key ${i + 1} rate limited, trying next key...`);
          continue;
        }
        throw lastErr;
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

      let itinerary;
      try {
        itinerary = JSON.parse(text);
      } catch (e) {
        throw new Error(`Failed to parse Groq response as JSON: ${e.message}\nRaw: ${text.slice(0, 500)}`);
      }
      return await applyCurrencyConversion(itinerary, destination, currency);
    } catch (groqErr) {
      if (groqErr.message?.includes('rate_limit') || groqErr.message?.includes('429')) {
        lastErr = groqErr;
        continue;
      }
      throw groqErr;
    }
  }

  console.warn('All Groq keys failed, trying Gemini:', lastErr?.message || lastErr);
  try {
    const geminiItinerary = await generateWithGemini(destination, duration, interests, budget, currency);
    if (geminiItinerary) return geminiItinerary;
  } catch (geminiErr) {
    console.warn('Gemini failed, trying OpenRouter:', geminiErr?.message || geminiErr);
  }

  try {
    const orItinerary = await generateWithOpenRouter(destination, duration, interests, budget, currency);
    if (orItinerary) return orItinerary;
  } catch (orErr) {
    console.warn('OpenRouter failed, falling back to Ollama:', orErr?.message || orErr);
  }

  try {
    const ollamaItinerary = await generateWithOllama(destination, duration, interests, budget, currency);
    if (ollamaItinerary) return ollamaItinerary;
  } catch (ollamaErr) {
    console.error('All AI providers failed - Ollama error:', ollamaErr?.message || ollamaErr);
  }
  throw lastErr || new Error('All API keys exhausted');
}
