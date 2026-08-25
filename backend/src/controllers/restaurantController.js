import Restaurant from '../models/Restaurant.js';

/**
 * @desc    Create a new restaurant
 * @route   POST /api/restaurants
 * @access  Private (Owner, Admin)
 */
export const createRestaurant = async (req, res, next) => {
  try {
    const { name, address, phone, cuisine } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Please provide name and address.' });
    }

    const restaurant = await Restaurant.create({
      name,
      ownerId: req.user.id,
      address,
      phone,
      cuisine,
    });

    return res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all restaurants
 * @route   GET /api/restaurants
 * @access  Public
 */
export const getRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.findAll({
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single restaurant by ID
 * @route   GET /api/restaurants/:id
 * @access  Public
 */
export const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }
    return res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a restaurant
 * @route   PUT /api/restaurants/:id
 * @access  Private (Owner, Admin)
 */
export const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Check ownership
    if (restaurant.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to update this restaurant.' });
    }

    const { name, address, phone, cuisine } = req.body;
    await restaurant.update({ name, address, phone, cuisine });

    return res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a restaurant
 * @route   DELETE /api/restaurants/:id
 * @access  Private (Owner, Admin)
 */
export const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Check ownership
    if (restaurant.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to delete this restaurant.' });
    }

    await restaurant.destroy();

    return res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
