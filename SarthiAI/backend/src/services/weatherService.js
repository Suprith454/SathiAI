import { config } from '../config/env.js';

export async function getWeather(city) {
  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('q', city);
  url.searchParams.set('appid', config.openweather.apiKey);
  url.searchParams.set('units', 'metric');

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return [{
    date: today,
    temp: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    humidity: data.main.humidity,
    wind_speed: Math.round(data.wind.speed * 3.6),
    city: data.name,
    country: data.sys.country,
  }];
}
