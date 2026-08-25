import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import swaggerSpec from './config/swagger.js';
import errorHandler from './middleware/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// API Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API is running cleanly.',
    timestamp: new Date(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/orders', orderRoutes);

// Root path redirects to API docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Centralized Error Handler Middleware
app.use(errorHandler);

export default app;
