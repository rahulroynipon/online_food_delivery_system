import { Notification, User } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * @desc    Get all notifications (latest 10)
 * @route   GET /api/v1/notifications
 * @access  Private (Admin or Restaurant)
 */
export const getNotifications = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'ADMIN') {
      where[Op.or] = [
        { userId: null },
        { userId: req.user.id }
      ];
    } else {
      where.userId = req.user.id;
    }

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private (Admin or Restaurant)
 */
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    // Role verification: Non-admins can only mark their own notifications as read
    if (req.user.role !== 'ADMIN' && notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this notification.',
      });
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private (Admin or Restaurant)
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const where = { read: false };
    if (req.user.role === 'ADMIN') {
      where[Op.or] = [
        { userId: null },
        { userId: req.user.id }
      ];
    } else {
      where.userId = req.user.id;
    }

    await Notification.update(
      { read: true },
      { where }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all notifications (delete them)
 * @route   DELETE /api/v1/notifications
 * @access  Private (Admin or Restaurant)
 */
export const clearAllNotifications = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'ADMIN') {
      where[Op.or] = [
        { userId: null },
        { userId: req.user.id }
      ];
    } else {
      where.userId = req.user.id;
    }

    await Notification.destroy({ where });

    return res.status(200).json({
      success: true,
      message: 'All notifications cleared.',
    });
  } catch (error) {
    next(error);
  }
};
