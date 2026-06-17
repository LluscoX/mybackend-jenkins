const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id_notificacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_tanque: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  titulo: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM('alerta_tanque', 'pedido', 'sistema'),
    defaultValue: 'sistema',
  },
  leido: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
  },
}, {
  tableName: 'notificaciones',
  timestamps: true,
});

module.exports = Notificacion;