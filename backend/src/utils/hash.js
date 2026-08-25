import bcrypt from 'bcryptjs';

/**
 * Hashes a plain text password using bcrypt.
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} The generated hash string
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password.
 * (Cryptographically validates/matches the hash, since bcrypt hashes cannot be decrypted/unhashed)
 * @param {string} password - The plain text password
 * @param {string} hashedPassword - The hashed password
 * @returns {Promise<boolean>} True if the password matches the hash, false otherwise
 */
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
