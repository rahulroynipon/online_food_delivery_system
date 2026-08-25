import { DeliveryZone } from '../models/index.js';
import { ActiveStatus } from '../enums/index.js';
import { slugify } from '../utils/slugify.js';

/**
 * @desc    Create a new delivery zone
 * @route   POST /api/v1/delivery-zones
 * @access  Private (Admin)
 */
export const createDeliveryZone = async (req, res, next) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide a name for the delivery zone.' });
    }

    const zone = await DeliveryZone.create({
      name,
      slug: slugify(name),
      status: status || ActiveStatus.ACTIVE,
    });

    return res.status(201).json({
      success: true,
      message: 'Delivery zone created successfully',
      deliveryZone: zone,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all delivery zones
 * @route   GET /api/v1/delivery-zones
 * @access  Public
 */
export const getDeliveryZones = async (req, res, next) => {
  try {
    const zones = await DeliveryZone.findAll({
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: zones.length,
      deliveryZones: zones,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single delivery zone by ID
 * @route   GET /api/v1/delivery-zones/:id
 * @access  Public
 */
export const getDeliveryZoneById = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Delivery zone not found.' });
    }

    return res.status(200).json({
      success: true,
      deliveryZone: zone,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a delivery zone
 * @route   PUT /api/v1/delivery-zones/:id
 * @access  Private (Admin)
 */
export const updateDeliveryZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Delivery zone not found.' });
    }

    const { name, status } = req.body;
    const updateData = { name, status };
    if (name) {
      updateData.slug = slugify(name);
    }
    await zone.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Delivery zone updated successfully',
      deliveryZone: zone,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a delivery zone
 * @route   DELETE /api/v1/delivery-zones/:id
 * @access  Private (Admin)
 */
export const deleteDeliveryZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Delivery zone not found.' });
    }

    await zone.destroy();

    return res.status(200).json({
      success: true,
      message: 'Delivery zone deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
