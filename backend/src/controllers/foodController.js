import { Food, FoodVariant, RestaurantCategory, Restaurant } from '../models/index.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import fs from 'fs';

const deleteFoodImage = (imagePath) => {
  if (imagePath && !imagePath.startsWith('http')) {
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Failed to delete local image file: ${imagePath}`, err);
    });
  }
};

/**
 * @desc    Get all foods for the current merchant's restaurant
 * @route   GET /api/v1/foods
 * @access  Private (Restaurant Owner Only)
 */
export const getFoods = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found for this merchant account.',
      });
    }

    const foods = await Food.findAll({
      where: { restaurantId: restaurant.id },
      include: [
        {
          model: FoodVariant,
          as: 'variants',
        },
        {
          model: RestaurantCategory,
          as: 'restaurantCategory',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      foods,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a food item with a default price/variant
 * @route   POST /api/v1/foods
 * @access  Private (Restaurant Owner Only)
 */
export const createFood = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      if (req.file) deleteFoodImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found for this merchant account.',
      });
    }

    const { name, description, restaurantCategoryId, price, status } = req.body;
    let variantsData = [];
    if (req.body.variants) {
      try {
        variantsData = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
      } catch (err) {
        if (req.file) deleteFoodImage(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid variants JSON format.',
        });
      }
    }

    if (!name || !restaurantCategoryId || (variantsData.length === 0 && !price)) {
      if (req.file) deleteFoodImage(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Name, Category, and Price (or at least one variant with a price) are required.',
      });
    }

    const category = await RestaurantCategory.findOne({
      where: { id: restaurantCategoryId, restaurantId: restaurant.id },
    });

    if (!category) {
      if (req.file) deleteFoodImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Selected custom category not found under your restaurant.',
      });
    }

    const imagePath = req.file ? req.file.path : null;

    const slug = await generateUniqueSlug(Food, name);

    const food = await Food.create({
      restaurantId: restaurant.id,
      restaurantCategoryId: category.id,
      platformCategoryId: category.platformCategoryId,
      name,
      slug,
      description,
      image: imagePath,
      status: status || 'ACTIVE',
    });

    if (variantsData && variantsData.length > 0) {
      for (const v of variantsData) {
        await FoodVariant.create({
          foodId: food.id,
          name: v.name || 'Regular',
          price: parseFloat(v.price || 0),
          status: v.status || 'ACTIVE',
        });
      }
    } else {
      // Create default "Regular" variant with the price fallback
      await FoodVariant.create({
        foodId: food.id,
        name: 'Regular',
        price: parseFloat(price),
        status: 'ACTIVE',
      });
    }

    const populatedFood = await Food.findByPk(food.id, {
      include: [
        {
          model: FoodVariant,
          as: 'variants',
        },
        {
          model: RestaurantCategory,
          as: 'restaurantCategory',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Food item created successfully.',
      food: populatedFood,
    });
  } catch (error) {
    if (req.file) deleteFoodImage(req.file.path);
    next(error);
  }
};

/**
 * @desc    Update food details & its variant price
 * @route   PUT /api/v1/foods/:id
 * @access  Private (Restaurant Owner Only)
 */
export const updateFood = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      if (req.file) deleteFoodImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found for this merchant account.',
      });
    }

    const food = await Food.findOne({
      where: { id: req.params.id, restaurantId: restaurant.id },
    });

    if (!food) {
      if (req.file) deleteFoodImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Food item not found or not owned by you.',
      });
    }

    const { name, description, restaurantCategoryId, price, status, variants } = req.body;
    let variantsData = null;
    if (variants) {
      try {
        variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (err) {
        if (req.file) deleteFoodImage(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid variants JSON format.',
        });
      }
    }

    const updateData = {};
    if (name) {
      updateData.name = name;
      if (name !== food.name) {
        updateData.slug = await generateUniqueSlug(Food, name);
      }
    }
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    if (restaurantCategoryId) {
      const category = await RestaurantCategory.findOne({
        where: { id: restaurantCategoryId, restaurantId: restaurant.id },
      });
      if (!category) {
        if (req.file) deleteFoodImage(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Selected custom category not found.',
        });
      }
      updateData.restaurantCategoryId = category.id;
      updateData.platformCategoryId = category.platformCategoryId;
    }

    if (req.file) {
      if (food.image) {
        deleteFoodImage(food.image);
      }
      updateData.image = req.file.path;
    }

    await food.update(updateData);

    if (variantsData !== null) {
      // Remove all previous variants for this food item
      await FoodVariant.destroy({ where: { foodId: food.id } });
      
      // Re-create the new variants list
      for (const v of variantsData) {
        await FoodVariant.create({
          foodId: food.id,
          name: v.name || 'Regular',
          price: parseFloat(v.price || 0),
          status: v.status || 'ACTIVE',
        });
      }
    } else if (price) {
      const [variant] = await FoodVariant.findOrCreate({
        where: { foodId: food.id, name: 'Regular' },
        defaults: { price: parseFloat(price), status: 'ACTIVE' },
      });
      if (variant) {
        await variant.update({ price: parseFloat(price) });
      }
    }

    const populatedFood = await Food.findByPk(food.id, {
      include: [
        {
          model: FoodVariant,
          as: 'variants',
        },
        {
          model: RestaurantCategory,
          as: 'restaurantCategory',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Food item updated successfully.',
      food: populatedFood,
    });
  } catch (error) {
    if (req.file) deleteFoodImage(req.file.path);
    next(error);
  }
};

/**
 * @desc    Delete food item & clean up local images
 * @route   DELETE /api/v1/foods/:id
 * @access  Private (Restaurant Owner Only)
 */
export const deleteFood = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found for this merchant account.',
      });
    }

    const food = await Food.findOne({
      where: { id: req.params.id, restaurantId: restaurant.id },
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found or not owned by you.',
      });
    }

    if (food.image) {
      deleteFoodImage(food.image);
    }

    await food.destroy();

    return res.status(200).json({
      success: true,
      message: 'Food item deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle food active storefront status
 * @route   PUT /api/v1/foods/:id/status
 * @access  Private (Restaurant Owner Only)
 */
export const toggleFoodStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found.',
      });
    }

    const food = await Food.findOne({
      where: { id: req.params.id, restaurantId: restaurant.id },
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found.',
      });
    }

    const nextStatus = food.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await food.update({ status: nextStatus });

    return res.status(200).json({
      success: true,
      message: `Storefront status updated to ${nextStatus}.`,
      status: nextStatus,
    });
  } catch (error) {
    next(error);
  }
};
