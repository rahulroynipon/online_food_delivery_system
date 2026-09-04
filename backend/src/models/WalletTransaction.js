import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const WalletTransaction = sequelize.define(
  'WalletTransaction',
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
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('EARNING', 'DELIVERY_FEE', 'COD_COLLECTION', 'PAYOUT', 'SETTLEMENT'),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'wallet_transactions',
    timestamps: true,
  }
);

export default WalletTransaction;
