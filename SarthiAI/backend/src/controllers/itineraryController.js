import { generateItinerary } from '../services/groqService.js';

export async function generateItineraryHandler(req, res) {
  try {
    const { destination, duration, interests } = req.body;

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

    const itinerary = await generateItinerary(destination, duration, interests);
    res.json(itinerary);
  } catch (err) {
    console.error('Itinerary generation error:', err);
    res.status(500).json({
      error: 'Failed to generate itinerary',
      details: err.message,
    });
  }
}
