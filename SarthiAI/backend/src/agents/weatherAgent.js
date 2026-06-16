import { getWeather } from '../services/weatherService.js';

export async function runWeatherAgent(destination) {
  try {
    const weather = await getWeather(destination);
    return weather;
  } catch (e) {
    console.error('WeatherAgent failed:', e?.message || e);
    return null;
  }
}
