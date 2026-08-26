import express from 'express';
import {
  getFoods,
  createFood,
  updateFood,
  deleteFood,
  toggleFoodStatus,
  getFoodBySlug,
} from '../controllers/foodController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { UserRole } from '../enums/index.js';

const router = express.Router();

// All routes require authentication & restaurant merchant role
router.use(protect, authorize(UserRole.RESTAURANT));

router.route('/')
  .get(getFoods)
  .post(upload.any(), createFood);

router.route('/details/:slug')
  .get(getFoodBySlug);

router.route('/:id')
  .put(upload.any(), updateFood)
  .delete(deleteFood);

router.route('/:id/status')
  .put(toggleFoodStatus);

export default router;
