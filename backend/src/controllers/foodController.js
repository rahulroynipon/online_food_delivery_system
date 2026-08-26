import { Food, FoodVariant, RestaurantCategory, Restaurant, RestaurantAddon } from '../models/index.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import fs from 'fs';

const deleteFoodImage = (imagePath) => {
  if (imagePath && !imagePath.startsWith('http')) {
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Failed to delete local image file: ${imagePath}`, err);
    });
  }
};

const cleanAllFiles = (files) => {
  if (files && files.length > 0) {
    files.forEach(f => deleteFoodImage(f.path));
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
        {
          model: RestaurantAddon,
          as: 'addons',
          through: { attributes: [] },
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
      cleanAllFiles(req.files);
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
        cleanAllFiles(req.files);
        return res.status(400).json({
          success: false,
          message: 'Invalid variants JSON format.',
        });
      }
    }

    let addonIdsData = [];
    if (req.body.addonIds) {
      try {
        addonIdsData = typeof req.body.addonIds === 'string' ? JSON.parse(req.body.addonIds) : req.body.addonIds;
      } catch (err) {
        cleanAllFiles(req.files);
        return res.status(400).json({
          success: false,
          message: 'Invalid addonIds JSON format.',
        });
      }
    }

    const targetStatus = status || 'ACTIVE';
    if (targetStatus === 'ACTIVE' && variantsData.length === 0 && !price) {
      cleanAllFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'At least one variant with a price is required to set the storefront status as ACTIVE.',
      });
    }

    if (!name || !restaurantCategoryId || (variantsData.length === 0 && !price)) {
      cleanAllFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Name, Category, and Price (or at least one variant with a price) are required.',
      });
    }

    const category = await RestaurantCategory.findOne({
      where: { id: restaurantCategoryId, restaurantId: restaurant.id },
    });

    if (!category) {
      cleanAllFiles(req.files);
      return res.status(404).json({
        success: false,
        message: 'Selected custom category not found under your restaurant.',
      });
    }

    const mainImageFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    const imagePath = mainImageFile ? mainImageFile.path : null;
    const slug = await generateUniqueSlug(Food, name);

    const food = await Food.create({
      restaurantId: restaurant.id,
      restaurantCategoryId: category.id,
      platformCategoryId: category.platformCategoryId,
      name,
      slug,
      description,
      image: imagePath,
      status: targetStatus,
    });

    if (variantsData && variantsData.length > 0) {
      for (let i = 0; i < variantsData.length; i++) {
        const v = variantsData[i];
        const variantImageFile = req.files ? req.files.find(f => f.fieldname === `variant_image_${i}`) : null;
        const variantImagePath = variantImageFile ? variantImageFile.path : null;

        await FoodVariant.create({
          foodId: food.id,
          name: v.name || 'Regular',
          price: parseFloat(v.price || 0),
          image: variantImagePath,
          status: v.status || 'ACTIVE',
        });
      }
    } else {
      // Create default "Regular" variant with the price fallback and main image fallback
      await FoodVariant.create({
        foodId: food.id,
        name: 'Regular',
        price: parseFloat(price),
        image: imagePath,
        status: 'ACTIVE',
      });
    }

    // Link addons
    if (addonIdsData && addonIdsData.length > 0) {
      await food.setAddons(addonIdsData);
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
        {
          model: RestaurantAddon,
          as: 'addons',
          through: { attributes: [] },
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Food item created successfully.',
      food: populatedFood,
    });
  } catch (error) {
    cleanAllFiles(req.files);
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

    const { name, description, restaurantCategoryId, price, status, variants, addonIds } = req.body;
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

    let addonIdsData = null;
    if (addonIds) {
      try {
        addonIdsData = typeof addonIds === 'string' ? JSON.parse(addonIds) : addonIds;
      } catch (err) {
        if (req.file) deleteFoodImage(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid addonIds JSON format.',
        });
      }
    }

    const targetStatus = status || food.status;
    if (targetStatus === 'ACTIVE') {
      const activeVariantsExist = variantsData !== null 
        ? variantsData.length > 0 
        : (await FoodVariant.count({ where: { foodId: food.id } })) > 0;

      if (!activeVariantsExist) {
        if (req.file) deleteFoodImage(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'At least one pricing variant is required to set storefront status as ACTIVE.',
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
        cleanAllFiles(req.files);
        return res.status(404).json({
          success: false,
          message: 'Selected custom category not found.',
        });
      }
      updateData.restaurantCategoryId = category.id;
      updateData.platformCategoryId = category.platformCategoryId;
    }

    const mainImageFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    if (mainImageFile) {
      if (food.image) {
        deleteFoodImage(food.image);
      }
      updateData.image = mainImageFile.path;
    }

    await food.update(updateData);

    if (variantsData !== null) {
      // First, get all old variants to clean up their deleted images if necessary
      const oldVariants = await FoodVariant.findAll({ where: { foodId: food.id } });
      const oldImages = oldVariants.map(v => v.image).filter(Boolean);

      // Re-create the new variants list
      await FoodVariant.destroy({ where: { foodId: food.id } });
      
      const newImages = [];

      for (let i = 0; i < variantsData.length; i++) {
        const v = variantsData[i];
        const variantImageFile = req.files ? req.files.find(f => f.fieldname === `variant_image_${i}`) : null;
        let variantImagePath = variantImageFile ? variantImageFile.path : (v.image || null);

        await FoodVariant.create({
          foodId: food.id,
          name: v.name || 'Regular',
          price: parseFloat(v.price || 0),
          image: variantImagePath,
          status: v.status || 'ACTIVE',
        });

        if (variantImagePath) {
          newImages.push(variantImagePath);
        }
      }

      // Delete old variant image files that are no longer used
      oldImages.forEach(img => {
        if (!newImages.includes(img)) {
          deleteFoodImage(img);
        }
      });
    } else if (price) {
      const mainImageFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
      const imagePath = mainImageFile ? mainImageFile.path : null;

      const [variant] = await FoodVariant.findOrCreate({
        where: { foodId: food.id, name: 'Regular' },
        defaults: { price: parseFloat(price), status: 'ACTIVE', image: imagePath },
      });
      if (variant) {
        const updateVariantData = { price: parseFloat(price) };
        if (imagePath) {
          if (variant.image) deleteFoodImage(variant.image);
          updateVariantData.image = imagePath;
        }
        await variant.update(updateVariantData);
      }
    }

    // Link addons
    if (addonIdsData !== null) {
      await food.setAddons(addonIdsData);
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
        {
          model: RestaurantAddon,
          as: 'addons',
          through: { attributes: [] },
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Food item updated successfully.',
      food: populatedFood,
    });
  } catch (error) {
    cleanAllFiles(req.files);
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

/**
 * @desc    Get single food item details by slug
 * @route   GET /api/v1/foods/details/:slug
 * @access  Private (Restaurant Owner Only)
 */
export const getFoodBySlug = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found.',
      });
    }

    const food = await Food.findOne({
      where: { slug: req.params.slug, restaurantId: restaurant.id },
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
        {
          model: RestaurantAddon,
          as: 'addons',
          through: { attributes: [] },
        },
      ],
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found.',
      });
    }

    return res.status(200).json({
      success: true,
      food,
    });
  } catch (error) {
    next(error);
  }
};
