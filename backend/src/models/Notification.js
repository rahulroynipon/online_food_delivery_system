import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import NotificationEvent from '../enums/NotificationEvent.js';

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    event: {
      type: DataTypes.ENUM(...Object.values(NotificationEvent)),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
  }
);

export default Notification;
