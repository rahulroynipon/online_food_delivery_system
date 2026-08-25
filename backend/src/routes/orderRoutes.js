import express from 'express';
import {
  placeOrder,
  getOrderById,
  getMyOrders,
  getRestaurantOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
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
 *               - items
 *               - totalPrice
 *               - deliveryAddress
 *             properties:
 *               restaurantId:
 *                 type: integer
 *                 example: 1
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     foodItemId:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Double Cheese Burger
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     price:
 *                       type: number
 *                       example: 9.99
 *               totalPrice:
 *                 type: number
 *                 example: 19.98
 *               deliveryAddress:
 *                 type: string
 *                 example: 456 Elm St, New York
 *     responses:
 *       201:
 *         description: Order placed successfully
 */
router.post('/', protect, authorize('customer', 'admin'), placeOrder);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Get logged-in user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 */
router.get('/my-orders', protect, authorize('customer', 'admin'), getMyOrders);

/**
 * @swagger
 * /api/orders/restaurant/{restaurantId}:
 *   get:
 *     summary: Get all orders for a restaurant
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of orders for restaurant
 *       403:
 *         description: Forbidden
 */
router.get('/restaurant/:restaurantId', protect, authorize('restaurant_owner', 'admin'), getRestaurantOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get details of an order
 *     tags: [Orders]
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
 *         description: Order details
 *       403:
 *         description: Forbidden
 */
router.get('/:id', protect, getOrderById);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update status of an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [placed, preparing, out_for_delivery, delivered, cancelled]
 *                 example: preparing
 *     responses:
 *       200:
 *         description: Order status updated
 *       403:
 *         description: Forbidden
 */
router.put('/:id/status', protect, authorize('restaurant_owner', 'delivery_partner', 'admin'), updateOrderStatus);

export default router;
