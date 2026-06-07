import { getWeather } from '../services/weatherService.js';

export async function weatherHandler(req, res) {
  try {
    const dest = req.query.dest || req.query.city;
    if (!dest) {
      return res.status(400).json({ error: 'City query parameter is required' });
    }
    const weather = await getWeather(dest);
    res.json(weather);
  } catch (err) {
    console.error('Weather error:', err);
    res.status(500).json({ error: 'Failed to fetch weather', details: err.message });
  }
}
