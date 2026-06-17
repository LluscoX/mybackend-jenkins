const { Sequelize } = require('sequelize');
require('dotenv').config();
console.log("DEBUG ENV USER:", process.env.DB_USER); // <--- AÑADE ESTO PARA PROBAR
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
    },
    timezone: '-04:00', // Bolivia (BOT)
  }
);

const conectarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente');
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, conectarDB };