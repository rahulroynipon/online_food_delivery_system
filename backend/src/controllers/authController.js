import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { User } from '../models/index.js';
import { comparePassword, hashPassword } from '../utils/hash.js';
import { sendVerificationEmail } from '../utils/email.js';

// Helper to sign JWT Token
const generateToken = (id, email, role, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : env.jwt.expiresIn;
  return jwt.sign({ id, email, role }, env.jwt.secret, {
    expiresIn,
  });
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Compare passwords using hash utility
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const token = generateToken(user.id, user.email, user.role, rememberMe);

    // Exclude password from output
    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Public
 */
export const logoutUser = async (req, res, next) => {
  try {
    // Send standard stateless logout response
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Clear your token client-side.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new customer user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, phone, password).',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email address already exists.',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create User with role CUSTOMER and status ACTIVE
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    // Exclude password from output
    const userObj = user.toJSON();
    delete userObj.password;

    // Send welcome/verification email asynchronously
    const host = req.get('host');
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const clientUrl = isLocal ? 'http://localhost:5173/login' : `${req.protocol}://${host}/login`;
    sendVerificationEmail(user.email, user.name, clientUrl).catch((err) => {
      console.error('[Auth] Error sending registration verification email:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};
