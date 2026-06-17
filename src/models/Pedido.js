const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pedido = sequelize.define('Pedido', {
  id_pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_conductor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  cantidad_litros: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  precio_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  direccion_entrega: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  latitud_entrega: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitud_entrega: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aceptado', 'en_camino', 'entregado', 'cancelado'),
    defaultValue: 'pendiente',
  },
  fecha_pedido: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_aceptado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_en_camino: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_entregado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_cancelado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  motivo_cancelacion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  calificacion: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'pedidos',
  timestamps: true,
});

module.exports = Pedido;