import express from 'express';
import {
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from '../controllers/userAddressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All address routes require authentication (protect middleware)
router.use(protect);

router.route('/')
  .get(getUserAddresses)
  .post(createUserAddress);

router.route('/:id')
  .put(updateUserAddress)
  .delete(deleteUserAddress);

export default router;
