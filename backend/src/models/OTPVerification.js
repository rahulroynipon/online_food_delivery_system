import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const OTPVerification = sequelize.define(
  'OTPVerification',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.ENUM('REGISTRATION', 'PASSWORD_RESET'),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'otp_verifications',
    timestamps: true,
  }
);

export default OTPVerification;
