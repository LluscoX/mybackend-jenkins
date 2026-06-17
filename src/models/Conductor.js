const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conductor = sequelize.define('Conductor', {
  id_conductor: {
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
  nombre_empresa: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  placa: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
  },
  capacidad_litros: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  precio_por_litro: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('disponible', 'ocupado', 'offline'),
    defaultValue: 'offline',
  },
  calificacion: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.00,
  },
  total_entregas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  latitud_actual: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitud_actual: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  ultima_ubicacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'conductores',
  timestamps: true,
});

module.exports = Conductor;
