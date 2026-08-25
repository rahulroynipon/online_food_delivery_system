import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

/**
 * @desc    Place a new order
 * @route   POST /api/orders
 * @access  Private (Customer, Admin)
 */
export const placeOrder = async (req, res, next) => {
  try {
    const { restaurantId, items, totalPrice, deliveryAddress } = req.body;

    if (!restaurantId || !items || !totalPrice || !deliveryAddress) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Please provide restaurantId, items, totalPrice, and deliveryAddress.',
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Items list must be a non-empty array.' });
    }

    const order = await Order.create({
      customerId: req.user.id,
      restaurantId,
      items,
      totalPrice,
      deliveryAddress,
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order details by ID
 * @route   GET /api/orders/:id
 * @access  Private (Customer, Owner, Rider, Admin)
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify authorized party: Customer who placed it, Owner of the restaurant, or Admin
    const restaurant = await Restaurant.findByPk(order.restaurantId);
    const isCustomer = order.customerId === req.user.id;
    const isOwner = restaurant && restaurant.ownerId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to view this order.' });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's (customer) orders
 * @route   GET /api/orders/my-orders
 * @access  Private (Customer)
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { customerId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders for a specific restaurant
 * @route   GET /api/orders/restaurant/:restaurantId
 * @access  Private (Owner, Admin)
 */
export const getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Access control: only owner or admin
    if (restaurant.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to view these orders.' });
    }

    const orders = await Order.findAll({
      where: { restaurantId: req.params.restaurantId },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Owner, Rider, Admin)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Please provide a valid status: ${allowedStatuses.join(', ')}`,
        });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Access control
    const restaurant = await Restaurant.findByPk(order.restaurantId);
    const isOwner = restaurant && restaurant.ownerId === req.user.id;
    const isRider = req.user.role === 'delivery_partner';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isRider && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to update this order status.' });
    }

    await order.update({ status });

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'`,
      order,
    });
  } catch (error) {
    next(error);
  }
};
