import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { ActiveStatus } from '../enums/index.js';

const DeliveryZone = sequelize.define('DeliveryZone', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ActiveStatus)),
    allowNull: true,
  },
}, {
  tableName: 'delivery_zones',
  timestamps: true,
});

export default DeliveryZone;
