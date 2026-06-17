const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Calificacion = sequelize.define('Calificacion', {
  id_calificacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_conductor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estrellas: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'calificaciones',
  timestamps: true,
  updatedAt: false,
});

module.exports = Calificacion;
