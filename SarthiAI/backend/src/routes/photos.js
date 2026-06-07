import { Router } from 'express';
import { photosHandler } from '../controllers/photosController.js';

const router = Router();
router.get('/photos', photosHandler);

export default router;
