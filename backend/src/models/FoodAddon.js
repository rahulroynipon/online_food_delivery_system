import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const FoodAddon = sequelize.define(
  'FoodAddon',
  {
    foodId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'foods',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    addonId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'restaurant_addons',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'food_addons',
    timestamps: false,
  }
);

export default FoodAddon;
