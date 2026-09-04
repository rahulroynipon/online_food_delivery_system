import express from 'express';
import { getPlatformSettings, updatePlatformSettings } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/platform', getPlatformSettings);
router.put('/platform', protect, updatePlatformSettings);

export default router;
