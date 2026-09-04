import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    riderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    addressId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'CONFIRMED',
        'PREPARING',
        'READY',
        'RIDER_ASSIGNED',
        'PICKED_UP',
        'ON_THE_WAY',
        'DELIVERED',
        'CANCELLED'
      ),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('COD', 'ONLINE'),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    restaurantEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    riderEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    platformCommission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    deliveryAddressText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    deliveryLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    deliveryLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'orders',
    timestamps: true,
  }
);

export default Order;
