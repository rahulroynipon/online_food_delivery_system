import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { RiderAvailability, RiderStatus } from '../enums/index.js';

const Rider = sequelize.define(
  'Rider',
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
    vehicleType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currentLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    currentLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    availability: {
      type: DataTypes.ENUM(...Object.values(RiderAvailability)),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RiderStatus)),
      allowNull: true,
    },
  },
  {
    tableName: 'riders',
    timestamps: true,
  }
);

export default Rider;
