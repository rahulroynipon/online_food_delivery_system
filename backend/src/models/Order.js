import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'restaurants',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'),
    defaultValue: 'placed',
    allowNull: false,
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'orders',
  timestamps: true,
});

export default Order;
