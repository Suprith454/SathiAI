import { runBudgetAgent } from './budgetAgent.js';
import { runWeatherAgent } from './weatherAgent.js';
import { runItineraryAgent } from './itineraryAgent.js';
import { runHotelAgent } from './hotelAgent.js';
import { runBookingAgent } from './bookingAgent.js';
import { getExchangeRate, symbolToCode, detectLocalCurrency } from '../services/exchangeService.js';
import { resetFailedProviders } from './callAI.js';

export async function runPipeline({ destination, duration, interests, budget, currency }) {
  resetFailedProviders();
  console.log(`[Orchestrator] Starting pipeline for ${destination}, ${duration} days`);

  // Phase 1: Budget Agent
  console.log('[Orchestrator] Phase 1: Budget Agent');
  const budgetData = await runBudgetAgent(destination, duration, budget, currency, interests);

  // Phase 2: Weather Agent (real API)
  console.log('[Orchestrator] Phase 2: Weather Agent');
  const weatherData = await runWeatherAgent(destination);

  // Phase 3: Itinerary Agent (uses budget + weather context)
  console.log('[Orchestrator] Phase 3: Itinerary Agent');
  const itineraryData = await runItineraryAgent(destination, duration, interests, budgetData, weatherData);

  // Phase 4: Hotel Agent (uses budget context)
  console.log('[Orchestrator] Phase 4: Hotel Agent');
  const hotels = await runHotelAgent(destination, duration, budgetData);

  // Phase 5: Booking Agent (uses hotels + itinerary)
  console.log('[Orchestrator] Phase 5: Booking Agent');
  const bookingEmails = await runBookingAgent(destination, duration, hotels, itineraryData.days);

  // Apply currency conversion to activity costs
  const userCurrencySymbol = currency || '$';
  const convertedItinerary = await convertCosts(itineraryData, destination, userCurrencySymbol);
  const convertedBudget = await convertBudget(budgetData, destination, userCurrencySymbol);
  const convertedHotels = await convertHotelCosts(hotels, destination, userCurrencySymbol, duration);

  // Compose final result
  const result = {
    ...convertedItinerary,
    budget: convertedBudget,
    weather: weatherData || [],
    hotels: convertedHotels,
    booking_emails: bookingEmails,
  };

  console.log('[Orchestrator] Pipeline complete');
  return result;
}

async function convertCosts(itinerary, destination, userCurrencySymbol) {
  if (!itinerary || !userCurrencySymbol || userCurrencySymbol === '$') return itinerary;
  try {
    const { convertItineraryCosts } = await import('../services/exchangeService.js');
    return await convertItineraryCosts(itinerary, destination, userCurrencySymbol);
  } catch (e) {
    console.error('Currency conversion error:', e?.message || e);
    return { ...itinerary, currency: userCurrencySymbol };
  }
}

async function convertBudget(budgetData, destination, userCurrencySymbol) {
  if (!budgetData || !userCurrencySymbol || userCurrencySymbol === '$') return budgetData;
  try {
    const localCode = detectLocalCurrency(destination);
    const userCode = symbolToCode(userCurrencySymbol);
    if (localCode === userCode) return { ...budgetData, currency: userCurrencySymbol };
    const rate = await getExchangeRate(localCode, userCode);
    return {
      ...budgetData,
      total: Math.round(budgetData.total * rate),
      currency: userCurrencySymbol,
      breakdown: Object.fromEntries(
        Object.entries(budgetData.breakdown || {}).map(([key, val]) => [
          key,
          { ...val, amount: Math.round(val.amount * rate) },
        ])
      ),
    };
  } catch {
    return { ...budgetData, currency: userCurrencySymbol };
  }
}

async function convertHotelCosts(hotels, destination, userCurrencySymbol, duration) {
  if (!hotels?.length || !userCurrencySymbol || userCurrencySymbol === '$') return hotels;
  try {
    const localCode = detectLocalCurrency(destination);
    const userCode = symbolToCode(userCurrencySymbol);
    if (localCode === userCode) return hotels;
    const rate = await getExchangeRate(localCode, userCode);
    return hotels.map(h => ({
      ...h,
      price_per_night: Math.round(h.price_per_night * rate),
      total_cost: Math.round((h.total_cost || h.price_per_night * duration) * rate),
    }));
  } catch {
    return hotels;
  }
}
