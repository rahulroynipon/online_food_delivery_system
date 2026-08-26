import { User } from '../models/index.js';
import { hashPassword } from '../utils/hash.js';
import { UserRole, UserStatus } from '../enums/index.js';

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private (Admin Only)
 */
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new user
 * @route   POST /api/v1/users
 * @access  Private (Admin Only)
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, role, status, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, role, and password.' });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone,
      role,
      status: status || UserStatus.ACTIVE,
      password: hashedPassword,
    });

    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/v1/users/:id
 * @access  Private (Admin Only)
 */
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { name, email, phone, role, status, password } = req.body;

    // Check email uniqueness if email is changed
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;

    if (password) {
      user.password = await hashPassword(password);
    }

    await user.save();

    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/v1/users/:id
 * @access  Private (Admin Only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Do not allow deleting own self
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own administrator account.' });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
