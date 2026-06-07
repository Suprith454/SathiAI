import { Router } from 'express';
import { sharePdfHandler } from '../controllers/shareController.js';

const router = Router();
router.post('/share-pdf', sharePdfHandler);

export default router;
