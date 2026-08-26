import express from 'express';
import {
  getMyCategories,
  createRestaurantCategory,
  updateRestaurantCategory,
  deleteRestaurantCategory,
  toggleCategoryStatus
} from '../controllers/restaurantCategoryController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Restrict all restaurant categories routes to logged-in Restaurant Owners
router.use(protect, authorize('RESTAURANT'));

router.route('/')
  .get(getMyCategories)
  .post(upload.single('image'), createRestaurantCategory);

router.route('/:slug')
  .put(upload.single('image'), updateRestaurantCategory)
  .delete(deleteRestaurantCategory);

router.route('/:slug/status')
  .put(toggleCategoryStatus);

export default router;
