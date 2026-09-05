import { Order, User, Restaurant, Notification } from '../models/index.js';
import { initSSLCommerzPayment, validateSSLCommerzPayment, SSL_CONFIG } from '../services/sslcommerzService.js';
import { sendToUser, broadcastToAdmins } from '../websocket/index.js';

/**
 * @desc    Initiate SSLCommerz payment for an order
 * @route   POST /api/v1/payments/sslcommerz/init
 * @access  Private (Customer)
 */
export const initiateOrderPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Please provide orderId.' });
    }

    const order = await Order.findByPk(orderId, {
      include: [
        { model: Restaurant, as: 'restaurant' },
        { model: User, as: 'user' },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized to pay for this order.' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'This order has already been paid.' });
    }

    const paymentResult = await initSSLCommerzPayment({
      order,
      user: order.user,
      address: { addressLine1: order.deliveryAddressText },
    });

    return res.status(200).json({
      success: true,
      message: 'SSLCommerz payment session initialized.',
      gatewayUrl: paymentResult.gatewayUrl,
      tranId: paymentResult.tranId,
      mode: paymentResult.mode,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle SSLCommerz Success callback
 * @route   POST /api/v1/payments/sslcommerz/success
 * @access  Public (SSLCommerz IPN / Callback)
 */
export const handleSSLSuccess = async (req, res, next) => {
  try {
    const { tran_id, val_id } = req.body || {};
    const orderId = req.query.order_id || req.body.order_id || (tran_id ? tran_id.split('_')[1] : null);

    if (!orderId) {
      return res.redirect(`${SSL_CONFIG.frontendUrl}/orders?payment=unknown`);
    }

    const order = await Order.findByPk(orderId, {
      include: [
        { model: Restaurant, as: 'restaurant' },
        { model: User, as: 'user' },
      ],
    });

    if (!order) {
      return res.redirect(`${SSL_CONFIG.frontendUrl}/orders?payment=not_found`);
    }

    // Validate payment
    await validateSSLCommerzPayment({ val_id, tran_id });

    // Mark order as PAID
    await order.update({
      paymentStatus: 'PAID',
    });

    // Real-time notifications
    try {
      if (order.restaurant?.userId) {
        await Notification.create({
          userId: order.restaurant.userId,
          event: 'ORDER',
          message: `💳 Order #${order.id} payment verified online (৳${parseFloat(order.total).toFixed(2)} via SSLCommerz).`,
        });

        sendToUser(order.restaurant.userId, 'ORDER_STATUS_CHANGED', {
          orderId: order.id,
          paymentStatus: 'PAID',
        });
      }

      broadcastToAdmins('ORDER_STATUS_CHANGED', {
        orderId: order.id,
        paymentStatus: 'PAID',
      });
    } catch (wsErr) {
      console.warn('[SSLCommerz WS Error]:', wsErr.message);
    }

    return res.redirect(`${SSL_CONFIG.frontendUrl}/order-tracking?id=${order.id}&payment=success`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle SSLCommerz Fail callback
 * @route   POST /api/v1/payments/sslcommerz/fail
 * @access  Public
 */
export const handleSSLFail = async (req, res, next) => {
  try {
    const { tran_id } = req.body || {};
    const orderId = req.query.order_id || req.body.order_id || (tran_id ? tran_id.split('_')[1] : null);

    if (orderId) {
      const order = await Order.findByPk(orderId);
      if (order && order.paymentStatus !== 'PAID') {
        await order.update({ paymentStatus: 'FAILED' });
      }
    }

    return res.redirect(`${SSL_CONFIG.frontendUrl}/checkout?error=payment_failed&orderId=${orderId || ''}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle SSLCommerz Cancel callback
 * @route   POST /api/v1/payments/sslcommerz/cancel
 * @access  Public
 */
export const handleSSLCancel = async (req, res, next) => {
  try {
    const { tran_id } = req.body || {};
    const orderId = req.query.order_id || req.body.order_id || (tran_id ? tran_id.split('_')[1] : null);

    return res.redirect(`${SSL_CONFIG.frontendUrl}/checkout?error=payment_cancelled&orderId=${orderId || ''}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle SSLCommerz IPN (Server-to-Server Webhook)
 * @route   POST /api/v1/payments/sslcommerz/ipn
 * @access  Public
 */
export const handleSSLIPN = async (req, res, next) => {
  try {
    const { tran_id, val_id, status } = req.body || {};
    const orderId = tran_id ? tran_id.split('_')[1] : null;

    if (orderId && (status === 'VALID' || status === 'VALIDATED')) {
      const order = await Order.findByPk(orderId);
      if (order && order.paymentStatus !== 'PAID') {
        await order.update({ paymentStatus: 'PAID' });
      }
    }

    return res.status(200).json({ success: true, message: 'IPN processed successfully.' });
  } catch (error) {
    next(error);
  }
};
