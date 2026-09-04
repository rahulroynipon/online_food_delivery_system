import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import swaggerSpec from './config/swagger.js';
import errorHandler from './middleware/errorMiddleware.js';

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

const app = express();

// Define API version prefix constant
const API_PREFIX = '/api/v1';

// Standard Middlewares
app.use(cors());
app.use(express.json());

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

// Status Endpoint
app.get(`${API_PREFIX}/status`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API status is active.',
    timestamp: new Date(),
  });
});

// Root path redirects to API docs
app.get('/', (req, res) => {
  res.redirect(`${API_PREFIX}/api-docs`);
});

// Centralized Error Handler Middleware
app.use(errorHandler);

export { API_PREFIX };
export default app;
