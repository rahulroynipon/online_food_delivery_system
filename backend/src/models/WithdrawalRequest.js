import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const WithdrawalRequest = sequelize.define(
  'WithdrawalRequest',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER'),
      allowNull: false,
      defaultValue: 'BKASH',
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountType: {
      type: DataTypes.ENUM('PERSONAL', 'AGENT', 'MERCHANT'),
      allowNull: false,
      defaultValue: 'PERSONAL',
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    branchName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountHolderName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    adminNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'withdrawal_requests',
    timestamps: true,
  }
);

export default WithdrawalRequest;
