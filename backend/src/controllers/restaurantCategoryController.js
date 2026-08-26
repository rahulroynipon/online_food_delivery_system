import { RestaurantCategory, Restaurant, PlatformCategory } from '../models/index.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import fs from 'fs';

const deleteCategoryImage = (imagePath) => {
  if (imagePath && !imagePath.startsWith('http')) {
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Failed to delete local image file: ${imagePath}`, err);
    });
  }
};

/**
 * @desc    Get all custom categories for current logged-in restaurant merchant
 * @route   GET /api/v1/restaurant-categories
 * @access  Private (Restaurant Owner Only)
 */
export const getMyCategories = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found for this merchant account.',
      });
    }

    const categories = await RestaurantCategory.findAll({
      where: { restaurantId: restaurant.id },
      include: [
        {
          model: PlatformCategory,
          as: 'platformCategory',
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a custom category for current logged-in restaurant merchant
 * @route   POST /api/v1/restaurant-categories
 * @access  Private (Restaurant Owner Only)
 */
export const createRestaurantCategory = async (req, res, next) => {
  try {
    const { name, description, platformCategoryId, status } = req.body;

    if (!name || !platformCategoryId) {
      if (req.file) deleteCategoryImage(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Category name and Platform category mapping are required.',
      });
    }

    // Verify platform category exists
    const platformCategory = await PlatformCategory.findByPk(platformCategoryId);
    if (!platformCategory) {
      if (req.file) deleteCategoryImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'The selected Platform category does not exist.',
      });
    }

    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      if (req.file) deleteCategoryImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found for this merchant account.',
      });
    }

    const slug = await generateUniqueSlug(RestaurantCategory, name);

    let image = null;
    if (req.file) {
      image = req.file.path;
    }

    const category = await RestaurantCategory.create({
      restaurantId: restaurant.id,
      platformCategoryId: parseInt(platformCategoryId, 10),
      name,
      slug,
      image,
      description,
      status: status || 'ACTIVE',
    });

    const fullCategory = await RestaurantCategory.findByPk(category.id, {
      include: [
        {
          model: PlatformCategory,
          as: 'platformCategory',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Store category created successfully.',
      category: fullCategory,
    });
  } catch (error) {
    if (req.file) deleteCategoryImage(req.file.path);
    next(error);
  }
};

/**
 * @desc    Update a custom category for current logged-in restaurant merchant
 * @route   PUT /api/v1/restaurant-categories/:id
 * @access  Private (Restaurant Owner Only)
 */
export const updateRestaurantCategory = async (req, res, next) => {
  try {
    const { name, description, platformCategoryId, status } = req.body;

    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found for this merchant account.',
      });
    }

    const category = await RestaurantCategory.findOne({
      where: { slug: req.params.slug, restaurantId: restaurant.id }
    });

    if (!category) {
      if (req.file) deleteCategoryImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Store category not found or unauthorized.',
      });
    }

    if (platformCategoryId) {
      const platformCategory = await PlatformCategory.findByPk(platformCategoryId);
      if (!platformCategory) {
        if (req.file) deleteCategoryImage(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'The selected Platform category does not exist.',
        });
      }
      category.platformCategoryId = parseInt(platformCategoryId, 10);
    }

    if (name !== undefined) {
      category.name = name;
      category.slug = await generateUniqueSlug(RestaurantCategory, name, category.id);
    }
    if (description !== undefined) category.description = description;
    if (status !== undefined) category.status = status;

    if (req.file) {
      if (category.image) {
        deleteCategoryImage(category.image);
      }
      category.image = req.file.path;
    }

    await category.save();

    const fullCategory = await RestaurantCategory.findByPk(category.id, {
      include: [
        {
          model: PlatformCategory,
          as: 'platformCategory',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Store category updated successfully.',
      category: fullCategory,
    });
  } catch (error) {
    if (req.file) deleteCategoryImage(req.file.path);
    next(error);
  }
};

/**
 * @desc    Delete a custom category for current logged-in restaurant merchant
 * @route   DELETE /api/v1/restaurant-categories/:id
 * @access  Private (Restaurant Owner Only)
 */
export const deleteRestaurantCategory = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found for this merchant account.',
      });
    }

    const category = await RestaurantCategory.findOne({
      where: { slug: req.params.slug, restaurantId: restaurant.id }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Store category not found or unauthorized.',
      });
    }

    if (category.image) {
      deleteCategoryImage(category.image);
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: 'Store category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle custom category storefront active status
 * @route   PUT /api/v1/restaurant-categories/:slug/status
 * @access  Private (Restaurant Owner Only)
 */
export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found.',
      });
    }

    const category = await RestaurantCategory.findOne({
      where: { slug: req.params.slug, restaurantId: restaurant.id },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Store category not found.',
      });
    }

    const nextStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await category.update({ status: nextStatus });

    return res.status(200).json({
      success: true,
      message: `Store category status updated to ${nextStatus}.`,
      status: nextStatus,
    });
  } catch (error) {
    next(error);
  }
};
