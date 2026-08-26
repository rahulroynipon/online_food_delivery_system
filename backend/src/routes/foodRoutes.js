import express from 'express';
import {
  getFoods,
  createFood,
  updateFood,
  deleteFood,
  toggleFoodStatus,
} from '../controllers/foodController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { UserRole } from '../enums/index.js';

const router = express.Router();

// All routes require authentication & restaurant merchant role
router.use(protect, authorize(UserRole.RESTAURANT));

router.route('/')
  .get(getFoods)
  .post(upload.single('image'), createFood);

router.route('/:id')
  .put(upload.single('image'), updateFood)
  .delete(deleteFood);

router.route('/:id/status')
  .put(toggleFoodStatus);

export default router;
