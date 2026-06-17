const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prediccion = sequelize.define('Prediccion', {
  id_prediccion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_tanque: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dias_restantes: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha_estimacion_vacio: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  nivel_estimado_manana: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  consumo_diario_promedio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  nivel_al_calcular: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  lecturas_usadas: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  mensaje_alerta: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  nivel_alerta: {
    type: DataTypes.ENUM('ok', 'advertencia', 'critico'),
    defaultValue: 'ok',
  },
}, {
  tableName: 'predicciones',
  timestamps: true,
});

module.exports = Prediccion;