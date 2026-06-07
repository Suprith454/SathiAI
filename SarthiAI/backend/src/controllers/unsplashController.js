import { getCityImage } from '../services/unsplashService.js';

export async function unsplashHandler(req, res) {
  try {
    const q = req.query.q || req.query.city;
    if (!q) {
      return res.status(400).json({ error: 'City query parameter is required' });
    }
    const result = await getCityImage(q);
    res.json(result);
  } catch (err) {
    console.error('Unsplash error:', err);
    res.status(500).json({ error: 'Failed to fetch city image', details: err.message });
  }
}
