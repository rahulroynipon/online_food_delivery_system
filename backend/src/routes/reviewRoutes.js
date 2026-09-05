import express from 'express';
import {
  createReview,
  getReviewByOrderId,
  getRestaurantReviews,
  getMyRestaurantReviews,
  getMyRiderReviews,
  getCustomerReviews,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public restaurant review list
router.get('/restaurant/:restaurantId', getRestaurantReviews);

// Protected routes
router.post('/', protect, createReview);
router.get('/order/:orderId', protect, getReviewByOrderId);
router.get('/my-restaurant', protect, getMyRestaurantReviews);
router.get('/my-rider', protect, getMyRiderReviews);
router.get('/my-reviews', protect, getCustomerReviews);

export default router;
