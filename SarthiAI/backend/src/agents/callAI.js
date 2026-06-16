import { config } from '../config/env.js';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const OLLAMA_API = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'llama3.2:3b';

const FAILED_PROVIDERS = new Set();

async function callGroq(messages, temperature, maxTokens = 512) {
  const keys = [config.groq.apiKey].filter(Boolean);
  let lastErr;
  for (const key of keys) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(GROQ_API, {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature, max_tokens: maxTokens }),
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.text();
        if (res.status === 429) { lastErr = new Error(`Groq rate limited: ${err}`); continue; }
        throw new Error(`Groq API error (${res.status}): ${err}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim();
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') { lastErr = new Error('Groq timeout'); continue; }
      if (e.message?.includes('rate_limit') || e.message?.includes('429')) { lastErr = e; continue; }
      throw e;
    }
  }
  FAILED_PROVIDERS.add('Groq');
  throw lastErr || new Error('All Groq keys exhausted');
}

async function callOpenRouter(messages, temperature) {
  const apiKey = config.openrouter?.apiKey;
  if (!apiKey) throw new Error('OpenRouter API key not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(OPENROUTER_API, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'SarthiAI' },
      body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages, temperature, max_tokens: 2048 }),
    });
    if (!res.ok) { const err = await res.text().catch(() => 'unknown'); throw new Error(`OpenRouter API error (${res.status}): ${err}`); }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('OpenRouter timeout');
    throw e;
  } finally { clearTimeout(timeout); }
}

async function callGemini(messages) {
  const apiKey = config.gemini?.apiKey;
  if (!apiKey) throw new Error('Gemini API key not configured');
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMsg = messages.find(m => m.role === 'user')?.content || '';
  const combinedPrompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${GEMINI_API}?key=${apiKey}`, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: combinedPrompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } }),
    });
    if (!res.ok) { const err = await res.text().catch(() => 'unknown'); throw new Error(`Gemini API error (${res.status}): ${err}`); }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Gemini timeout');
    throw e;
  } finally { clearTimeout(timeout); }
}

async function callOllama(messages, temperature) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(OLLAMA_API, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, options: { temperature: temperature || 0.3, num_predict: 512 }, messages }),
    });
    if (!res.ok) { const err = await res.text().catch(() => 'unknown'); throw new Error(`Ollama API error (${res.status}): ${err}`); }
    const data = await res.json();
    return data.message?.content?.trim();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Ollama timeout');
    throw e;
  } finally { clearTimeout(timeout); }
}

function parseJSON(text) {
  const cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
  return JSON.parse(cleaned);
}

export async function callAI(systemPrompt, userPrompt, temperature = 0.7) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const providers = [
    { name: 'Groq', fn: () => callGroq(messages, temperature) },
    { name: 'OpenRouter', fn: () => callOpenRouter(messages, temperature) },
    { name: 'Gemini', fn: () => callGemini(messages) },
    { name: 'Ollama', fn: () => callOllama(messages, temperature) },
  ];

  let lastErr;
  for (const provider of providers) {
    if (FAILED_PROVIDERS.has(provider.name)) {
      console.warn(`${provider.name} skipped (previously failed)`);
      continue;
    }
    try {
      const text = await provider.fn();
      if (!text) throw new Error(`${provider.name} returned empty response`);
      return parseJSON(text);
    } catch (e) {
      console.warn(`${provider.name} failed:`, e?.message?.slice(0, 120) || e);
      FAILED_PROVIDERS.add(provider.name);
      lastErr = e;
    }
  }
  throw lastErr || new Error('All AI providers failed');
}

export function resetFailedProviders() {
  FAILED_PROVIDERS.clear();
}
