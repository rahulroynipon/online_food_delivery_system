import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { ActiveStatus } from '../enums/index.js';

const RestaurantCategory = sequelize.define(
  'RestaurantCategory',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ActiveStatus)),
      allowNull: true,
    },
  },
  {
    tableName: 'restaurant_categories',
    timestamps: true,
  }
);

export default RestaurantCategory;
