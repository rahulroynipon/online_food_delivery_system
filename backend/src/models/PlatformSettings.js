import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PlatformSettings = sequelize.define(
  'PlatformSettings',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 15.00, // 15.00%
    },
    riderBaseFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 30.00, // 30.00 Tk
    },
    riderFeePerKm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 15.00, // 15.00 Tk per km
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5.00, // 5.00%
    },
  },
  {
    tableName: 'platform_settings',
    timestamps: true,
  }
);

export default PlatformSettings;
