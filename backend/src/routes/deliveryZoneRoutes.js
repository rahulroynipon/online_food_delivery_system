import express from 'express';
import {
  createDeliveryZone,
  getDeliveryZones,
  getDeliveryZoneBySlug,
  updateDeliveryZone,
  deleteDeliveryZone,
  geocodeAddress
} from '../controllers/deliveryZoneController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { UserRole } from '../enums/index.js';

const router = express.Router();

router.get('/geocode', protect, authorize(UserRole.ADMIN), geocodeAddress);

/**
 * @swagger
 * /api/v1/delivery-zones:
 *   post:
 *     summary: Create a new delivery zone
 *     tags: [Delivery Zones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Downtown Core
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 default: ACTIVE
 *                 example: ACTIVE
 *     responses:
 *       201:
 *         description: Created successfully
 *       403:
 *         description: Forbidden (Admin only)
 *   get:
 *     summary: Fetch all delivery zones
 *     tags: [Delivery Zones]
 *     responses:
 *       200:
 *         description: Success
 */
router.route('/')
  .post(protect, authorize(UserRole.ADMIN), createDeliveryZone)
  .get(getDeliveryZones);

/**
 * @swagger
 * /api/v1/delivery-zones/{slug}:
 *   get:
 *     summary: Fetch delivery zone details by Slug
 *     tags: [Delivery Zones]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update delivery zone details by Slug
 *     tags: [Delivery Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Updated successfully
 *   delete:
 *     summary: Delete a delivery zone by Slug
 *     tags: [Delivery Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.route('/:slug')
  .get(getDeliveryZoneBySlug)
  .put(protect, authorize(UserRole.ADMIN), updateDeliveryZone)
  .delete(protect, authorize(UserRole.ADMIN), deleteDeliveryZone);

export default router;
