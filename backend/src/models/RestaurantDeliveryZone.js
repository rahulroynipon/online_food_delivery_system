import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const RestaurantDeliveryZone = sequelize.define('RestaurantDeliveryZone', {
  restaurantId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'restaurants',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  deliveryZoneId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'delivery_zones',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'restaurant_delivery_zones',
  timestamps: false, // Standard junction tables do not necessarily require timestamps
});

export default RestaurantDeliveryZone;
