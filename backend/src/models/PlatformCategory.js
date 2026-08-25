import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { ActiveStatus } from '../enums/index.js';

const PlatformCategory = sequelize.define(
  'PlatformCategory',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
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
    tableName: 'platform_categories',
    timestamps: true,
  }
);

export default PlatformCategory;
