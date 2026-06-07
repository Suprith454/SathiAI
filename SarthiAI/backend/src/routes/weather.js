import { Router } from 'express';
import { weatherHandler } from '../controllers/weatherController.js';

const router = Router();
router.get('/weather', weatherHandler);

export default router;
