import { PlatformSettings } from '../models/index.js';

/**
 * @desc    Get global platform settings
 * @route   GET /api/v1/settings/platform
 * @access  Public
 */
export const getPlatformSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({
        commissionRate: 15.00,
        riderBaseFee: 30.00,
        riderFeePerKm: 15.00,
        taxRate: 5.00,
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update global platform settings
 * @route   PUT /api/v1/settings/platform
 * @access  Private/Admin
 */
export const updatePlatformSettings = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only administrators can update platform settings.',
      });
    }

    const { commissionRate, riderBaseFee, riderFeePerKm, taxRate } = req.body;

    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({
        commissionRate: commissionRate !== undefined ? commissionRate : 15.00,
        riderBaseFee: riderBaseFee !== undefined ? riderBaseFee : 30.00,
        riderFeePerKm: riderFeePerKm !== undefined ? riderFeePerKm : 15.00,
        taxRate: taxRate !== undefined ? taxRate : 5.00,
      });
    } else {
      await settings.update({
        commissionRate: commissionRate !== undefined ? commissionRate : settings.commissionRate,
        riderBaseFee: riderBaseFee !== undefined ? riderBaseFee : settings.riderBaseFee,
        riderFeePerKm: riderFeePerKm !== undefined ? riderFeePerKm : settings.riderFeePerKm,
        taxRate: taxRate !== undefined ? taxRate : settings.taxRate,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully.',
      settings,
    });
  } catch (error) {
    next(error);
  }
};
