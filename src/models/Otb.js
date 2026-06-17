const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Otb = sequelize.define('Otb', {
  id_otb: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  distrito: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  municipio: {
    type: DataTypes.STRING(100),
    defaultValue: 'Cochabamba',
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  latitud_ref: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitud_ref: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
}, {
  tableName: 'otb',
  timestamps: true,
});

module.exports = Otb;