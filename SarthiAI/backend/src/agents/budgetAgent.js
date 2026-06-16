import { callAI } from './callAI.js';

const SYSTEM_PROMPT = `You are a specialized budget planning agent for travel. Your task is to analyze a traveler's budget and recommend optimal spending splits.

Return ONLY valid JSON. No markdown, no code fences, no extra text.

Use this exact JSON structure:
{
  "level": "low, medium, or high",
  "breakdown": {
    "accommodation": { "amount": number, "percentage": number, "tip": "string" },
    "food": { "amount": number, "percentage": number, "tip": "string" },
    "activities": { "amount": number, "percentage": number, "tip": "string" },
    "transport": { "amount": number, "percentage": number, "tip": "string" }
  },
  "saving_tips": ["tip1", "tip2", "tip3"]
}

RULES:
- percentages must sum to 100
- amounts should match the user's total budget and currency
- accommodation should be the largest category (35-45%)
- provide 3-5 practical saving tips specific to the destination
- level: low (< $300), medium ($300-1500), high (> $1500) total budget`;

function budgetLevel(budget) {
  if (typeof budget !== 'number') return 'medium';
  if (budget < 300) return 'low';
  if (budget > 1500) return 'high';
  return 'medium';
}

export async function runBudgetAgent(destination, duration, budget, currency, interests) {
  const level = budgetLevel(budget);
  const userPrompt = `Analyze the budget for a ${duration}-day trip to ${destination}.
Total budget: ${currency}${budget}
Budget level: ${level}
Interests: ${(interests || []).join(', ')}

Provide a detailed spending breakdown and saving tips specific to ${destination}.`;

  try {
    const result = await callAI(SYSTEM_PROMPT, userPrompt, 0.5);
    return {
      total: typeof budget === 'number' ? budget : 500,
      currency: currency || '$',
      level: result.level || level,
      breakdown: result.breakdown || {
        accommodation: { amount: 0, percentage: 40, tip: 'Budget wisely' },
        food: { amount: 0, percentage: 24, tip: 'Eat local' },
        activities: { amount: 0, percentage: 20, tip: 'Look for free attractions' },
        transport: { amount: 0, percentage: 16, tip: 'Use public transit' },
      },
      saving_tips: result.saving_tips || ['Compare prices online', 'Travel off-peak', 'Book in advance'],
    };
  } catch (e) {
    console.error('BudgetAgent failed:', e?.message || e);
    return {
      total: typeof budget === 'number' ? budget : 500,
      currency: currency || '$',
      level,
      breakdown: {
        accommodation: { amount: Math.round(budget * 0.4), percentage: 40, tip: 'Book in advance for best rates' },
        food: { amount: Math.round(budget * 0.24), percentage: 24, tip: 'Try local street food' },
        activities: { amount: Math.round(budget * 0.2), percentage: 20, tip: 'Look for free attractions and museum passes' },
        transport: { amount: Math.round(budget * 0.16), percentage: 16, tip: 'Use public transportation' },
      },
      saving_tips: ['Book flights early for best deals', 'Eat where locals eat', 'Use city tourist passes', 'Travel during shoulder season', 'Walk when possible'],
    };
  }
}
