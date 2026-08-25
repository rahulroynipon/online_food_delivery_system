import { PlatformCategory } from '../models/index.js';
import { ActiveStatus } from '../enums/index.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import fs from 'fs';
import path from 'path';

/**
 * Helper to delete local file image if replacement occurs or category is deleted.
 */
const deleteCategoryImage = (imagePath) => {
  if (imagePath && !imagePath.startsWith('http')) {
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Failed to delete local image file: ${imagePath}`, err);
    });
  }
};

/**
 * @desc    Create a new platform category
 * @route   POST /api/v1/platform-categories
 * @access  Private (Admin)
 */
export const createPlatformCategory = async (req, res, next) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      // If a file was uploaded by multer, clean it up since validation failed
      if (req.file) deleteCategoryImage(req.file.path);
      return res.status(400).json({ success: false, message: 'Please provide a category name.' });
    }

    let image = null;
    if (req.file) {
      // Store the relative file path for static access
      image = req.file.path;
    }

    const category = await PlatformCategory.create({
      name,
      slug: await generateUniqueSlug(PlatformCategory, name),
      image,
      status: status || ActiveStatus.ACTIVE,
    });

    return res.status(201).json({
      success: true,
      message: 'Platform category created successfully',
      platformCategory: category,
    });
  } catch (error) {
    if (req.file) deleteCategoryImage(req.file.path);
    next(error);
  }
};

/**
 * @desc    Get all platform categories
 * @route   GET /api/v1/platform-categories
 * @access  Public
 */
export const getPlatformCategories = async (req, res, next) => {
  try {
    const categories = await PlatformCategory.findAll({
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      platformCategories: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single platform category by Slug
 * @route   GET /api/v1/platform-categories/:slug
 * @access  Public
 */
export const getPlatformCategoryBySlug = async (req, res, next) => {
  try {
    const category = await PlatformCategory.findOne({ where: { slug: req.params.slug } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Platform category not found.' });
    }

    return res.status(200).json({
      success: true,
      platformCategory: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a platform category by Slug
 * @route   PUT /api/v1/platform-categories/:slug
 * @access  Private (Admin)
 */
export const updatePlatformCategory = async (req, res, next) => {
  try {
    const category = await PlatformCategory.findOne({ where: { slug: req.params.slug } });
    if (!category) {
      if (req.file) deleteCategoryImage(req.file.path);
      return res.status(404).json({ success: false, message: 'Platform category not found.' });
    }

    const { name, status } = req.body;
    let image = category.image;

    if (req.file) {
      // Delete the old image file if it exists
      if (category.image) deleteCategoryImage(category.image);
      image = req.file.path;
    }

    const updateData = { name, image, status };
    if (name) {
      updateData.slug = await generateUniqueSlug(PlatformCategory, name, category.id);
    }

    await category.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Platform category updated successfully',
      platformCategory: category,
    });
  } catch (error) {
    if (req.file) deleteCategoryImage(req.file.path);
    next(error);
  }
};

/**
 * @desc    Delete a platform category by Slug
 * @route   DELETE /api/v1/platform-categories/:slug
 * @access  Private (Admin)
 */
export const deletePlatformCategory = async (req, res, next) => {
  try {
    const category = await PlatformCategory.findOne({ where: { slug: req.params.slug } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Platform category not found.' });
    }

    // Delete image file first
    if (category.image) deleteCategoryImage(category.image);

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: 'Platform category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
