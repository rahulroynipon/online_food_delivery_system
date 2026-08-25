import express from 'express';
import {
  createPlatformCategory,
  getPlatformCategories,
  getPlatformCategoryById,
  updatePlatformCategory,
  deletePlatformCategory,
} from '../controllers/platformCategoryController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {UserRole} from '../enums/index.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/platform-categories:
 *   post:
 *     summary: Create a platform category (with optional image upload)
 *     tags: [Platform Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Fast Food
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 default: ACTIVE
 *                 example: ACTIVE
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created successfully
 *       403:
 *         description: Forbidden (Admin only)
 *   get:
 *     summary: Fetch all platform categories
 *     tags: [Platform Categories]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .post(protect, authorize(UserRole.ADMIN), upload.single('image'), createPlatformCategory)
  .get(getPlatformCategories);

/**
 * @swagger
 * /api/v1/platform-categories/{id}:
 *   get:
 *     summary: Fetch Platform Category details by ID
 *     tags: [Platform Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update platform category details (with optional new image file)
 *     tags: [Platform Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated successfully
 *   delete:
 *     summary: Delete a platform category
 *     tags: [Platform Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.route('/:id')
  .get(getPlatformCategoryById)
  .put(protect, authorize(UserRole.ADMIN), upload.single('image'), updatePlatformCategory)
  .delete(protect, authorize(UserRole.ADMIN), deletePlatformCategory);

export default router;
