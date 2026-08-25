import { Op } from 'sequelize';

/**
 * Generates a URL-friendly slug from a string.
 * @param {string} text - The input text to convert
 * @returns {string} The formatted slug string
 */
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

/**
 * Checks database records to ensure the generated slug is completely unique for the model.
 * If conflicts exist, appends an incremented numeric suffix (e.g. my-slug-1).
 * @param {Object} Model - The Sequelize model to check against
 * @param {string} text - The name or text to generate a slug from
 * @param {number|string} [excludeId] - Optional model ID to ignore (useful for updates)
 * @returns {Promise<string>} A guaranteed unique slug string
 */
export const generateUniqueSlug = async (Model, text, excludeId = null) => {
  const baseSlug = slugify(text);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const where = { slug };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const existing = await Model.findOne({ where, paranoid: false });
    if (!existing) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

export default slugify;
