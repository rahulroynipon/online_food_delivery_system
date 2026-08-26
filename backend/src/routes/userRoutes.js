import express from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { UserRole } from '../enums/index.js';

const router = express.Router();

// Apply protect & authorize admin middlewares to all routes in this file
router.use(protect);
router.use(authorize(UserRole.ADMIN));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

export default router;
