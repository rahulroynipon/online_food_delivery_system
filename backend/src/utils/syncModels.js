import sequelize from '../config/db.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';
import Order from '../models/Order.js';

/**
 * Configure Sequelize Associations (Relations)
 */
const configureAssociations = () => {
  // User <-> Restaurant (One-to-Many)
  User.hasMany(Restaurant, { foreignKey: 'ownerId', as: 'restaurants', onDelete: 'CASCADE' });
  Restaurant.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

  // Restaurant <-> FoodItem (One-to-Many)
  Restaurant.hasMany(FoodItem, { foreignKey: 'restaurantId', as: 'foodItems', onDelete: 'CASCADE' });
  FoodItem.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

  // User <-> Order (One-to-Many)
  User.hasMany(Order, { foreignKey: 'customerId', as: 'orders', onDelete: 'SET NULL' });
  Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

  // Restaurant <-> Order (One-to-Many)
  Restaurant.hasMany(Order, { foreignKey: 'restaurantId', as: 'orders', onDelete: 'SET NULL' });
  Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
};

/**
 * Synchronizes models with the database using Sequelize sync.
 */
const syncModels = async () => {
  try {
    console.log('Initializing database associations...');
    configureAssociations();

    console.log('Syncing database schema (Sequelize sync)...');
    // Using alter: true updates tables to match models without dropping everything.
    // In production, migrations are preferred, but sync is ideal for initial setup.
    await sequelize.sync({ alter: true });
    
    console.log('Database tables synchronized successfully.');
  } catch (error) {
    console.warn('Could not synchronize database tables (is PostgreSQL running & configured?):', error.message);
  }
};

export default syncModels;
export { configureAssociations };
