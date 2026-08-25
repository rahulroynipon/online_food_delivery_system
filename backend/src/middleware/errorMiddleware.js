import env from '../config/env.js';

/**
 * Global centralized error-handling middleware with Sequelize validation mapping.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for development
  console.error('Error Details:', err);

  // Sequelize Unique Constraint Violations
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map((e) => e.path).join(', ');
    error.message = `Duplicate field value entered: ${fields}.`;
    error.statusCode = 400;
  }

  // Sequelize Input Validation Failures
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => `${e.path}: ${e.message}`).join(', ');
    error.message = `Validation Error: ${messages}`;
    error.statusCode = 400;
  }

  // Sequelize Foreign Key Violations
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error.message = 'Referenced resource does not exist (Foreign Key Constraint).';
    error.statusCode = 400;
  }

  // Database Connection Issues
  if (err.name === 'SequelizeConnectionRefusedError') {
    error.message = 'Unable to connect to the database.';
    error.statusCode = 500;
  }

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
