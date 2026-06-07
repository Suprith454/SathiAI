import { searchPhotos } from '../services/photoService.js';

export async function photosHandler(req, res) {
  try {
    const q = req.query.q || req.query.query;
    const perPage = Math.min(parseInt(req.query.per_page) || 8, 20);
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const photos = await searchPhotos(q, perPage);
    res.json({ photos, query: q });
  } catch (err) {
    console.error('Photos error:', err);
    res.status(500).json({ error: 'Failed to fetch photos', details: err.message });
  }
}
