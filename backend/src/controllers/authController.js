import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import env from '../config/env.js';
import { User, OTPVerification } from '../models/index.js';
import { comparePassword, hashPassword } from '../utils/hash.js';
import { sendVerificationEmail, sendRegistrationOTPEmail, sendPasswordResetOTPEmail } from '../utils/email.js';

// Helper to generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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

    // Verify customer status is active
    if (user.role === 'CUSTOMER' && user.status === 'PENDING') {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address first.',
        isUnverifiedCustomer: true,
        email: user.email,
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

    // Create User with role CUSTOMER and status PENDING (needs OTP verification)
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'PENDING',
    });

    // Exclude password from output
    const userObj = user.toJSON();
    delete userObj.password;

    // Generate and save registration OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any stale OTPs for this email
    await OTPVerification.destroy({ where: { email, purpose: 'REGISTRATION' } });

    await OTPVerification.create({
      email,
      otp,
      purpose: 'REGISTRATION',
      expiresAt,
    });

    // Send registration verification OTP email asynchronously
    sendRegistrationOTPEmail(user.email, user.name, otp).catch((err) => {
      console.error('[Auth] Error sending registration OTP email:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. A verification code has been sent to your email.',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Registration OTP
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and verification code.',
      });
    }

    // Find the latest valid OTP record
    const record = await OTPVerification.findOne({
      where: {
        email,
        otp,
        purpose: 'REGISTRATION',
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    // Activate the user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    await user.update({ status: 'ACTIVE' });

    // Clean up OTP codes
    await OTPVerification.destroy({ where: { email, purpose: 'REGISTRATION' } });

    return res.status(200).json({
      success: true,
      message: 'Email address verified successfully. You can now sign in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend registration/reset OTP code
 * @route   POST /api/v1/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req, res, next) => {
  try {
    const { email, purpose = 'REGISTRATION' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address.',
      });
    }

    // Verify user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account associated with this email address.',
      });
    }

    if (purpose === 'REGISTRATION' && user.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This email is already verified.',
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete stale OTPs
    await OTPVerification.destroy({ where: { email, purpose } });

    // Create new OTP code
    await OTPVerification.create({
      email,
      otp,
      purpose,
      expiresAt,
    });

    // Send email
    if (purpose === 'REGISTRATION') {
      sendRegistrationOTPEmail(email, user.name, otp).catch((err) => {
        console.error('[Auth] Error sending resend registration OTP email:', err);
      });
    } else {
      sendPasswordResetOTPEmail(email, user.name, otp).catch((err) => {
        console.error('[Auth] Error sending resend password reset OTP email:', err);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code resent successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request password reset OTP code
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address.',
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account associated with this email address.',
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old password reset OTPs
    await OTPVerification.destroy({ where: { email, purpose: 'PASSWORD_RESET' } });

    // Save OTP
    await OTPVerification.create({
      email,
      otp,
      purpose: 'PASSWORD_RESET',
      expiresAt,
    });

    // Send email
    sendPasswordResetOTPEmail(email, user.name, otp).catch((err) => {
      console.error('[Auth] Error sending password reset OTP email:', err);
    });

    return res.status(200).json({
      success: true,
      message: 'A password reset code has been sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using OTP code
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, verification code, and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Verify OTP record
    const record = await OTPVerification.findOne({
      where: {
        email,
        otp,
        purpose: 'PASSWORD_RESET',
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    // Find User
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await user.update({ password: hashedPassword });

    // If customer was unverified/pending, activate them
    if (user.role === 'CUSTOMER' && user.status === 'PENDING') {
      await user.update({ status: 'ACTIVE' });
    }

    // Clean up OTP code
    await OTPVerification.destroy({ where: { email, purpose: 'PASSWORD_RESET' } });

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};
