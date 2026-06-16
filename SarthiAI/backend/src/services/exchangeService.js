const LOCAL_CURRENCY_MAP = {
  'paris': 'EUR', 'france': 'EUR', 'nice': 'EUR', 'lyon': 'EUR', 'marseille': 'EUR',
  'tokyo': 'JPY', 'japan': 'JPY', 'kyoto': 'JPY', 'osaka': 'JPY', 'hokkaido': 'JPY',
  'bali': 'IDR', 'indonesia': 'IDR', 'jakarta': 'IDR', 'yogyakarta': 'IDR',
  'new york': 'USD', 'usa': 'USD', 'united states': 'USD', 'america': 'USD',
  'los angeles': 'USD', 'san francisco': 'USD', 'chicago': 'USD', 'miami': 'USD',
  'london': 'GBP', 'uk': 'GBP', 'united kingdom': 'GBP', 'england': 'GBP', 'manchester': 'GBP',
  'dubai': 'AED', 'uae': 'AED', 'abu dhabi': 'AED',
  'mumbai': 'INR', 'india': 'INR', 'delhi': 'INR', 'bangalore': 'INR', 'goa': 'INR',
  'sydney': 'AUD', 'australia': 'AUD', 'melbourne': 'AUD', 'brisbane': 'AUD',
  'singapore': 'SGD',
  'bangkok': 'THB', 'thailand': 'THB', 'phuket': 'THB', 'chiang mai': 'THB',
  'seoul': 'KRW', 'south korea': 'KRW', 'busan': 'KRW',
  'berlin': 'EUR', 'germany': 'EUR', 'munich': 'EUR', 'frankfurt': 'EUR', 'hamburg': 'EUR',
  'rome': 'EUR', 'italy': 'EUR', 'milan': 'EUR', 'venice': 'EUR', 'florence': 'EUR',
  'madrid': 'EUR', 'spain': 'EUR', 'barcelona': 'EUR', 'seville': 'EUR',
  'amsterdam': 'EUR', 'netherlands': 'EUR',
  'beijing': 'CNY', 'china': 'CNY', 'shanghai': 'CNY', 'hong kong': 'HKD',
  'cairo': 'EGP', 'egypt': 'EGP',
  'istanbul': 'TRY', 'turkey': 'TRY',
  'rio': 'BRL', 'brazil': 'BRL', 'sao paulo': 'BRL',
  'toronto': 'CAD', 'canada': 'CAD', 'vancouver': 'CAD', 'montreal': 'CAD',
  'mexico city': 'MXN', 'mexico': 'MXN', 'cancun': 'MXN',
  'zurich': 'CHF', 'switzerland': 'CHF', 'geneva': 'CHF',
  'stockholm': 'SEK', 'sweden': 'SEK',
  'oslo': 'NOK', 'norway': 'NOK',
  'copenhagen': 'DKK', 'denmark': 'DKK',
  'helsinki': 'EUR', 'finland': 'EUR',
  'dublin': 'EUR', 'ireland': 'EUR',
  'vienna': 'EUR', 'austria': 'EUR',
  'prague': 'CZK', 'czech': 'CZK',
  'budapest': 'HUF', 'hungary': 'HUF',
  'warsaw': 'PLN', 'poland': 'PLN',
  'athens': 'EUR', 'greece': 'EUR', 'santorini': 'EUR', 'mykonos': 'EUR',
  'lisbon': 'EUR', 'portugal': 'EUR', 'porto': 'EUR',
  'moscow': 'RUB', 'russia': 'RUB',
  'cape town': 'ZAR', 'south africa': 'ZAR', 'johannesburg': 'ZAR',
  'nairobi': 'KES', 'kenya': 'KES',
  'marrakech': 'MAD', 'morocco': 'MAD',
  'hanoi': 'VND', 'vietnam': 'VND', 'ho chi minh': 'VND',
  'kuala lumpur': 'MYR', 'malaysia': 'MYR',
  'manila': 'PHP', 'philippines': 'PHP',
  'auckland': 'NZD', 'new zealand': 'NZD', 'wellington': 'NZD',
  'reykjavik': 'ISK', 'iceland': 'ISK',
};

const SYMBOL_TO_CODE = {
  '$': 'USD',
  '₹': 'INR',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
};

const CODE_TO_SYMBOL = {};
for (const [sym, code] of Object.entries(SYMBOL_TO_CODE)) {
  CODE_TO_SYMBOL[code] = sym;
}

export function detectLocalCurrency(destination) {
  const key = destination.toLowerCase().trim();
  for (const [name, code] of Object.entries(LOCAL_CURRENCY_MAP)) {
    if (key.includes(name)) return code;
  }
  return 'USD';
}

export function symbolToCode(symbol) {
  return SYMBOL_TO_CODE[symbol] || 'USD';
}

export async function getExchangeRate(fromCode, toCode) {
  if (fromCode === toCode) return 1;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${fromCode}&to=${toCode}`,
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
    const data = await res.json();
    return data.rates[toCode];
  } finally {
    clearTimeout(timeout);
  }
}

function convertCostString(costStr, rate, localSymbol, userSymbol) {
  if (!costStr || typeof costStr !== 'string') return costStr;
  let result = costStr.replace(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g, (match) => {
    const num = parseFloat(match.replace(/,/g, ''));
    if (isNaN(num)) return match;
    const converted = Math.round(num * rate);
    if (converted >= 1000) return converted.toLocaleString();
    return String(converted);
  });
  if (localSymbol && userSymbol && localSymbol !== userSymbol) {
    const escaped = localSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), userSymbol);
  }
  return result;
}

export async function convertItineraryCosts(itinerary, destination, userCurrencySymbol) {
  try {
    if (!itinerary || !userCurrencySymbol) return itinerary;
    const localCode = detectLocalCurrency(destination);
    const userCode = symbolToCode(userCurrencySymbol);
    const localSymbol = CODE_TO_SYMBOL[localCode];
    if (localCode === userCode) return { ...itinerary, currency: userCurrencySymbol };
    let rate;
    try {
      rate = await getExchangeRate(localCode, userCode);
    } catch {
      return { ...itinerary, currency: userCurrencySymbol, _conversionFailed: true };
    }
    return {
      ...itinerary,
      currency: userCurrencySymbol,
      days: Array.isArray(itinerary.days) ? itinerary.days.map(day => ({
        ...day,
        activities: Array.isArray(day.activities) ? day.activities.map(act => ({
          ...act,
          estimated_cost: act.estimated_cost ? convertCostString(act.estimated_cost, rate, localSymbol, userSymbol) : act.estimated_cost,
        })) : day.activities,
      })) : itinerary.days,
    };
  } catch (e) {
    console.error('convertItineraryCosts unexpected error:', e.message, e.stack);
    return { ...itinerary, currency: userCurrencySymbol || itinerary?.currency || '$' };
  }
}
