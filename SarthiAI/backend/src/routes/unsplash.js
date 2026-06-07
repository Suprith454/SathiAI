import { Router } from 'express';
import { unsplashHandler } from '../controllers/unsplashController.js';

const router = Router();
router.get('/unsplash', unsplashHandler);

export default router;
