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
