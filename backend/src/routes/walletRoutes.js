import express from 'express';
import { getWalletData, processWalletAction, getAdminWalletOverview } from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/balance', protect, getWalletData);
router.get('/admin-overview', protect, getAdminWalletOverview);
router.post('/payout', protect, processWalletAction);

export default router;
