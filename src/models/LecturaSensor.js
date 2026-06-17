const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LecturaSensor = sequelize.define('LecturaSensor', {
  id_lectura: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_tanque: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  distancia_cm: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: true,
  },
  nivel_cm: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: true,
  },
  nivel_litros: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'lecturas_sensor',
  timestamps: true,
  updatedAt: false, // Solo createdAt
});

module.exports = LecturaSensor;