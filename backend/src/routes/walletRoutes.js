import express from 'express';
import { 
  getWalletData, 
  processWalletAction, 
  getAdminWalletOverview,
  createWithdrawalRequest,
  getMyWithdrawals,
  getAdminWithdrawals,
  updateWithdrawalStatus
} from '../controllers/walletController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/balance', protect, getWalletData);
router.get('/admin-overview', protect, getAdminWalletOverview);
router.post('/payout', protect, processWalletAction);

// Withdrawal endpoints
router.post('/withdrawals', protect, createWithdrawalRequest);
router.get('/withdrawals/my', protect, getMyWithdrawals);
router.get('/withdrawals/admin', protect, authorize('ADMIN'), getAdminWithdrawals);
router.patch('/withdrawals/:id/status', protect, authorize('ADMIN'), updateWithdrawalStatus);

export default router;

