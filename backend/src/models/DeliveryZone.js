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
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ActiveStatus)),
    allowNull: true,
  },
}, {
  tableName: 'delivery_zones',
  timestamps: true,
  paranoid: true, // Enables soft delete (adds deleted_at column)
});

export default DeliveryZone;
