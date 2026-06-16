import { config } from '../config/env.js';
import { generateItinerary } from './groqService.js';

const CHAT_PROMPT = `You are SarthiAI, a friendly travel planning assistant. Help users plan their trip through conversation.

As you chat, silently collect these details: destination (city name), duration (number of days), budget (dollar amount like 500 or a level: low/medium/high), interests (from: Food, History, Adventure, Culture, Nature, Shopping, Nightlife).

RULES:
- Be concise (2-3 sentences per response).
- If you have ALL 4 details, end your response with exactly this JSON block on its own line (no other text after):
---PARSE---
{"destination":"...","duration":N,"budget":500,"interests":[...]}
---PARSE---
- budget should be a number if the user gave a dollar amount, or a string "low"/"medium"/"high" if they gave a level.
- If still missing details, just ask naturally for what's needed.`;

const EXTRACT_PROMPT = `Extract travel plan details from this conversation. Return ONLY valid JSON (no other text, no markdown), either the full object or null.

If ALL four fields below are present and non-null, return the object. Otherwise return just: null

Fields:
- "destination": city name as string (e.g. "Tokyo", "Paris")
- "duration": number of days as integer (e.g. 5)
- "budget": number if user gave a dollar amount (e.g. "$500" → 500), or "low"/"medium"/"high" string. Infer level: cheap/budget/saving → "low", moderate/mid-range → "medium", luxury/premium/expensive → "high"
- "interests": array of strings, each EXACTLY one of: "Food", "History", "Adventure", "Culture", "Nature", "Shopping", "Nightlife"

Examples: {"destination":"Tokyo","duration":5,"budget":1200,"interests":["Food","Culture"]}
{"destination":"Paris","duration":3,"budget":"medium","interests":["Food","History"]}`;

async function callGroq(messages, options = {}) {
  const keys = [config.groq.apiKey].filter(Boolean);
  let lastErr;

  for (const key of keys) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        if (res.status === 429) { lastErr = new Error(err); continue; }
        throw new Error(`Groq API error (${res.status}): ${err}`);
      }

      return await res.json();
    } catch (e) {
      if (e.message?.includes('rate_limit') || e.message?.includes('429') || e.message?.includes('429')) {
        lastErr = e;
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error('Groq API key not configured');
}

export async function chatWithAI(message, history) {
  const messages = [
    { role: 'system', content: CHAT_PROMPT },
    ...history.slice(-10),
    { role: 'user', content: message },
  ];

  // Step 1: Get conversational response
  let reply = '';
  try {
    const data = await callGroq(messages);
    reply = data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.warn('Chat Groq failed:', err?.message || err);
    return { message: "I'm having trouble connecting right now. Please use the manual form to plan your trip!", parsed: null, itinerary: null, error: null };
  }

  // Step 2: Check for inline PARSE block
  let parsed = null;
  const parseIdx = reply.indexOf('---PARSE---');
  if (parseIdx !== -1) {
    const jsonStr = reply.slice(parseIdx + '---PARSE---'.length).trim();
    reply = reply.slice(0, parseIdx).trim();
    try { parsed = JSON.parse(jsonStr); } catch { /* ignore */ }
  }

  // Step 3: If no inline parse, try extraction via a focused AI call
  if (!parsed) {
    const allText = [...history.map(m => `${m.role}: ${m.content}`), `user: ${message}`].join('\n');
    try {
      const extData = await callGroq([
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: allText },
      ], { temperature: 0, maxTokens: 300 });
      const extText = extData.choices?.[0]?.message?.content?.trim();
      if (extText && extText !== 'null') {
        try { parsed = JSON.parse(extText); } catch { /* ignore */ }
        if (parsed && (!parsed.destination || !parsed.duration || !parsed.interests?.length)) {
          parsed = null;
        }
      }
    } catch { /* extraction failed, continue */ }
  }

  // Step 4: If we have all params, generate the itinerary
  let itinerary = null;
  if (parsed?.destination && parsed?.duration && parsed?.interests?.length) {
    try {
      itinerary = await generateItinerary(
        parsed.destination,
        parsed.duration,
        parsed.interests,
        parsed.budget ?? 500,
        '$'
      );
    } catch (err) {
      console.error('Auto-generate from chat failed:', err.message);
      return { message: reply + `\n\n(I tried to generate your itinerary but hit an error: ${err.message}. Try again or use the manual form.)`, parsed, itinerary: null, error: err.message };
    }
  }

  return { message: reply, parsed, itinerary, error: null };
}
