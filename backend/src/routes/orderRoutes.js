import express from 'express';
import { 
  createOrder, 
  getOrderById, 
  getCustomerOrders, 
  getMerchantOrders, 
  getRiderOrders, 
  updateOrderStatus, 
  riderResponse 
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/customer', protect, getCustomerOrders);
router.get('/merchant', protect, getMerchantOrders);
router.get('/rider', protect, getRiderOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);
router.put('/:id/rider-response', protect, riderResponse);

export default router;
