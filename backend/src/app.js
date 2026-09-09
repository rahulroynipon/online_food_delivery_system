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

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Define API version prefix constant
const API_PREFIX = '/api/v1';

// Vercel Serverless Path Normalization
app.use((req, res, next) => {
  if (req.url === '/api/index.js' || req.url === '/api/index' || req.url === '/api') {
    const matchedPath = req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'];
    if (matchedPath && !matchedPath.includes('/api/index')) {
      req.url = matchedPath;
    } else {
      req.url = '/';
    }
  }
  next();
});

// Standard Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Folder for Uploads (points reliably to backend/uploads/)
const uploadsPath = path.join(__dirname, '../uploads');
app.use(`${API_PREFIX}/uploads`, express.static(uploadsPath));

// Swagger UI Options with CDN assets for Serverless compatibility
const swaggerUiOptions = {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.js',
  ],
  customSiteTitle: 'BiteSpeed API Docs',
};

// API Swagger Documentation
app.use(`${API_PREFIX}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

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

// Catch-all 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl || req.url}`,
    endpoints: {
      status: `${API_PREFIX}/status`,
      apiDocs: `${API_PREFIX}/api-docs`,
      root: '/',
    },
  });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

export { API_PREFIX };
export default app;
