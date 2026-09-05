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
import RestaurantAddon from './RestaurantAddon.js';
import FoodAddon from './FoodAddon.js';
import UserAddress from './UserAddress.js';
import OTPVerification from './OTPVerification.js';
import PlatformSettings from './PlatformSettings.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import OrderItemAddon from './OrderItemAddon.js';
import WalletTransaction from './WalletTransaction.js';
import WithdrawalRequest from './WithdrawalRequest.js';

// Associations Configuration
// User <-> Restaurant (One-to-One)
User.hasOne(Restaurant, { foreignKey: 'userId', as: 'restaurant', onDelete: 'CASCADE' });
Restaurant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Rider (One-to-One)
User.hasOne(Rider, { foreignKey: 'userId', as: 'rider', onDelete: 'CASCADE' });
Rider.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Notification (One-to-Many)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> UserAddress (One-to-Many)
User.hasMany(UserAddress, { foreignKey: 'userId', as: 'addresses', onDelete: 'CASCADE' });
UserAddress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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

// PlatformCategory <-> RestaurantCategory (One-to-Many)
PlatformCategory.hasMany(RestaurantCategory, {
  foreignKey: 'platformCategoryId',
  as: 'restaurantCategories',
  onDelete: 'SET NULL',
});
RestaurantCategory.belongsTo(PlatformCategory, { foreignKey: 'platformCategoryId', as: 'platformCategory' });

// Food <-> FoodVariant (One-to-Many)
Food.hasMany(FoodVariant, { foreignKey: 'foodId', as: 'variants', onDelete: 'CASCADE' });
FoodVariant.belongsTo(Food, { foreignKey: 'foodId', as: 'food' });

// Restaurant <-> RestaurantAddon (One-to-Many)
Restaurant.hasMany(RestaurantAddon, { foreignKey: 'restaurantId', as: 'addons', onDelete: 'CASCADE' });
RestaurantAddon.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

// Food <-> RestaurantAddon (Many-to-Many via FoodAddon)
Food.belongsToMany(RestaurantAddon, {
  through: FoodAddon,
  foreignKey: 'foodId',
  otherKey: 'addonId',
  as: 'addons',
});
RestaurantAddon.belongsToMany(Food, {
  through: FoodAddon,
  foreignKey: 'addonId',
  otherKey: 'foodId',
  as: 'foods',
});

// Restaurant <-> DeliveryZone (Many-to-Many via RestaurantDeliveryZone)
Restaurant.belongsToMany(DeliveryZone, {
  through: RestaurantDeliveryZone,
  foreignKey: 'restaurantId',
  otherKey: 'deliveryZoneId',
  as: 'deliveryZones',
});
// User <-> Order (One-to-Many)
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Restaurant <-> Order (One-to-Many)
Restaurant.hasMany(Order, { foreignKey: 'restaurantId', as: 'orders' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

// Rider/User <-> Order (One-to-Many)
User.hasMany(Order, { foreignKey: 'riderId', as: 'deliveryOrders' });
Order.belongsTo(User, { foreignKey: 'riderId', as: 'rider' });

// UserAddress <-> Order (One-to-Many)
UserAddress.hasMany(Order, { foreignKey: 'addressId', as: 'orders' });
Order.belongsTo(UserAddress, { foreignKey: 'addressId', as: 'address' });

// Order <-> OrderItem (One-to-Many)
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// OrderItem <-> OrderItemAddon (One-to-Many)
OrderItem.hasMany(OrderItemAddon, { foreignKey: 'orderItemId', as: 'addons', onDelete: 'CASCADE' });
OrderItemAddon.belongsTo(OrderItem, { foreignKey: 'orderItemId', as: 'orderItem' });

// User <-> WalletTransaction (One-to-Many)
User.hasMany(WalletTransaction, { foreignKey: 'userId', as: 'transactions' });
WalletTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Order <-> WalletTransaction (One-to-Many)
Order.hasMany(WalletTransaction, { foreignKey: 'orderId', as: 'transactions' });
WalletTransaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// User <-> WithdrawalRequest (One-to-Many)
User.hasMany(WithdrawalRequest, { foreignKey: 'userId', as: 'withdrawalRequests' });
WithdrawalRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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
  RestaurantAddon,
  FoodAddon,
  UserAddress,
  OTPVerification,
  PlatformSettings,
  Order,
  OrderItem,
  OrderItemAddon,
  WalletTransaction,
  WithdrawalRequest,
};
