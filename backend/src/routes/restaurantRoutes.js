import express from 'express';
import {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
} from '../controllers/restaurantController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Restaurants]
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
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: Pizza Palace
 *               address:
 *                 type: string
 *                 example: 123 Main St, New York
 *               phone:
 *                 type: string
 *                 example: +1555123456
 *               cuisine:
 *                 type: string
 *                 example: Italian
 *     responses:
 *       201:
 *         description: Restaurant created
 *       403:
 *         description: Not authorized
 *   get:
 *     summary: Get all restaurants
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: List of restaurants
 */
router.route('/')
  .post(protect, authorize('restaurant_owner', 'admin'), createRestaurant)
  .get(getRestaurants);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     summary: Get restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details
 *       404:
 *         description: Restaurant not found
 *   put:
 *     summary: Update a restaurant
 *     tags: [Restaurants]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               cuisine:
 *                 type: string
 *     responses:
 *       200:
 *         description: Restaurant updated
 *       403:
 *         description: Forbidden
 *   delete:
 *     summary: Delete a restaurant
 *     tags: [Restaurants]
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
 *         description: Restaurant deleted
 */
router.route('/:id')
  .get(getRestaurantById)
  .put(protect, authorize('restaurant_owner', 'admin'), updateRestaurant)
  .delete(protect, authorize('restaurant_owner', 'admin'), deleteRestaurant);

export default router;
