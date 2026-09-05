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
    const { restaurantName, ownerName, email, phone, description, address, deliveryZoneId, latitude, longitude, password } = req.body;

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

    // Verify restaurant coordinates fall within the delivery zone radius boundary
    if (zone.latitude && zone.longitude && zone.radiusKm) {
      const getDistanceKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
      };

      const distance = getDistanceKm(
        parseFloat(zone.latitude),
        parseFloat(zone.longitude),
        parseFloat(latitude),
        parseFloat(longitude)
      );

      const zoneRadius = parseFloat(zone.radiusKm);
      if (distance > zoneRadius) {
        return res.status(400).json({
          success: false,
          message: `The selected restaurant location falls outside the boundary of the chosen delivery zone "${zone.name}". (Your location is ${distance.toFixed(2)} km away, but the zone radius limit is only ${zoneRadius.toFixed(2)} km).`,
        });
      }
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

    // Create default/provided hashed password for onboarding account
    const passToHash = password || `onboard_${email.split('@')[0]}`;
    const hashedPassword = await hashPassword(passToHash);

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
        userId: user.id,
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
    const { fullName, email, phone, vehicleType, licenseNumber, password } = req.body;

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

    // Create default/provided hashed password for onboarding account
    const passToHash = password || `rider_${email.split('@')[0]}`;
    const hashedPassword = await hashPassword(passToHash);

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
        userId: user.id,
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

/**
 * @desc    Update a restaurant application/profile (Admin Only)
 * @route   PUT /api/v1/onboarding/applications/restaurant/:id
 * @access  Private (Admin Only)
 */
export const updateRestaurant = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, { transaction });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant application not found.' });
    }

    const { name, description, address, latitude, longitude, phone, status, ownerName, email, userPhone } = req.body;

    // Update restaurant fields
    if (name !== undefined) restaurant.name = name;
    if (description !== undefined) restaurant.description = description;
    if (address !== undefined) restaurant.address = address;
    if (latitude !== undefined) restaurant.latitude = parseFloat(latitude);
    if (longitude !== undefined) restaurant.longitude = parseFloat(longitude);
    if (phone !== undefined) restaurant.phone = phone;
    if (status !== undefined) restaurant.status = status;

    await restaurant.save({ transaction });

    // Update associated User profile fields if provided
    const user = await User.findByPk(restaurant.userId, { transaction });
    if (user) {
      if (ownerName !== undefined) user.name = ownerName;
      if (email !== undefined) user.email = email;
      if (userPhone !== undefined) user.phone = userPhone;
      if (status !== undefined) {
        user.status = status;
      }
      await user.save({ transaction });
    }

    await transaction.commit();
    return res.status(200).json({ 
      success: true, 
      message: 'Restaurant updated successfully.',
      restaurant: {
        ...restaurant.toJSON(),
        user: user ? user.toJSON() : null
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Update a rider application/profile (Admin Only)
 * @route   PUT /api/v1/onboarding/applications/rider/:id
 * @access  Private (Admin Only)
 */
export const updateRider = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const rider = await Rider.findByPk(req.params.id, { transaction });
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider application not found.' });
    }

    const { vehicleType, vehicleNumber, status, fullName, email, phone } = req.body;

    // Update rider fields
    if (vehicleType !== undefined) rider.vehicleType = vehicleType;
    if (vehicleNumber !== undefined) rider.vehicleNumber = vehicleNumber;
    if (status !== undefined) rider.status = status;

    await rider.save({ transaction });

    // Update associated User profile fields if provided
    const user = await User.findByPk(rider.userId, { transaction });
    if (user) {
      if (fullName !== undefined) user.name = fullName;
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (status !== undefined) {
        user.status = status;
      }
      await user.save({ transaction });
    }

    await transaction.commit();
    return res.status(200).json({ 
      success: true, 
      message: 'Rider updated successfully.',
      rider: {
        ...rider.toJSON(),
        user: user ? user.toJSON() : null
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Get current logged in merchant's restaurant profile
 * @route   GET /api/v1/onboarding/my-restaurant
 * @access  Private (Restaurant Owner Only)
 */
export const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'status'] }]
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found for this merchant.' });
    }

    return res.status(200).json({
      success: true,
      restaurant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a restaurant and its associated user account
 * @route   DELETE /api/v1/onboarding/applications/restaurant/:id
 * @access  Private (Admin Only)
 */
export const deleteRestaurant = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const restaurant = await Restaurant.findByPk(req.params.id, { transaction });
    if (!restaurant) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    const userId = restaurant.userId;

    // Delete the restaurant record (cascade should handle related records)
    await restaurant.destroy({ transaction });

    // Delete the associated user account
    if (userId) {
      const user = await User.findByPk(userId, { transaction });
      if (user) {
        await user.destroy({ transaction });
      }
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Restaurant and associated account deleted successfully.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Delete a rider and its associated user account
 * @route   DELETE /api/v1/onboarding/applications/rider/:id
 * @access  Private (Admin Only)
 */
export const deleteRider = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const rider = await Rider.findByPk(req.params.id, { transaction });
    if (!rider) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Rider not found.' });
    }

    const userId = rider.userId;

    // Delete the rider record
    await rider.destroy({ transaction });

    // Delete the associated user account
    if (userId) {
      const user = await User.findByPk(userId, { transaction });
      if (user) {
        await user.destroy({ transaction });
      }
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Rider and associated account deleted successfully.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Restaurant owner toggles their own open/closed status
 * @route   PUT /api/v1/onboarding/my-restaurant/toggle-open
 * @access  Private (Restaurant Only)
 */
export const toggleMyRestaurantOpen = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found.' });
    }

    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: restaurant.isOpen ? 'Your restaurant is now open!' : 'Your restaurant is now closed.',
      isOpen: restaurant.isOpen,
    });
  } catch (error) {
    next(error);
  }
};
export const toggleRestaurantOpen = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: restaurant.isOpen ? 'Restaurant is now open.' : 'Restaurant is now closed.',
      isOpen: restaurant.isOpen,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in rider profile
 * @route   GET /api/v1/onboarding/my-rider
 * @access  Private (Rider Only)
 */
export const getMyRider = async (req, res, next) => {
  try {
    let rider = await Rider.findOne({ 
      where: { userId: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'status', 'walletBalance'] }]
    });

    // If no explicit rider entry yet, find or create default for RIDER user
    if (!rider && req.user.role === 'RIDER') {
      rider = await Rider.create({
        userId: req.user.id,
        vehicleType: 'MOTORBIKE',
        licenseNumber: 'PENDING',
        status: RiderStatus.APPROVED,
        isAvailable: true,
        rating: 5.0,
      });
      rider = await Rider.findOne({
        where: { userId: req.user.id },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'status', 'walletBalance'] }]
      });
    }

    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider profile not found.' });
    }

    return res.status(200).json({ success: true, rider });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rider toggles their availability status (Online/Offline)
 * @route   PUT /api/v1/onboarding/my-rider/toggle-availability
 * @access  Private (Rider Only)
 */
export const toggleMyRiderAvailability = async (req, res, next) => {
  try {
    let rider = await Rider.findOne({ where: { userId: req.user.id } });
    if (!rider && req.user.role === 'RIDER') {
      rider = await Rider.create({
        userId: req.user.id,
        vehicleType: 'MOTORBIKE',
        licenseNumber: 'PENDING',
        status: RiderStatus.APPROVED,
        isAvailable: true,
      });
    }

    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider profile not found.' });
    }

    rider.isAvailable = !rider.isAvailable;
    await rider.save();

    return res.status(200).json({
      success: true,
      message: rider.isAvailable ? 'You are now Online & Available for orders.' : 'You are now Offline.',
      isAvailable: rider.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};



