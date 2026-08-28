import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const UserAddress = sequelize.define(
  'UserAddress',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'user_addresses',
    timestamps: true,
  }
);

export default UserAddress;
