import { UserAddress } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * @desc    Get all addresses for logged-in user
 * @route   GET /api/v1/user-addresses
 * @access  Private
 */
export const getUserAddresses = async (req, res, next) => {
  try {
    const addresses = await UserAddress.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new user address
 * @route   POST /api/v1/user-addresses
 * @access  Private
 */
export const createUserAddress = async (req, res, next) => {
  try {
    const { label, address, latitude, longitude, isDefault } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an address.',
      });
    }

    // Check count of existing addresses
    const existingCount = await UserAddress.count({
      where: { userId: req.user.id },
    });

    // Rule: First address must be default
    const shouldBeDefault = existingCount === 0 ? true : !!isDefault;

    // If setting this to default, clear other default addresses for this user
    if (shouldBeDefault) {
      await UserAddress.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    const newAddress = await UserAddress.create({
      userId: req.user.id,
      label,
      address,
      latitude,
      longitude,
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      address: newAddress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user address
 * @route   PUT /api/v1/user-addresses/:id
 * @access  Private
 */
export const updateUserAddress = async (req, res, next) => {
  try {
    const { label, address, latitude, longitude, isDefault } = req.body;
    const addressId = req.params.id;

    const userAddress = await UserAddress.findOne({
      where: { id: addressId, userId: req.user.id },
    });

    if (!userAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or unauthorized.',
      });
    }

    if (label !== undefined) userAddress.label = label;
    if (address !== undefined) userAddress.address = address;
    if (latitude !== undefined) userAddress.latitude = latitude;
    if (longitude !== undefined) userAddress.longitude = longitude;

    if (isDefault !== undefined) {
      const isCurrentlyDefault = userAddress.isDefault;
      const targetDefault = !!isDefault;

      if (targetDefault && !isCurrentlyDefault) {
        // If turning default ON, set all other addresses to false
        await UserAddress.update(
          { isDefault: false },
          { where: { userId: req.user.id } }
        );
        userAddress.isDefault = true;
      } else if (!targetDefault && isCurrentlyDefault) {
        // If turning default OFF, check if there are other addresses
        const otherAddress = await UserAddress.findOne({
          where: { userId: req.user.id, id: { [Op.ne]: addressId } },
          order: [['createdAt', 'ASC']],
        });

        if (otherAddress) {
          // Set the other address to default
          otherAddress.isDefault = true;
          await otherAddress.save();
          userAddress.isDefault = false;
        } else {
          // If this is the only address, it must remain default
          userAddress.isDefault = true;
        }
      }
    }

    await userAddress.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      address: userAddress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user address
 * @route   DELETE /api/v1/user-addresses/:id
 * @access  Private
 */
export const deleteUserAddress = async (req, res, next) => {
  try {
    const addressId = req.params.id;

    const userAddress = await UserAddress.findOne({
      where: { id: addressId, userId: req.user.id },
    });

    if (!userAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or unauthorized.',
      });
    }

    const wasDefault = userAddress.isDefault;
    await userAddress.destroy();

    // If the deleted address was the default, make another one default
    if (wasDefault) {
      const remainingAddress = await UserAddress.findOne({
        where: { userId: req.user.id },
        order: [['createdAt', 'ASC']],
      });

      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
