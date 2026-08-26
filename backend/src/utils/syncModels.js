import sequelize from '../config/db.js';
import {
  User,
  Restaurant,
  Rider,
  PlatformCategory,
  RestaurantCategory,
  Food,
  FoodVariant,
  DeliveryZone,
  RestaurantDeliveryZone,
  Notification,
} from '../models/index.js';
import { NotificationEvent } from '../enums/index.js';
import { ensureDatabaseExists } from './ensureDb.js';

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

  // Restaurant <-> DeliveryZone (Many-to-Many via RestaurantDeliveryZone)
  Restaurant.belongsToMany(DeliveryZone, {
    through: RestaurantDeliveryZone,
    foreignKey: 'restaurantId',
    otherKey: 'deliveryZoneId',
    as: 'deliveryZones',
  });
  DeliveryZone.belongsToMany(Restaurant, {
    through: RestaurantDeliveryZone,
    foreignKey: 'deliveryZoneId',
    otherKey: 'restaurantId',
    as: 'restaurants',
  });
};

/**
 * Synchronizes models with the database using Sequelize sync.
 */
const syncModels = async () => {
  try {
    // Verify database exists before running Sequelize commands
    await ensureDatabaseExists();

    console.log('Initializing database associations...');
    configureAssociations();

    console.log('Syncing database schema (Sequelize sync)...');
    await sequelize.sync({ alter: true });
    console.log('Database tables synchronized successfully.');

    // Auto-backfill notifications for any existing pending applications
    console.log('Backfilling notifications for pending onboarding requests...');

    // Seed default notifications if table is completely empty
    const notifCount = await Notification.count();
    if (notifCount === 0) {
      console.log('Seeding demo notifications in database...');
      await Notification.bulkCreate([
        {
          event: NotificationEvent.NEW_RESTAURANT_APPLICATION,
          message: 'New Restaurant: "Kacchi Bhai" by Tanvir Ahmed',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 120),
        },
        {
          event: NotificationEvent.NEW_RIDER_APPLICATION,
          message: 'New Rider: Karim Ullah (Motorcycle)',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 45),
        },
        {
          event: NotificationEvent.NEW_RESTAURANT_APPLICATION,
          message: 'New Restaurant: "Burger Express" by Tasnim Rahman',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 10),
        }
      ]);
    }

    const pendingRest = await Restaurant.findAll({ where: { status: 'PENDING' } });
    for (const app of pendingRest) {
      const user = await User.findByPk(app.userId);
      const msg = `New Restaurant: "${app.name}" by ${user?.name || 'Owner'}`;
      const exists = await Notification.findOne({ where: { message: msg } });
      if (!exists) {
        await Notification.create({
          event: NotificationEvent.NEW_RESTAURANT_APPLICATION,
          message: msg,
          read: false,
          createdAt: app.createdAt
        });
      }
    }

    const pendingRiders = await Rider.findAll({ where: { status: 'PENDING' } });
    for (const app of pendingRiders) {
      const user = await User.findByPk(app.userId);
      const msg = `New Rider: ${user?.name || 'Rider'} (${app.vehicleType || 'Motorcycle'})`;
      const exists = await Notification.findOne({ where: { message: msg } });
      if (!exists) {
        await Notification.create({
          event: NotificationEvent.NEW_RIDER_APPLICATION,
          message: msg,
          read: false,
          createdAt: app.createdAt
        });
      }
    }
    console.log('Notification backfilling completed.');
  } catch (error) {
    console.warn(
      'Could not synchronize database tables (is PostgreSQL running & configured?):',
      error.message
    );
  }
};

export default syncModels;
export { configureAssociations };
