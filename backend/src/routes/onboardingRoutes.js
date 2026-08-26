import express from 'express';
import { 
   applyAsRestaurant, 
   applyAsRider, 
   getApplications, 
   approveRestaurant, 
   rejectRestaurant, 
   approveRider, 
   rejectRider,
   updateRestaurant,
   updateRider
} from '../controllers/onboardingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/onboarding/restaurant:
 *   post:
 *     summary: Submit Restaurant onboarding application
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantName
 *               - ownerName
 *               - email
 *               - phone
 *               - description
 *               - address
 *               - deliveryZoneId
 *             properties:
 *               restaurantName:
 *                 type: string
 *                 example: Tasty Pizza
 *               ownerName:
 *                 type: string
 *                 example: John Dough
 *               email:
 *                 type: string
 *                 example: john@tastypizza.com
 *               phone:
 *                 type: string
 *                 example: "+15550188"
 *               description:
 *                 type: string
 *                 example: Authentic hand-tossed Neapolitan pizzas and Italian pasta.
 *               address:
 *                 type: string
 *                 example: 742 Evergreen Terrace, Springfield
 *               deliveryZoneId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Validation error or account already exists
 */
router.post('/restaurant', applyAsRestaurant);

/**
 * @swagger
 * /api/v1/onboarding/rider:
 *   post:
 *     summary: Submit Rider onboarding application
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *               - vehicleType
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Flash Gordon
 *               email:
 *                 type: string
 *                 example: flash@delivery.com
 *               phone:
 *                 type: string
 *                 example: "+15550288"
 *               vehicleType:
 *                 type: string
 *                 enum: [BICYCLE, MOTORBIKE, CAR]
 *                 example: MOTORBIKE
 *               licenseNumber:
 *                 type: string
 *                 example: DL-12345
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Validation error or account already exists
 */
router.post('/rider', applyAsRider);

/**
 * @desc    Get all pending applications (Admin Only)
 */
router.get('/applications', protect, authorize('ADMIN'), getApplications);

/**
 * @desc    Approve/Reject Restaurant (Admin Only)
 */
router.post('/applications/restaurant/:id/approve', protect, authorize('ADMIN'), approveRestaurant);
router.post('/applications/restaurant/:id/reject', protect, authorize('ADMIN'), rejectRestaurant);
router.put('/applications/restaurant/:id', protect, authorize('ADMIN'), updateRestaurant);

/**
 * @desc    Approve/Reject Rider (Admin Only)
 */
router.post('/applications/rider/:id/approve', protect, authorize('ADMIN'), approveRider);
router.post('/applications/rider/:id/reject', protect, authorize('ADMIN'), rejectRider);
router.put('/applications/rider/:id', protect, authorize('ADMIN'), updateRider);

export default router;
