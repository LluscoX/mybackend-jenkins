const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SeguimientoPedido = sequelize.define('SeguimientoPedido', {
  id_seguimiento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_conductor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  latitud: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitud: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  velocidad_kmh: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'seguimiento_pedido',
  timestamps: false,
});

module.exports = SeguimientoPedido;
