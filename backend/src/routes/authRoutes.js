import express from 'express';
import { loginUser, logoutUser, getMe, registerUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user and sign JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@fooddelivery.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', logoutUser);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Fetch current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new customer account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 example: jane@example.com
 *               phone:
 *                 type: string
 *                 example: "+8801700000000"
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Registered successfully
 *       400:
 *         description: Validation error or email already in use
 */
router.post('/register', registerUser);

export default router;
