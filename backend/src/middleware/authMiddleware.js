import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Middleware to protect routes and verify JWT tokens.
 */
export const protect = (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, env.jwt.secret);

    // Attach decoded user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token is invalid or expired.',
    });
  }
};

/**
 * Middleware to restrict access to specific user roles.
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'customer', 'restaurant_owner', 'delivery_partner')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'unknown'}' is not authorized to access this route.`,
      });
    }
    next();
  };
};
