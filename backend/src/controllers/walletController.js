import { WalletTransaction, WithdrawalRequest, User, Order, OrderItem, Restaurant, Notification } from '../models/index.js';
import { sendToUser, broadcastToAdmins } from '../websocket/index.js';
import { Op } from 'sequelize';

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

    const pendingWithdrawals = await WithdrawalRequest.findAll({
      where: {
        userId: req.user.id,
        status: 'PENDING'
      },
      attributes: ['amount']
    });

    const pendingWithdrawalAmount = pendingWithdrawals.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );

    const grossBalance = parseFloat(user.walletBalance || 0);
    const availableBalance = Math.max(0, grossBalance - pendingWithdrawalAmount);

    const transactions = await WalletTransaction.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'address'] },
            { model: User, as: 'user', attributes: ['id', 'name', 'phone'] },
            { model: User, as: 'rider', attributes: ['id', 'name', 'phone'] },
            { model: OrderItem, as: 'items' }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      walletBalance: user.walletBalance,
      pendingWithdrawalAmount,
      availableBalance,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit a new withdrawal/payout request
 * @route   POST /api/v1/wallets/withdrawals
 * @access  Private (Rider / Restaurant)
 */
export const createWithdrawalRequest = async (req, res, next) => {
  try {
    const { 
      amount, 
      paymentMethod, 
      accountNumber, 
      accountType, 
      bankName, 
      branchName, 
      accountHolderName, 
      notes 
    } = req.body;

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid withdrawal amount greater than 0.' });
    }

    if (!paymentMethod || !accountNumber) {
      return res.status(400).json({ success: false, message: 'Please specify payment method and account number.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const currentBalance = parseFloat(user.walletBalance || 0);

    // Calculate sum of existing pending withdrawal requests
    const pendingWithdrawals = await WithdrawalRequest.findAll({
      where: {
        userId: user.id,
        status: 'PENDING'
      },
      attributes: ['amount']
    });

    const pendingAmount = pendingWithdrawals.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );

    const availableToWithdraw = Math.max(0, currentBalance - pendingAmount);

    if (withdrawAmount > availableToWithdraw) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient available balance. You have ৳${availableToWithdraw.toFixed(2)} available for new payout requests (৳${pendingAmount.toFixed(2)} is already under review in pending requests out of ৳${currentBalance.toFixed(2)} total balance).` 
      });
    }

    // Check if user has too many pending withdrawal requests (e.g. max 3 pending)
    const pendingCount = await WithdrawalRequest.count({
      where: {
        userId: user.id,
        status: 'PENDING'
      }
    });

    if (pendingCount >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have multiple pending withdrawal requests under review.' 
      });
    }

    const request = await WithdrawalRequest.create({
      userId: user.id,
      amount: withdrawAmount,
      paymentMethod,
      accountNumber,
      accountType: accountType || 'PERSONAL',
      bankName: bankName || null,
      branchName: branchName || null,
      accountHolderName: accountHolderName || null,
      status: 'PENDING',
      notes: notes || null,
    });

    // Notify Admins
    try {
      await Notification.create({
        userId: user.id,
        event: 'GENERAL',
        message: `Payout request of ৳${withdrawAmount.toFixed(2)} via ${paymentMethod} submitted for admin review.`
      });

      broadcastToAdmins('WITHDRAWAL_REQUEST_CREATED', {
        id: request.id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        amount: withdrawAmount,
        paymentMethod,
        accountNumber,
        createdAt: request.createdAt,
      });
    } catch (notifErr) {
      console.warn('[Withdrawal Notification Error]:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's own withdrawal requests
 * @route   GET /api/v1/wallets/withdrawals/my
 * @access  Private
 */
export const getMyWithdrawals = async (req, res, next) => {
  try {
    const requests = await WithdrawalRequest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all withdrawal requests for admin review
 * @route   GET /api/v1/wallets/withdrawals/admin
 * @access  Private/Admin
 */
export const getAdminWithdrawals = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access Denied: Only administrators can view withdrawal requests.' });
    }

    const { status, role } = req.query;
    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const userWhere = {};
    if (role && role !== 'ALL') {
      userWhere.role = role;
    }

    const requests = await WithdrawalRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          attributes: ['id', 'name', 'email', 'phone', 'role', 'walletBalance'],
          include: [
            { model: Restaurant, as: 'restaurant', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin approve or reject withdrawal request
 * @route   PATCH /api/v1/wallets/withdrawals/:id/status
 * @access  Private/Admin
 */
export const updateWithdrawalStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access Denied.' });
    }

    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be APPROVED or REJECTED.' });
    }

    const request = await WithdrawalRequest.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `This request has already been ${request.status.toLowerCase()}.` });
    }

    const targetUser = await User.findByPk(request.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user account not found.' });
    }

    if (status === 'APPROVED') {
      const payoutAmount = parseFloat(request.amount);
      const currentBal = parseFloat(targetUser.walletBalance || 0);

      if (currentBal < payoutAmount) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot approve payout: User's current balance (৳${currentBal.toFixed(2)}) is less than the requested amount (৳${payoutAmount.toFixed(2)}).` 
        });
      }

      // Debit balance
      const newBalance = currentBal - payoutAmount;
      await targetUser.update({ walletBalance: newBalance });

      // Create ledger transaction
      const description = `Payout of ৳${payoutAmount.toFixed(2)} disbursed via ${request.paymentMethod} (${request.accountNumber})${adminNote ? ` • Note: ${adminNote}` : ''}`;
      await WalletTransaction.create({
        userId: targetUser.id,
        amount: -payoutAmount,
        type: 'PAYOUT',
        description,
      });

      // Update request status
      await request.update({
        status: 'PROCESSED',
        adminNote: adminNote || 'Approved and disbursed.',
        processedAt: new Date(),
        processedBy: req.user.id,
      });

      // Notify User
      try {
        await Notification.create({
          userId: targetUser.id,
          event: 'GENERAL',
          message: `✅ Payout Approved! ৳${payoutAmount.toFixed(2)} has been transferred to your ${request.paymentMethod} account (${request.accountNumber}).`
        });

        sendToUser(targetUser.id, 'WITHDRAWAL_STATUS_UPDATED', {
          id: request.id,
          status: 'PROCESSED',
          amount: payoutAmount,
          newBalance,
          message: `Payout of ৳${payoutAmount.toFixed(2)} processed.`
        });
      } catch (wsErr) {
        console.warn('[Notification error]:', wsErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Withdrawal approved and payout logged successfully.',
        request,
        walletBalance: newBalance,
      });
    }

    // Rejection
    await request.update({
      status: 'REJECTED',
      adminNote: adminNote || 'Rejected by administrator.',
      processedAt: new Date(),
      processedBy: req.user.id,
    });

    try {
      await Notification.create({
        userId: targetUser.id,
        event: 'GENERAL',
        message: `❌ Withdrawal request of ৳${parseFloat(request.amount).toFixed(2)} was rejected. ${adminNote ? `Reason: ${adminNote}` : ''}`
      });

      sendToUser(targetUser.id, 'WITHDRAWAL_STATUS_UPDATED', {
        id: request.id,
        status: 'REJECTED',
        amount: parseFloat(request.amount),
        message: `Withdrawal request was rejected.`
      });
    } catch (wsErr) {
      console.warn('[Notification error]:', wsErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Withdrawal request rejected.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin triggers manual restaurant payout or rider settlement
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
