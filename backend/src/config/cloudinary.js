import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import env from './env.js';

// Configure Cloudinary instance
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

/**
 * Checks whether Cloudinary upload should be used.
 * Returns true if:
 * 1. NODE_ENV === 'production' OR USE_CLOUDINARY === 'true'
 * 2. Cloudinary credentials (cloudName, apiKey, apiSecret) are provided
 */
export const isCloudinaryEnabled = () => {
  const isProd = env.NODE_ENV === 'production';
  const forceCloudinary = env.cloudinary.useCloudinary;
  const hasCredentials = Boolean(
    env.cloudinary.cloudName &&
    env.cloudinary.apiKey &&
    env.cloudinary.apiSecret
  );

  return (isProd || forceCloudinary) && hasCredentials;
};

/**
 * Directly uploads a local file to Cloudinary
 * @param {string} filePath - Path to local file
 * @param {object} options - Optional cloudinary upload parameters
 * @returns {Promise<object>} - Cloudinary upload result
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  return await cloudinary.uploader.upload(filePath, {
    folder: env.cloudinary.folder || 'food_delivery',
    resource_type: 'auto',
    ...options,
  });
};

/**
 * Extracts public_id from a Cloudinary URL
 * Example:
 *   "https://res.cloudinary.com/cloud/image/upload/v1612345678/food_delivery/sample.jpg"
 *   -> "food_delivery/sample"
 * @param {string} url
 * @returns {string|null}
 */
export const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
  return match ? match[1] : null;
};

/**
 * Universal deletion helper: deletes from Cloudinary if it's a Cloudinary URL,
 * or unlinks from local filesystem if it's a local file path.
 * @param {string} imagePath
 */
export const deleteStoredFile = async (imagePath) => {
  if (!imagePath) return;

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    if (imagePath.includes('cloudinary.com')) {
      const publicId = getPublicIdFromUrl(imagePath);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error(`Failed to delete Cloudinary asset (${publicId}):`, err.message);
        }
      }
    }
  } else {
    // Local filesystem path
    fs.unlink(imagePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(`Failed to delete local file (${imagePath}):`, err.message);
      }
    });
  }
};

export default cloudinary;
