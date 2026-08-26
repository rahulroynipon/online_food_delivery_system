import express from 'express';
import {
  getAddons,
  createAddon,
  updateAddon,
  deleteAddon,
  toggleAddonStatus,
} from '../controllers/addonController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { UserRole } from '../enums/index.js';

const router = express.Router();

// All routes require authentication & restaurant merchant role
router.use(protect, authorize(UserRole.RESTAURANT));

router.route('/')
  .get(getAddons)
  .post(upload.single('image'), createAddon);

router.route('/:slug')
  .put(upload.single('image'), updateAddon)
  .delete(deleteAddon);

router.route('/:slug/status')
  .put(toggleAddonStatus);

export default router;
