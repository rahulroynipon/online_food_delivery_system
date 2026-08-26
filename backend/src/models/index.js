import User from './User.js';
import Restaurant from './Restaurant.js';
import Rider from './Rider.js';
import PlatformCategory from './PlatformCategory.js';
import RestaurantCategory from './RestaurantCategory.js';
import Food from './Food.js';
import FoodVariant from './FoodVariant.js';
import DeliveryZone from './DeliveryZone.js';
import RestaurantDeliveryZone from './RestaurantDeliveryZone.js';
import Notification from './Notification.js';

// Associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
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
};
