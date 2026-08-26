import express from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  clearAllNotifications 
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply admin protection middleware to all notification routes
router.use(protect, authorize('ADMIN'));

router.route('/')
  .get(getNotifications)
  .delete(clearAllNotifications);

router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
