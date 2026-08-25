import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import swaggerSpec from './config/swagger.js';
import errorHandler from './middleware/errorMiddleware.js';

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

// Root path redirects to API docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Centralized Error Handler Middleware
app.use(errorHandler);

export default app;
