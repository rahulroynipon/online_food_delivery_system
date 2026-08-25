import FoodItem from '../models/FoodItem.js';
import Restaurant from '../models/Restaurant.js';

/**
 * Helper to check if a user is the owner of a restaurant.
 */
const checkRestaurantOwnership = async (userId, restaurantId, role) => {
  if (role === 'admin') return true;
  const restaurant = await Restaurant.findByPk(restaurantId);
  return restaurant && restaurant.ownerId === userId;
};

/**
 * @desc    Add a new food item to a restaurant
 * @route   POST /api/food
 * @access  Private (Owner, Admin)
 */
export const addFoodItem = async (req, res, next) => {
  try {
    const { restaurantId, name, description, price, category, isAvailable } = req.body;

    if (!restaurantId || !name || !price) {
      return res.status(400).json({ success: false, message: 'Please provide restaurantId, name, and price.' });
    }

    // Check restaurant ownership
    const isOwner = await checkRestaurantOwnership(req.user.id, restaurantId, req.user.role);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to add food items to this restaurant.' });
    }

    const foodItem = await FoodItem.create({
      restaurantId,
      name,
      description,
      price,
      category,
      isAvailable,
    });

    return res.status(201).json({
      success: true,
      message: 'Food item added successfully',
      foodItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all food items for a restaurant
 * @route   GET /api/food/restaurant/:restaurantId
 * @access  Public
 */
export const getFoodItems = async (req, res, next) => {
  try {
    const foodItems = await FoodItem.findAll({
      where: { restaurantId: req.params.restaurantId },
      order: [['category', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      count: foodItems.length,
      foodItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single food item by ID
 * @route   GET /api/food/:id
 * @access  Public
 */
export const getFoodItemById = async (req, res, next) => {
  try {
    const foodItem = await FoodItem.findByPk(req.params.id);
    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }
    return res.status(200).json({
      success: true,
      foodItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a food item
 * @route   PUT /api/food/:id
 * @access  Private (Owner, Admin)
 */
export const updateFoodItem = async (req, res, next) => {
  try {
    const foodItem = await FoodItem.findByPk(req.params.id);
    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }

    // Check ownership of the restaurant this food item belongs to
    const isOwner = await checkRestaurantOwnership(req.user.id, foodItem.restaurantId, req.user.role);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to update food items in this restaurant.' });
    }

    const { name, description, price, category, isAvailable } = req.body;
    await foodItem.update({ name, description, price, category, isAvailable });

    return res.status(200).json({
      success: true,
      message: 'Food item updated successfully',
      foodItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a food item
 * @route   DELETE /api/food/:id
 * @access  Private (Owner, Admin)
 */
export const deleteFoodItem = async (req, res, next) => {
  try {
    const foodItem = await FoodItem.findByPk(req.params.id);
    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }

    // Check ownership of the restaurant this food item belongs to
    const isOwner = await checkRestaurantOwnership(req.user.id, foodItem.restaurantId, req.user.role);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete food items from this restaurant.' });
    }

    await foodItem.destroy();

    return res.status(200).json({
      success: true,
      message: 'Food item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
