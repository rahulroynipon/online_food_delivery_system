import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const OrderItemAddon = sequelize.define(
  'OrderItemAddon',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    addonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    addonName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: 'order_item_addons',
    timestamps: true,
  }
);

export default OrderItemAddon;
