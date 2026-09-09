import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import swaggerSpec from './config/swagger.js';
import errorHandler from './middleware/errorMiddleware.js';
import sequelize from './config/db.js';
import env from './config/env.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import deliveryZoneRoutes from './routes/deliveryZoneRoutes.js';
import platformCategoryRoutes from './routes/platformCategoryRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import restaurantCategoryRoutes from './routes/restaurantCategoryRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import addonRoutes from './routes/addonRoutes.js';
import userAddressRoutes from './routes/userAddressRoutes.js';
import publicRestaurantRoutes from './routes/publicRestaurantRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

const app = express();

// Define API version prefix constant
const API_PREFIX = '/api/v1';

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Folder for Uploads
app.use(`${API_PREFIX}/uploads`, express.static('uploads'));

// API Swagger Documentation
app.use(`${API_PREFIX}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/delivery-zones`, deliveryZoneRoutes);
app.use(`${API_PREFIX}/platform-categories`, platformCategoryRoutes);
app.use(`${API_PREFIX}/onboarding`, onboardingRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/restaurant-categories`, restaurantCategoryRoutes);
app.use(`${API_PREFIX}/foods`, foodRoutes);
app.use(`${API_PREFIX}/addons`, addonRoutes);
app.use(`${API_PREFIX}/user-addresses`, userAddressRoutes);
app.use(`${API_PREFIX}/public/restaurants`, publicRestaurantRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/wallets`, walletRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);

// Status Endpoint
app.get(`${API_PREFIX}/status`, async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (err) {
    dbError = err.message;
  }

  res.status(200).json({
    success: true,
    message: 'Backend API is active.',
    database: dbStatus,
    ...(dbError && { dbError }),
    environment: env.NODE_ENV,
    timestamp: new Date(),
  });
});

// Root path
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Online Food Delivery API backend is running.',
    status: `${API_PREFIX}/status`,
    docs: `${API_PREFIX}/api-docs`,
    timestamp: new Date(),
  });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

export { API_PREFIX };
export default app;
