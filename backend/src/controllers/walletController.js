import { WalletTransaction, User } from '../models/index.js';

/**
 * @desc    Get current user's wallet balance and transactions
 * @route   GET /api/v1/wallets/balance
 * @access  Private (Riders/Merchants/Admins)
 */
export const getWalletData = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const transactions = await WalletTransaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      walletBalance: user.walletBalance,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin triggers restaurant payout or rider settlement
 * @route   POST /api/v1/wallets/payout
 * @access  Private/Admin
 */
export const processWalletAction = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access Denied: Only administrators can settle wallet balances.' });
    }

    const { userId, type, amount, description } = req.body; 

    if (!userId || !type || !amount) {
      return res.status(400).json({ success: false, message: 'Please provide userId, type (PAYOUT or SETTLEMENT), and amount.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Target user account not found.' });
    }

    const actionAmount = Number(amount);
    let ledgerAmount = 0;
    let descriptionText = description || '';

    if (type === 'PAYOUT') {
      ledgerAmount = -actionAmount;
      if (!descriptionText) {
        descriptionText = `Admin payout settlement executed. Transfer of ৳${actionAmount.toFixed(2)}`;
      }
    } else if (type === 'SETTLEMENT') {
      ledgerAmount = actionAmount;
      if (!descriptionText) {
        descriptionText = `Rider cash collection settlement received. Paid ৳${actionAmount.toFixed(2)} to platform`;
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid settlement type. Must be PAYOUT or SETTLEMENT.' });
    }

    const newBalance = Number(user.walletBalance) + ledgerAmount;
    await user.update({ walletBalance: newBalance });

    const transaction = await WalletTransaction.create({
      userId: user.id,
      amount: ledgerAmount,
      type,
      description: descriptionText,
    });

    return res.status(200).json({
      success: true,
      message: 'Settlement transaction logged successfully.',
      walletBalance: user.walletBalance,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all wallet balances for admin overview
 * @route   GET /api/v1/wallets/admin-overview
 * @access  Private/Admin
 */
export const getAdminWalletOverview = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access Denied.' });
    }

    const merchants = await User.findAll({
      where: { role: 'RESTAURANT' },
      attributes: ['id', 'name', 'email', 'walletBalance'],
    });

    const riders = await User.findAll({
      where: { role: 'RIDER' },
      attributes: ['id', 'name', 'email', 'walletBalance'],
    });

    return res.status(200).json({
      success: true,
      merchants,
      riders,
    });
  } catch (error) {
    next(error);
  }
};
