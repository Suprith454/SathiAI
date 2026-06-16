import { callAI } from './callAI.js';

const SYSTEM_PROMPT = `You are a specialized hotel recommendation agent for travel. Your task is to recommend hotels based on budget, destination, and trip duration.

Return ONLY valid JSON. No markdown, no code fences, no extra text.

Use this exact JSON structure:
{
  "hotels": [
    {
      "name": "Hotel Name",
      "type": "budget, mid-range, or luxury",
      "price_per_night": number,
      "total_cost": number,
      "rating": number (1-5),
      "location": "Neighborhood or area",
      "description": "1-2 sentence description",
      "amenities": ["WiFi", "Breakfast", "Air conditioning"],
      "booking_tip": "Practical booking advice",
      "proximity": "Distance to major attractions"
    }
  ]
}

RULES:
- Recommend 3 hotels at different price points (one budget, one mid-range, one luxury)
- total_cost = price_per_night * duration
- Prices should be realistic for the destination
- ratings should be between 3.0 and 5.0
- Include diverse location options (city center, quiet area, near attractions)`;

export async function runHotelAgent(destination, duration, budgetData) {
  const dailyBudget = budgetData?.breakdown?.accommodation?.amount || Math.round((budgetData?.total || 500) * 0.4);
  const totalBudget = budgetData?.total || 500;
  const currency = budgetData?.currency || '$';
  const level = budgetData?.level || 'medium';

  const userPrompt = `Recommend hotels for a ${duration}-day trip to ${destination}.
Total trip budget: ${currency}${totalBudget} (${level})
Accommodation budget: ~${currency}${dailyBudget} total (${currency}${Math.round(dailyBudget / duration)} per night)
Trip duration: ${duration} nights

Provide 3 hotel options at budget, mid-range, and luxury tiers appropriate for ${destination}.`;

  try {
    const result = await callAI(SYSTEM_PROMPT, userPrompt, 0.5);
    return Array.isArray(result?.hotels) ? result.hotels : [];
  } catch (e) {
    console.error('HotelAgent failed:', e?.message || e);
    return [
      { name: `${destination} Budget Inn`, type: 'budget', price_per_night: Math.round(dailyBudget / duration * 0.6), total_cost: Math.round(dailyBudget * 0.6), rating: 3.5, location: 'Near city center', description: `Affordable stay in ${destination}`, amenities: ['WiFi', 'Basic breakfast'], booking_tip: 'Book early for best rates', proximity: '20 min walk to city center' },
      { name: `${destination} Comfort Stay`, type: 'mid-range', price_per_night: Math.round(dailyBudget / duration * 1.0), total_cost: Math.round(dailyBudget * 1.0), rating: 4.2, location: 'City center', description: `Comfortable hotel in the heart of ${destination}`, amenities: ['WiFi', 'Breakfast', 'Air conditioning', 'Gym'], booking_tip: 'Check for package deals', proximity: '5 min walk to major attractions' },
      { name: `${destination} Grand Hotel`, type: 'luxury', price_per_night: Math.round(dailyBudget / duration * 1.5), total_cost: Math.round(dailyBudget * 1.5), rating: 4.7, location: 'Prime district', description: `Premium luxury experience in ${destination}`, amenities: ['WiFi', 'Full breakfast', 'Spa', 'Pool', 'Concierge', 'Valet parking'], booking_tip: 'Book directly for upgrade offers', proximity: 'Central location' },
    ];
  }
}
