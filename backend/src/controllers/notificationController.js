import { Notification, User } from '../models/index.js';

/**
 * @desc    Get all notifications (latest 10)
 * @route   GET /api/v1/notifications
 * @access  Private (Admin Only)
 */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false, // LEFT JOIN — keeps seeded notifications with null userId
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
 * @access  Private (Admin Only)
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
 * @access  Private (Admin Only)
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { read: true },
      { where: { read: false } }
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
 * @access  Private (Admin Only)
 */
export const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.destroy({ truncate: true, cascade: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications cleared.',
    });
  } catch (error) {
    next(error);
  }
};
