import express from 'express';
import {
  initiateOrderPayment,
  handleSSLSuccess,
  handleSSLFail,
  handleSSLCancel,
  handleSSLIPN,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer initiates SSLCommerz payment for an order
router.post('/sslcommerz/init', protect, initiateOrderPayment);

// SSLCommerz Callbacks (Accepts POST and GET)
router.post('/sslcommerz/success', handleSSLSuccess);
router.get('/sslcommerz/success', handleSSLSuccess);

router.post('/sslcommerz/fail', handleSSLFail);
router.get('/sslcommerz/fail', handleSSLFail);

router.post('/sslcommerz/cancel', handleSSLCancel);
router.get('/sslcommerz/cancel', handleSSLCancel);

router.post('/sslcommerz/ipn', handleSSLIPN);

export default router;
