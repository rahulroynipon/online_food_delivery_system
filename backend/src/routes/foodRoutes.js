import express from 'express';
import {
  addFoodItem,
  getFoodItems,
  getFoodItemById,
  updateFoodItem,
  deleteFoodItem,
} from '../controllers/foodController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/food:
 *   post:
 *     summary: Add a new food item to a restaurant
 *     tags: [Food Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - name
 *               - price
 *             properties:
 *               restaurantId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: Double Cheese Burger
 *               description:
 *                 type: string
 *                 example: Juicy beef patty with double cheddar cheese and secret sauce
 *               price:
 *                 type: number
 *                 example: 9.99
 *               category:
 *                 type: string
 *                 example: Main Course
 *               isAvailable:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Food item added
 *       403:
 *         description: Forbidden
 */
router.post('/', protect, authorize('restaurant_owner', 'admin'), addFoodItem);

/**
 * @swagger
 * /api/food/restaurant/{restaurantId}:
 *   get:
 *     summary: Get all food items for a restaurant
 *     tags: [Food Items]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of food items
 */
router.get('/restaurant/:restaurantId', getFoodItems);

/**
 * @swagger
 * /api/food/{id}:
 *   get:
 *     summary: Get food item by ID
 *     tags: [Food Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Food item details
 *       404:
 *         description: Food item not found
 *   put:
 *     summary: Update a food item
 *     tags: [Food Items]
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
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Food item updated
 *   delete:
 *     summary: Delete a food item
 *     tags: [Food Items]
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
 *         description: Food item deleted
 */
router.route('/:id')
  .get(getFoodItemById)
  .put(protect, authorize('restaurant_owner', 'admin'), updateFoodItem)
  .delete(protect, authorize('restaurant_owner', 'admin'), deleteFoodItem);

export default router;
