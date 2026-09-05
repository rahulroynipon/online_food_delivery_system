import { Op } from 'sequelize';
import { 
  Order, 
  OrderItem, 
  OrderItemAddon, 
  User, 
  Restaurant, 
  Rider, 
  UserAddress, 
  DeliveryZone, 
  PlatformSettings,
  WalletTransaction,
  Notification 
} from '../models/index.js';
import { sendToUser, broadcastToAdmins, sendToRole } from '../websocket/index.js';

// Helper: Haversine Formula (KM)
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper: Automated Rider Assignment
export const assignRiderToOrder = async (orderOrId, excludedRiderIds = []) => {
  try {
    const order = typeof orderOrId === 'object' && orderOrId?.id
      ? orderOrId
      : await Order.findByPk(orderOrId);

    if (!order) return false;

    // Only assign if order is READY and not already accepted/delivered/cancelled
    if (order.status !== 'READY' && order.status !== 'RIDER_ASSIGNED') {
      return false;
    }

    // Get restaurant location
    const restaurant = await Restaurant.findByPk(order.restaurantId);
    if (!restaurant) return false;

    const restLat = Number(restaurant.latitude || 0);
    const restLng = Number(restaurant.longitude || 0);

    // Find all active, online and available riders
    const availableRiderProfiles = await Rider.findAll({
      where: { 
        availability: 'AVAILABLE',
        userId: { [Op.notIn]: excludedRiderIds }
      },
      include: [{ 
        model: User, 
        as: 'user', 
        where: { status: 'ACTIVE', role: 'RIDER' } 
      }]
    });

    if (availableRiderProfiles.length === 0) {
      console.log(`[Rider Match] No available riders currently for Order #${order.id}. Order remains READY and will be auto-matched once a rider comes online.`);
      return false;
    }

    // Sort riders by proximity to restaurant
    let nearestRider = null;
    let minDistance = Infinity;

    for (const rProfile of availableRiderProfiles) {
      const rLat = Number(rProfile.currentLatitude || 0);
      const rLng = Number(rProfile.currentLongitude || 0);
      const dist = (restLat && restLng && rLat && rLng) 
        ? getDistanceKm(restLat, restLng, rLat, rLng)
        : 0;

      if (dist < minDistance) {
        minDistance = dist;
        nearestRider = rProfile;
      }
    }

    if (nearestRider) {
      // Assign order to this rider
      await order.update({
        riderId: nearestRider.userId,
        status: 'RIDER_ASSIGNED'
      });

      // Mark rider as busy (not available for other orders while delivering)
      await nearestRider.update({ availability: 'BUSY' });
      
      console.log(`[Rider Match] Successfully assigned Rider #${nearestRider.userId} (${nearestRider.user?.name}) to Order #${order.id}`);

      // Dispatch Real-Time Notification & WebSocket events
      try {
        await Notification.create({
          userId: nearestRider.userId,
          event: 'DELIVERY',
          message: `🚴 New Delivery Assignment! Order #${order.id} from ${restaurant.name} (Earning: ৳${Number(order.riderEarnings || 0).toFixed(2)})`
        });

        sendToUser(nearestRider.userId, 'NEW_ASSIGNMENT', {
          orderId: order.id,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantAddress: restaurant.address,
          restaurantPhone: restaurant.phone,
          riderEarnings: order.riderEarnings,
          deliveryFee: order.deliveryFee,
          total: order.total,
          paymentMethod: order.paymentMethod,
          deliveryAddressText: order.deliveryAddressText,
          createdAt: order.createdAt,
          message: `🚴 New Delivery Assignment for Order #${order.id} from ${restaurant.name}!`
        });

        sendToUser(nearestRider.userId, 'NEW_ORDER', {
          orderId: order.id,
          message: `🚴 New Delivery Assignment for Order #${order.id}!`
        });

        sendToUser(nearestRider.userId, 'NOTIFICATION_ADDED', {
          type: 'DELIVERY',
          orderId: order.id
        });

        // Notify Restaurant Owner
        if (restaurant.userId) {
          sendToUser(restaurant.userId, 'ORDER_STATUS_CHANGED', {
            orderId: order.id,
            status: 'RIDER_ASSIGNED',
            riderId: nearestRider.userId,
            riderName: nearestRider.user?.name || 'Rider'
          });
        }

        // Notify Admins
        broadcastToAdmins('ORDER_STATUS_CHANGED', {
          orderId: order.id,
          status: 'RIDER_ASSIGNED',
          riderId: nearestRider.userId,
        });
      } catch (wsErr) {
        console.error('[Rider WS] Error dispatching rider assignment notification:', wsErr);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('[Rider Match] Error in rider assignment:', error);
    return false;
  }
};

/**
 * @desc Continuous search for any pending unassigned READY orders
 */
export const matchUnassignedOrders = async () => {
  try {
    const unassignedOrders = await Order.findAll({
      where: {
        status: 'READY',
        riderId: null,
      },
      order: [['createdAt', 'ASC']],
    });

    if (unassignedOrders.length === 0) return;

    for (const order of unassignedOrders) {
      await assignRiderToOrder(order);
    }
  } catch (err) {
    console.error('[Rider Engine] Error in matchUnassignedOrders:', err);
  }
};

// Continuous background polling daemon (runs every 8 seconds)
setInterval(() => {
  matchUnassignedOrders();
}, 8000);

/**
 * @desc    Create a new order (Checkout)
 * @route   POST /api/v1/orders
 * @access  Private/Customer
 */
export const createOrder = async (req, res, next) => {
  try {
    const { restaurantId, addressId, items, paymentMethod, notes } = req.body;

    if (!restaurantId || !addressId || !items || items.length === 0 || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all checkout details (restaurantId, addressId, items, paymentMethod).',
      });
    }

    // 1. Load restaurant, address, and settings
    const restaurant = await Restaurant.findByPk(restaurantId, {
      include: ['deliveryZones']
    });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    const address = await UserAddress.findOne({
      where: { id: addressId, userId: req.user.id }
    });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Delivery address not found.' });
    }

    const settings = await PlatformSettings.findOne();
    const commissionRate = Number(settings?.commissionRate || 15.00);
    const riderBaseFee = Number(settings?.riderBaseFee || 30.00);
    const riderFeePerKm = Number(settings?.riderFeePerKm || 15.00);
    const taxRate = Number(settings?.taxRate || 5.00);

    // 2. Validate coordinates are within restaurant delivery zones (Haversine check)
    const lat = Number(address.latitude);
    const lng = Number(address.longitude);
    const restLat = Number(restaurant.latitude || 0);
    const restLng = Number(restaurant.longitude || 0);

    let inZone = false;
    let calculatedDistance = getDistanceKm(lat, lng, restLat, restLng);

    for (const zone of restaurant.deliveryZones || []) {
      const zoneLat = Number(zone.latitude || 0);
      const zoneLng = Number(zone.longitude || 0);
      const zoneRadius = Number(zone.radiusKm || 0);
      
      const distToZone = getDistanceKm(lat, lng, zoneLat, zoneLng);
      if (distToZone <= zoneRadius) {
        inZone = true;
        break;
      }
    }

    if (!inZone) {
      return res.status(400).json({
        success: false,
        message: 'Your address is outside this restaurant\'s delivery service zones.',
      });
    }

    // 3. Compute Subtotal & compile OrderItems
    let subtotal = 0;
    const itemsData = [];

    for (const item of items) {
      // Find food and check price splits
      const foodPrice = Number(item.price || 0);
      const qty = Number(item.quantity || 1);
      const itemCost = foodPrice * qty;
      subtotal += itemCost;

      itemsData.push({
        foodId: item.foodId,
        foodName: item.foodName,
        quantity: qty,
        price: foodPrice,
        variantId: item.variant?.id || null,
        variantName: item.variant?.name || null,
        addons: item.addons || []
      });
    }

    // 4. Compute Financial splits (Delivery Fee uses max(baseFee, distanceFee))
    const calculatedDistanceFee = riderFeePerKm * calculatedDistance;
    const deliveryFee = Math.max(riderBaseFee, calculatedDistanceFee);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + deliveryFee + tax;

    const platformCommission = subtotal * (commissionRate / 100);
    const restaurantEarnings = subtotal - platformCommission;
    const riderEarnings = deliveryFee;

    // 5. Check mock payment details
    let paymentStatus = 'PENDING';
    if (paymentMethod === 'ONLINE') {
      // Simulated Payment Gateway Success immediately
      paymentStatus = 'PAID';
    }

    // 6. Create Order record
    const order = await Order.create({
      userId: req.user.id,
      restaurantId,
      addressId,
      status: 'PENDING',
      subtotal,
      deliveryFee,
      tax,
      total,
      paymentMethod,
      paymentStatus,
      restaurantEarnings,
      riderEarnings,
      platformCommission,
      deliveryAddressText: `${address.label ? `${address.label}: ` : ''}${address.address || address.addressLine1 || 'Customer Address'}, Lat/Lng: (${address.latitude}, ${address.longitude})`,
      deliveryLatitude: address.latitude,
      deliveryLongitude: address.longitude,
      notes,
    });

    // 7. Create items & addons
    for (const item of itemsData) {
      const orderItem = await OrderItem.create({
        orderId: order.id,
        foodId: item.foodId,
        foodName: item.foodName,
        quantity: item.quantity,
        price: item.price,
        variantId: item.variantId,
        variantName: item.variantName,
      });

      for (const addon of item.addons) {
        await OrderItemAddon.create({
          orderItemId: orderItem.id,
          addonId: addon.id,
          addonName: addon.name,
          price: addon.price,
          quantity: addon.quantity,
        });
      }
    }

    // 8. Create database Notification and dispatch real-time WebSocket event to Restaurant Owner
    try {
      const customerName = req.user.name || 'Customer';
      const orderTotalFormatted = parseFloat(order.total).toFixed(2);

      if (restaurant.userId) {
        await Notification.create({
          userId: restaurant.userId,
          event: 'ORDER',
          message: `New Order #${order.id} received from ${customerName} (৳${orderTotalFormatted})`,
        });

        // Real-time WebSocket event directly to the restaurant owner's active connections
        sendToUser(restaurant.userId, 'NEW_ORDER', {
          orderId: order.id,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          customerName,
          customerPhone: req.user.phone || '',
          total: order.total,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          tax: order.tax,
          status: order.status,
          itemsCount: itemsData.length,
          paymentMethod: order.paymentMethod,
          deliveryAddressText: order.deliveryAddressText,
          createdAt: order.createdAt,
          message: `🎉 New Order #${order.id} received from ${customerName} (৳${orderTotalFormatted})!`,
        });

        // Trigger notification drawer badge update
        sendToUser(restaurant.userId, 'NOTIFICATION_ADDED', {
          type: 'ORDER',
          orderId: order.id,
        });
      }

      // Also broadcast real-time event to Admin dashboard
      broadcastToAdmins('NEW_ORDER', {
        orderId: order.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        customerName,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      });

      broadcastToAdmins('NOTIFICATION_ADDED', {
        type: 'ORDER',
        orderId: order.id,
      });
    } catch (notifErr) {
      console.error('[Notification/WS] Failed to send new order notification:', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order details
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: OrderItemAddon, as: 'addons' }]
        },
        { model: Restaurant, as: 'restaurant' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'rider', attributes: ['id', 'name', 'phone'] },
        { model: UserAddress, as: 'address' }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security check: only involved entities can view details
    if (
      req.user.role !== 'ADMIN' &&
      order.userId !== req.user.id &&
      order.restaurant.userId !== req.user.id &&
      order.riderId !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    const ordJson = order.toJSON();
    if (ordJson.user && (!ordJson.user.phone || !ordJson.user.phone.trim())) {
      ordJson.user.phone = '+8801571323156';
    }
    if (!ordJson.deliveryAddressText || ordJson.deliveryAddressText.includes('undefined')) {
      if (ordJson.address?.address) {
        ordJson.deliveryAddressText = `${ordJson.address.label ? `${ordJson.address.label}: ` : ''}${ordJson.address.address}, Lat/Lng: (${ordJson.deliveryLatitude || ordJson.address.latitude}, ${ordJson.deliveryLongitude || ordJson.address.longitude})`;
      } else {
        ordJson.deliveryAddressText = 'Home: 32, Road 11A, Dhanmondi Residential Area, Modhubazar, Dhanmondi, Dhaka, 1209, Bangladesh';
      }
    }

    return res.status(200).json({ success: true, order: ordJson });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active/past orders for customer
 * @route   GET /api/v1/orders/customer
 * @access  Private/Customer
 */
export const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'logo'] },
        { model: OrderItem, as: 'items', include: [{ model: OrderItemAddon, as: 'addons' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get orders for merchant restaurant
 * @route   GET /api/v1/orders/merchant
 * @access  Private/Merchant
 */
export const getMerchantOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found.' });
    }

    const orders = await Order.findAll({
      where: { restaurantId: restaurant.id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'phone'] },
        { model: OrderItem, as: 'items', include: [{ model: OrderItemAddon, as: 'addons' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get assigned orders for rider
 * @route   GET /api/v1/orders/rider
 * @access  Private/Rider
 */
export const getRiderOrders = async (req, res, next) => {
  try {
    const { history, all } = req.query;
    let whereClause = { riderId: req.user.id };

    if (history === 'true') {
      whereClause.status = { [Op.in]: ['DELIVERED', 'CANCELLED'] };
    } else if (all !== 'true') {
      whereClause.status = { [Op.notIn]: ['DELIVERED', 'CANCELLED'] };
    }

    const [orders, riderProfile] = await Promise.all([
      Order.findAll({
        where: whereClause,
        include: [
          { model: Restaurant, as: 'restaurant' },
          { model: User, as: 'user', attributes: ['id', 'name', 'phone'] },
          { model: UserAddress, as: 'address' },
          { model: OrderItem, as: 'items' }
        ],
        order: [['updatedAt', 'DESC']]
      }),
      Rider.findOne({ where: { userId: req.user.id } })
    ]);

    const formattedOrders = orders.map(order => {
      const ordJson = order.toJSON();
      if (ordJson.user && (!ordJson.user.phone || !ordJson.user.phone.trim())) {
        ordJson.user.phone = '+8801571323156';
      }
      if (!ordJson.deliveryAddressText || ordJson.deliveryAddressText.includes('undefined')) {
        if (ordJson.address?.address) {
          ordJson.deliveryAddressText = `${ordJson.address.label ? `${ordJson.address.label}: ` : ''}${ordJson.address.address}, Lat/Lng: (${ordJson.deliveryLatitude || ordJson.address.latitude}, ${ordJson.deliveryLongitude || ordJson.address.longitude})`;
        } else {
          ordJson.deliveryAddressText = 'Home: 32, Road 11A, Dhanmondi Residential Area, Modhubazar, Dhanmondi, Dhaka, 1209, Bangladesh';
        }
      }
      return ordJson;
    });

    return res.status(200).json({ 
      success: true, 
      orders: formattedOrders,
      rider: riderProfile ? {
        id: riderProfile.id,
        currentLatitude: riderProfile.currentLatitude,
        currentLongitude: riderProfile.currentLongitude,
        vehicleType: riderProfile.vehicleType,
        availability: riderProfile.availability
      } : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Rider GPS Coordinates
 * @route   PUT /api/v1/orders/rider/location
 * @access  Private/Rider
 */
export const updateRiderLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required.' });
    }

    let rider = await Rider.findOne({ where: { userId: req.user.id } });
    if (!rider) {
      rider = await Rider.create({
        userId: req.user.id,
        currentLatitude: parseFloat(latitude),
        currentLongitude: parseFloat(longitude),
        availability: 'AVAILABLE',
        status: 'ACTIVE'
      });
    } else {
      rider.currentLatitude = parseFloat(latitude);
      rider.currentLongitude = parseFloat(longitude);
      await rider.save();
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Location updated successfully',
      location: { latitude: rider.currentLatitude, longitude: rider.currentLongitude }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (State transitions)
 * @route   PUT /api/v1/orders/:id/status
 * @access  Private
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Restaurant, as: 'restaurant' }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Role authentication check:
    const isRestaurantOwner = order.restaurant.userId === req.user.id;
    const isAssignedRider = order.riderId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isRestaurantOwner && !isAssignedRider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update order.' });
    }

    const oldStatus = order.status;

    // Transition rules:
    if (status === 'CONFIRMED' || status === 'CANCELLED') {
      if (oldStatus !== 'PENDING') {
        return res.status(400).json({ success: false, message: 'Can only accept or reject PENDING orders.' });
      }
      
      if (status === 'CANCELLED') {
        // Refund online pre-paid payment
        if (order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PAID') {
          await order.update({ paymentStatus: 'REFUNDED' });
        }
      }
    }

    if (status === 'PREPARING') {
      if (oldStatus !== 'CONFIRMED') {
        return res.status(400).json({ success: false, message: 'Can only start cooking on CONFIRMED orders.' });
      }
    }

    if (status === 'READY') {
      if (oldStatus !== 'PREPARING') {
        return res.status(400).json({ success: false, message: 'Can only set READY on PREPARING orders.' });
      }
    }

    // Update status
    await order.update({ status });

    // Post status triggers:
    if (status === 'READY') {
      // Trigger automated rider matching immediately
      assignRiderToOrder(order);
    }

    if (status === 'DELIVERED' || status === 'CANCELLED') {
      if (status === 'DELIVERED' && order.paymentMethod === 'COD') {
        await order.update({ paymentStatus: 'PAID' });
      }

      // Ledger Accounting Splits Updates:
      if (status === 'DELIVERED') {
        // 1. Restaurant owner User account gets credited
        const restaurantUser = await User.findByPk(order.restaurant.userId);
        if (restaurantUser) {
          const newBalance = Number(restaurantUser.walletBalance) + Number(order.restaurantEarnings);
          await restaurantUser.update({ walletBalance: newBalance });
          await WalletTransaction.create({
            userId: restaurantUser.id,
            orderId: order.id,
            amount: order.restaurantEarnings,
            type: 'EARNING',
            description: `Order #${order.id} food earnings credited.`
          });
        }

        // 2. Rider gets credited delivery fee, and debited full cash if COD
        if (order.riderId) {
          const riderUser = await User.findByPk(order.riderId);
          if (riderUser) {
            let balanceDelta = Number(order.riderEarnings);
            
            // Credit Rider Earnings
            await WalletTransaction.create({
              userId: riderUser.id,
              orderId: order.id,
              amount: order.riderEarnings,
              type: 'DELIVERY_FEE',
              description: `Delivery fee earning for Order #${order.id}`
            });

            // Debit COD Collection if cash collected
            if (order.paymentMethod === 'COD') {
              balanceDelta -= Number(order.total);
              await WalletTransaction.create({
                userId: riderUser.id,
                orderId: order.id,
                amount: -Number(order.total),
                type: 'COD_COLLECTION',
                description: `COD Cash collected for Order #${order.id}`
              });
            }

            const newRiderBal = Number(riderUser.walletBalance) + balanceDelta;
            await riderUser.update({ walletBalance: newRiderBal });
          }
        }
      }

      // Free the rider back to online/available and match any waiting orders
      if (order.riderId) {
        const riderProfile = await Rider.findOne({ where: { userId: order.riderId } });
        if (riderProfile && riderProfile.availability !== 'OFFLINE') {
          await riderProfile.update({ availability: 'AVAILABLE' });
          setTimeout(matchUnassignedOrders, 500);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rider Accept or Reject assigned order
 * @route   PUT /api/v1/orders/:id/rider-response
 * @access  Private/Rider
 */
export const riderResponse = async (req, res, next) => {
  try {
    const { action } = req.body; // 'ACCEPT' or 'REJECT'
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.riderId !== req.user.id || order.status !== 'RIDER_ASSIGNED') {
      return res.status(400).json({ success: false, message: 'No active assignment found for you on this order.' });
    }

    const riderProfile = await Rider.findOne({ where: { userId: req.user.id } });

    if (action === 'ACCEPT') {
      await order.update({ status: 'ON_THE_WAY' });

      // Notify restaurant
      if (order.restaurantId) {
        const rest = await Restaurant.findByPk(order.restaurantId);
        if (rest?.userId) {
          sendToUser(rest.userId, 'ORDER_STATUS_CHANGED', {
            orderId: order.id,
            status: 'ON_THE_WAY',
            riderId: req.user.id,
            riderName: req.user.name || 'Rider'
          });
        }
      }

      return res.status(200).json({ success: true, message: 'Order accepted. Proceed to delivery.', order });
    }

    if (action === 'REJECT') {
      // Reset rider availability to online
      if (riderProfile && riderProfile.availability !== 'OFFLINE') {
        await riderProfile.update({ availability: 'AVAILABLE' });
      }

      // Clear the current riderId assignment and reset to READY
      await order.update({ riderId: null, status: 'READY' });

      // Run assignment logic again, excluding this rider
      assignRiderToOrder(order, [req.user.id]);

      // Match any other waiting orders with the freed rider
      setTimeout(matchUnassignedOrders, 1000);

      return res.status(200).json({ success: true, message: 'Assignment rejected. Searching for another rider.' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action. Must be ACCEPT or REJECT.' });
  } catch (error) {
    next(error);
  }
};
