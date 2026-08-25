import sequelize from '../config/db.js';
import {
  User,
  Restaurant,
  Rider,
  PlatformCategory,
  RestaurantCategory,
  Food,
  FoodVariant,
} from '../models/index.js';

/**
 * Configure Sequelize Associations (Relations)
 */
const configureAssociations = () => {
  // User <-> Restaurant (One-to-One)
  User.hasOne(Restaurant, { foreignKey: 'userId', as: 'restaurant', onDelete: 'CASCADE' });
  Restaurant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // User <-> Rider (One-to-One)
  User.hasOne(Rider, { foreignKey: 'userId', as: 'rider', onDelete: 'CASCADE' });
  Rider.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Restaurant <-> RestaurantCategory (One-to-Many)
  Restaurant.hasMany(RestaurantCategory, {
    foreignKey: 'restaurantId',
    as: 'categories',
    onDelete: 'CASCADE',
  });
  RestaurantCategory.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

  // Restaurant <-> Food (One-to-Many)
  Restaurant.hasMany(Food, { foreignKey: 'restaurantId', as: 'foods', onDelete: 'CASCADE' });
  Food.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

  // RestaurantCategory <-> Food (One-to-Many)
  RestaurantCategory.hasMany(Food, {
    foreignKey: 'restaurantCategoryId',
    as: 'foods',
    onDelete: 'CASCADE',
  });
  Food.belongsTo(RestaurantCategory, {
    foreignKey: 'restaurantCategoryId',
    as: 'restaurantCategory',
  });

  // PlatformCategory <-> Food (One-to-Many)
  PlatformCategory.hasMany(Food, {
    foreignKey: 'platformCategoryId',
    as: 'foods',
    onDelete: 'CASCADE',
  });
  Food.belongsTo(PlatformCategory, { foreignKey: 'platformCategoryId', as: 'platformCategory' });

  // Food <-> FoodVariant (One-to-Many)
  Food.hasMany(FoodVariant, { foreignKey: 'foodId', as: 'variants', onDelete: 'CASCADE' });
  FoodVariant.belongsTo(Food, { foreignKey: 'foodId', as: 'food' });
};

/**
 * Synchronizes models with the database using Sequelize sync.
 */
const syncModels = async () => {
  try {
    console.log('Initializing database associations...');
    configureAssociations();

    console.log('Syncing database schema (Sequelize sync)...');
    await sequelize.sync({ alter: true });

    console.log('Database tables synchronized successfully.');
  } catch (error) {
    console.warn(
      'Could not synchronize database tables (is PostgreSQL running & configured?):',
      error.message
    );
  }
};

export default syncModels;
export { configureAssociations };
