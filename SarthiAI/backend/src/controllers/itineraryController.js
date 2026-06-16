import { runPipeline } from '../agents/orchestrator.js';
import { getExchangeRate, symbolToCode } from '../services/exchangeService.js';

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

async function isBudgetRealistic(destination, duration, budget, currency) {
  if (typeof budget !== 'number' || budget <= 0 || !duration || duration <= 0) return true;

  const currencyCode = symbolToCode(currency || '$');
  let budgetUSD = budget;
  if (currencyCode !== 'USD') {
    try {
      const rate = await getExchangeRate(currencyCode, 'USD');
      budgetUSD = budget * rate;
    } catch {
      return true;
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

  return perDay >= minPerDay;
}

export async function generateItineraryHandler(req, res) {
  try {
    const { destination, duration, interests, budget, currency } = req.body;

    if (!destination || !duration || !interests?.length) {
      return res.status(400).json({
        error: 'Missing required fields: destination, duration, interests',
      });
    }

    if (duration < 1 || duration > 14) {
      return res.status(400).json({
        error: 'Duration must be between 1 and 14 days',
      });
    }

    const realistic = await isBudgetRealistic(destination, duration, budget, currency);
    if (!realistic) {
      return res.status(400).json({
        error: 'The budget which you entered is unrealistic',
      });
    }

    const result = await runPipeline({ destination, duration, interests, budget, currency });
    return res.json(result);
  } catch (err) {
    console.error('Multi-agent pipeline error:', err?.message || err);
    const msg = err?.message || String(err);
    if (!res.headersSent) {
      if (msg.includes('unrealistic')) {
        return res.status(400).json({ error: msg });
      }
      res.status(500).json({ error: 'Failed to generate itinerary', details: msg });
    }
  }
}
