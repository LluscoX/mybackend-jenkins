const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tanque = sequelize.define('Tanque', {
  id_tanque: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(100),
    defaultValue: 'Tanque principal',
  },
  capacidad_litros: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nivel_actual: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  porcentaje_actual: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  token_sensor: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
  },
  altura_tanque_cm: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ultima_lectura: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ubicacion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  activo: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
  },
}, {
  tableName: 'tanques',
  timestamps: true,
});

module.exports = Tanque;