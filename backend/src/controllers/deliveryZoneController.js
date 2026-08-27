import { DeliveryZone } from '../models/index.js';
import { ActiveStatus } from '../enums/index.js';
import { generateUniqueSlug } from '../utils/slugify.js';

/**
 * @desc    Create a new delivery zone
 * @route   POST /api/v1/delivery-zones
 * @access  Private (Admin)
 */
export const createDeliveryZone = async (req, res, next) => {
  try {
    const { name, status, latitude, longitude, radiusKm } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide a name for the delivery zone.' });
    }

    const zone = await DeliveryZone.create({
      name,
      slug: await generateUniqueSlug(DeliveryZone, name),
      status: status || ActiveStatus.ACTIVE,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      radiusKm: radiusKm ? parseFloat(radiusKm) : null,
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
 * @desc    Get a single delivery zone by Slug
 * @route   GET /api/v1/delivery-zones/:slug
 * @access  Public
 */
export const getDeliveryZoneBySlug = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findOne({ where: { slug: req.params.slug } });
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
 * @desc    Update a delivery zone by Slug
 * @route   PUT /api/v1/delivery-zones/:slug
 * @access  Private (Admin)
 */
export const updateDeliveryZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findOne({ where: { slug: req.params.slug } });
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Delivery zone not found.' });
    }

    const { name, status, latitude, longitude, radiusKm } = req.body;
    const updateData = { 
      name, 
      status,
      latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : zone.latitude,
      longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : zone.longitude,
      radiusKm: radiusKm !== undefined ? (radiusKm ? parseFloat(radiusKm) : null) : zone.radiusKm,
    };
    if (name) {
      updateData.slug = await generateUniqueSlug(DeliveryZone, name, zone.id);
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
 * @desc    Delete a delivery zone by Slug
 * @route   DELETE /api/v1/delivery-zones/:slug
 * @access  Private (Admin)
 */
export const deleteDeliveryZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findOne({ where: { slug: req.params.slug } });
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

/**
 * @desc    Geocode search query proxy to OpenStreetMap Nominatim
 * @route   GET /api/v1/delivery-zones/geocode
 * @access  Private (Admin)
 */
export const geocodeAddress = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query parameter q is required.' });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=bd&limit=1`,
      {
        headers: {
          'User-Agent': 'BiteSpeed-Food-Delivery-System/1.0'
        }
      }
    );
    const data = await response.json();

    return res.status(200).json({
      success: true,
      results: data
    });
  } catch (error) {
    next(error);
  }
};
