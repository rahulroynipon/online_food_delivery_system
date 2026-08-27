import express from 'express';
import { 
  getPublicRestaurants, 
  getPublicRestaurantBySlug,
  getPublicPopularFoods,
  getPublicFoods
} from '../controllers/publicRestaurantController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/public/restaurants:
 *   get:
 *     summary: Fetch all approved active restaurants
 *     tags: [Public Restaurants]
 *     parameters:
 *       - in: query
 *         name: zone
 *         schema:
 *           type: integer
 *         description: Filter by delivery zone ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search restaurant names (case-insensitive)
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter by platform category ID (offering foods in category)
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getPublicRestaurants);

/**
 * @swagger
 * /api/v1/public/restaurants/foods/popular:
 *   get:
 *     summary: Fetch popular active foods
 *     tags: [Public Restaurants]
 *     parameters:
 *       - in: query
 *         name: zone
 *         schema:
 *           type: integer
 *         description: Filter by delivery zone ID
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/foods/popular', getPublicPopularFoods);

/**
 * @swagger
 * /api/v1/public/restaurants/foods/search:
 *   get:
 *     summary: Search and filter foods across restaurants
 *     tags: [Public Restaurants]
 *     parameters:
 *       - in: query
 *         name: zone
 *         schema:
 *           type: integer
 *         description: Filter by delivery zone ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search food name
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter by platform category ID
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/foods/search', getPublicFoods);

/**
 * @swagger
 * /api/v1/public/restaurants/{slug}:
 *   get:
 *     summary: Fetch single restaurant profile & nested menu by slug
 *     tags: [Public Restaurants]
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
 *         description: Restaurant not found
 */
router.get('/:slug', getPublicRestaurantBySlug);

export default router;
