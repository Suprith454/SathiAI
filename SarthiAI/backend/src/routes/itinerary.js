import { Router } from 'express';
import { generateItineraryHandler } from '../controllers/itineraryController.js';

const router = Router();
router.post('/itinerary', generateItineraryHandler);

export default router;
