const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_otb: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  latitud: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitud: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  referencia: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'clientes',
  timestamps: true,
});

module.exports = Cliente;