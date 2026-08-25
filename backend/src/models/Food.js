import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { ActiveStatus } from '../enums/index.js';

const Food = sequelize.define(
  'Food',
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
    restaurantCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurant_categories',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    platformCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'platform_categories',
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
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ActiveStatus)),
      allowNull: true,
    },
  },
  {
    tableName: 'foods',
    timestamps: true,
  }
);

export default Food;
