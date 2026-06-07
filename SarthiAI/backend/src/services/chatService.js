import { config } from '../config/env.js';
import { generateItinerary } from './groqService.js';

const CHAT_PROMPT = `You are SarthiAI, a friendly travel planning assistant. Help users plan their trip through conversation.

As you chat, silently collect these details: destination (city name), duration (number of days), budget (low/medium/high), interests (from: Food, History, Adventure, Culture, Nature, Shopping, Nightlife).

RULES:
- Be concise (2-3 sentences per response).
- If you have ALL 4 details, end your response with exactly this JSON block on its own line (no other text after):
---PARSE---
{"destination":"...","duration":N,"budget":"...","interests":[...]}
---PARSE---
- If still missing details, just ask naturally for what's needed.`;

const EXTRACT_PROMPT = `Extract travel plan details from this conversation. Return ONLY valid JSON (no other text, no markdown), either the full object or null.

If ALL four fields below are present and non-null, return the object. Otherwise return just: null

Fields:
- "destination": city name as string (e.g. "Tokyo", "Paris")
- "duration": number of days as integer (e.g. 5)
- "budget": one of "low", "medium", or "high". Infer from any budget mention: cheap/budget/saving → "low", moderate/mid-range → "medium", luxury/premium/expensive → "high"
- "interests": array of strings, each EXACTLY one of: "Food", "History", "Adventure", "Culture", "Nature", "Shopping", "Nightlife"

Example: {"destination":"Tokyo","duration":5,"budget":"medium","interests":["Food","Culture"]}`;

export async function chatWithAI(message, history) {
  const messages = [
    { role: 'system', content: CHAT_PROMPT },
    ...history.slice(-10),
    { role: 'user', content: message },
  ];

  // Step 1: Get conversational response
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.groq.apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq chat error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  let reply = data.choices?.[0]?.message?.content || '';

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
      const extRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.groq.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: EXTRACT_PROMPT },
            { role: 'user', content: allText },
          ],
          temperature: 0,
          max_tokens: 300,
        }),
      });
      if (extRes.ok) {
        const extData = await extRes.json();
        const extText = extData.choices?.[0]?.message?.content?.trim();
        if (extText && extText !== 'null') {
          try { parsed = JSON.parse(extText); } catch { /* ignore */ }
          // Validate all fields present
          if (parsed && (!parsed.destination || !parsed.duration || !parsed.interests?.length)) {
            parsed = null;
          }
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
        parsed.budget || 'medium'
      );
    } catch (err) {
      console.error('Auto-generate from chat failed:', err.message);
      return { message: reply + `\n\n(I tried to generate your itinerary but hit an error: ${err.message}. Try again or use the manual form.)`, parsed, itinerary: null, error: err.message };
    }
  }

  return { message: reply, parsed, itinerary, error: null };
}
