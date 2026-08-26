import sequelize from '../config/db.js';
import { User, Restaurant, Rider, DeliveryZone, RestaurantDeliveryZone, Notification } from '../models/index.js';
import { UserRole, UserStatus, RestaurantStatus, RiderStatus, RiderAvailability, NotificationEvent } from '../enums/index.js';
import { hashPassword } from '../utils/hash.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import { sendOnboardingConfirmationEmail } from '../utils/email.js';
import { broadcastToAdmins } from '../websocket/index.js';

/**
 * @desc    Submit Restaurant onboarding application
 * @route   POST /api/v1/onboarding/restaurant
 * @access  Public
 */
export const applyAsRestaurant = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { restaurantName, ownerName, email, phone, description, address, deliveryZoneId, latitude, longitude } = req.body;

    if (!restaurantName || !ownerName || !email || !phone || !description || !address || !deliveryZoneId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required restaurant application fields, including map coordinates (latitude and longitude).',
      });
    }

    // Verify delivery zone exists
    const zone = await DeliveryZone.findByPk(deliveryZoneId);
    if (!zone) {
      return res.status(400).json({
        success: false,
        message: 'The selected delivery zone is invalid.',
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

    // Generate unique slug for restaurant
    const slug = await generateUniqueSlug(Restaurant, restaurantName);

    // Create default hashed password for onboarding account (users can reset it once approved)
    const hashedPassword = await hashPassword(`onboard_${email.split('@')[0]}`);

    // 1. Create User
    const user = await User.create(
      {
        name: ownerName,
        email,
        phone,
        password: hashedPassword,
        role: UserRole.RESTAURANT,
        status: UserStatus.PENDING,
      },
      { transaction }
    );

    // 2. Create Restaurant Profile
    const restaurant = await Restaurant.create(
      {
        userId: user.id,
        name: restaurantName,
        slug,
        phone,
        address,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status: RestaurantStatus.PENDING,
      },
      { transaction }
    );

    // 3. Associate with Delivery Zone
    await RestaurantDeliveryZone.create(
      {
        restaurantId: restaurant.id,
        deliveryZoneId,
      },
      { transaction }
    );

    // Create Notification
    await Notification.create(
      {
        event: NotificationEvent.NEW_RESTAURANT_APPLICATION,
        message: `New Restaurant: "${restaurant.name}" by ${user.name}`,
        read: false,
      },
      { transaction }
    );

    await transaction.commit();

    // Send confirmation email asynchronously (do not block client response)
    sendOnboardingConfirmationEmail(user.email, user.name, 'restaurant').catch((err) => {
      console.error('[Onboarding] Error sending restaurant onboarding confirmation email:', err);
    });

    // Broadcast WebSocket notification to admins
    broadcastToAdmins('NEW_RESTAURANT_APPLICATION', {
      id: restaurant.id,
      name: restaurant.name,
      owner: user.name,
      email: user.email,
      status: restaurant.status,
    });

    return res.status(201).json({
      success: true,
      message: 'Restaurant onboarding application submitted successfully.',
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        owner: user.name,
        email: user.email,
        status: restaurant.status,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Submit Rider onboarding application
 * @route   POST /api/v1/onboarding/rider
 * @access  Public
 */
export const applyAsRider = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { fullName, email, phone, vehicleType, licenseNumber } = req.body;

    if (!fullName || !email || !phone || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required rider application fields.',
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

    // Create default hashed password for onboarding account
    const hashedPassword = await hashPassword(`rider_${email.split('@')[0]}`);

    // 1. Create User
    const user = await User.create(
      {
        name: fullName,
        email,
        phone,
        password: hashedPassword,
        role: UserRole.RIDER,
        status: UserStatus.PENDING,
      },
      { transaction }
    );

    // 2. Create Rider Profile
    const rider = await Rider.create(
      {
        userId: user.id,
        vehicleType,
        vehicleNumber: licenseNumber || null,
        availability: RiderAvailability.OFFLINE,
        status: RiderStatus.PENDING,
      },
      { transaction }
    );

    // Create Notification
    await Notification.create(
      {
        event: NotificationEvent.NEW_RIDER_APPLICATION,
        message: `New Rider: ${user.name} (${vehicleType})`,
        read: false,
      },
      { transaction }
    );

    await transaction.commit();

    // Send confirmation email asynchronously (do not block client response)
    sendOnboardingConfirmationEmail(user.email, user.name, 'rider').catch((err) => {
      console.error('[Onboarding] Error sending rider onboarding confirmation email:', err);
    });

    // Broadcast WebSocket notification to admins
    broadcastToAdmins('NEW_RIDER_APPLICATION', {
      id: rider.id,
      fullName: user.name,
      email: user.email,
      vehicleType: rider.vehicleType,
      status: rider.status,
    });

    return res.status(201).json({
      success: true,
      message: 'Rider onboarding application submitted successfully.',
      rider: {
        id: rider.id,
        fullName: user.name,
        email: user.email,
        vehicleType: rider.vehicleType,
        status: rider.status,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Get all pending onboarding applications
 * @route   GET /api/v1/onboarding/applications
 * @access  Private (Admin Only)
 */
export const getApplications = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'status'] }],
      order: [['createdAt', 'DESC']]
    });

    const riders = await Rider.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'status'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      restaurants,
      riders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a restaurant onboarding application
 * @route   POST /api/v1/onboarding/applications/restaurant/:id/approve
 * @access  Private (Admin Only)
 */
export const approveRestaurant = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, { transaction });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant application not found.' });
    }

    // Update Restaurant status to ACTIVE
    restaurant.status = 'ACTIVE';
    await restaurant.save({ transaction });

    // Update associated User status to ACTIVE
    const user = await User.findByPk(restaurant.userId, { transaction });
    if (user) {
      user.status = 'ACTIVE';
      await user.save({ transaction });
    }

    await transaction.commit();
    return res.status(200).json({ success: true, message: 'Restaurant application approved successfully.' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Reject a restaurant onboarding application
 * @route   POST /api/v1/onboarding/applications/restaurant/:id/reject
 * @access  Private (Admin Only)
 */
export const rejectRestaurant = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, { transaction });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant application not found.' });
    }

    // Update Restaurant status to REJECTED
    restaurant.status = 'REJECTED';
    await restaurant.save({ transaction });

    // Update associated User status to REJECTED
    const user = await User.findByPk(restaurant.userId, { transaction });
    if (user) {
      user.status = 'REJECTED';
      await user.save({ transaction });
    }

    await transaction.commit();
    return res.status(200).json({ success: true, message: 'Restaurant application rejected successfully.' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Approve a rider onboarding application
 * @route   POST /api/v1/onboarding/applications/rider/:id/approve
 * @access  Private (Admin Only)
 */
export const approveRider = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const rider = await Rider.findByPk(req.params.id, { transaction });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider application not found.' });
    }

    // Update Rider status to ACTIVE
    rider.status = 'ACTIVE';
    await rider.save({ transaction });

    // Update associated User status to ACTIVE
    const user = await User.findByPk(rider.userId, { transaction });
    if (user) {
      user.status = 'ACTIVE';
      await user.save({ transaction });
    }

    await transaction.commit();
    return res.status(200).json({ success: true, message: 'Rider application approved successfully.' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Reject a rider onboarding application
 * @route   POST /api/v1/onboarding/applications/rider/:id/reject
 * @access  Private (Admin Only)
 */
export const rejectRider = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const rider = await Rider.findByPk(req.params.id, { transaction });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider application not found.' });
    }

    // Update Rider status to REJECTED
    rider.status = 'REJECTED';
    await rider.save({ transaction });

    // Update associated User status to REJECTED
    const user = await User.findByPk(rider.userId, { transaction });
    if (user) {
      user.status = 'REJECTED';
      await user.save({ transaction });
    }

    await transaction.commit();
    return res.status(200).json({ success: true, message: 'Rider application rejected successfully.' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
