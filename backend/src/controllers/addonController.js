import { RestaurantAddon, Restaurant } from '../models/index.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import fs from 'fs';

const deleteAddonImage = (imagePath) => {
  if (imagePath && !imagePath.startsWith('http')) {
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Failed to delete local addon image file: ${imagePath}`, err);
    });
  }
};

/**
 * @desc    Get all addons for the current merchant's restaurant
 * @route   GET /api/v1/addons
 * @access  Private (Restaurant Owner Only)
 */
export const getAddons = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found for this merchant account.',
      });
    }

    const addons = await RestaurantAddon.findAll({
      where: { restaurantId: restaurant.id },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      addons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create an addon
 * @route   POST /api/v1/addons
 * @access  Private (Restaurant Owner Only)
 */
export const createAddon = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      if (req.file) deleteAddonImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found.',
      });
    }

    const { name, description, price, status } = req.body;

    if (!name || price === undefined) {
      if (req.file) deleteAddonImage(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Name and Price are required.',
      });
    }

    const imagePath = req.file ? req.file.path : null;
    const slug = await generateUniqueSlug(RestaurantAddon, name);

    const addon = await RestaurantAddon.create({
      restaurantId: restaurant.id,
      name,
      slug,
      description,
      image: imagePath,
      price: parseFloat(price),
      status: status || 'ACTIVE',
    });

    return res.status(201).json({
      success: true,
      message: 'Addon created successfully.',
      addon,
    });
  } catch (error) {
    if (req.file) deleteAddonImage(req.file.path);
    next(error);
  }
};

/**
 * @desc    Update addon details
 * @route   PUT /api/v1/addons/:slug
 * @access  Private (Restaurant Owner Only)
 */
export const updateAddon = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      if (req.file) deleteAddonImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found.',
      });
    }

    const addon = await RestaurantAddon.findOne({
      where: { slug: req.params.slug, restaurantId: restaurant.id },
    });

    if (!addon) {
      if (req.file) deleteAddonImage(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Addon not found or not owned by you.',
      });
    }

    const { name, description, price, status } = req.body;

    const updateData = {};
    if (name) {
      updateData.name = name;
      if (name !== addon.name) {
        updateData.slug = await generateUniqueSlug(RestaurantAddon, name);
      }
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (status) updateData.status = status;

    if (req.file) {
      if (addon.image) {
        deleteAddonImage(addon.image);
      }
      updateData.image = req.file.path;
    }

    await addon.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Addon updated successfully.',
      addon,
    });
  } catch (error) {
    if (req.file) deleteAddonImage(req.file.path);
    next(error);
  }
};

/**
 * @desc    Delete addon (Soft Delete)
 * @route   DELETE /api/v1/addons/:slug
 * @access  Private (Restaurant Owner Only)
 */
export const deleteAddon = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found.',
      });
    }

    const addon = await RestaurantAddon.findOne({
      where: { slug: req.params.slug, restaurantId: restaurant.id },
    });

    if (!addon) {
      return res.status(404).json({
        success: false,
        message: 'Addon not found or not owned by you.',
      });
    }

    // Optional: do not delete image on soft delete since details are still kept in DB
    // but if you want to keep filesystem clean or leave it, soft delete usually leaves it.
    await addon.destroy(); // Performs soft delete natively because paranoid is true

    return res.status(200).json({
      success: true,
      message: 'Addon deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle addon active status
 * @route   PUT /api/v1/addons/:slug/status
 * @access  Private (Restaurant Owner Only)
 */
export const toggleAddonStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ where: { userId: req.user.id } });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found.',
      });
    }

    const addon = await RestaurantAddon.findOne({
      where: { slug: req.params.slug, restaurantId: restaurant.id },
    });

    if (!addon) {
      return res.status(404).json({
        success: false,
        message: 'Addon not found.',
      });
    }

    const nextStatus = addon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await addon.update({ status: nextStatus });

    return res.status(200).json({
      success: true,
      message: `Addon status updated to ${nextStatus}.`,
      status: nextStatus,
    });
  } catch (error) {
    next(error);
  }
};
