require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const { conectarDB }      = require('./config/database');
const { manejarError }    = require('./middleware/errores');

// ── Rutas
const authRoutes        = require('./routes/auth.routes');
const tanqueRoutes      = require('./routes/tanque.routes');
const pedidoRoutes      = require('./routes/pedido.routes');
const conductorRoutes   = require('./routes/conductor.routes');
const sensorRoutes      = require('./routes/sensor.routes');
const notifRoutes       = require('./routes/notificacion.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ── Healthcheck
app.get('/', (req, res) => {
  res.json({ ok: true, mensaje: 'YacuApp API corriendo ✅', version: '2.0' });
});

// ── Montaje de rutas
app.use('/api/auth',       authRoutes);
app.use('/api/cliente',    tanqueRoutes);
app.use('/api/pedidos',    pedidoRoutes);
app.use('/api/conductor',  conductorRoutes);
app.use('/api/sensor',     sensorRoutes);
app.use('/api/notificaciones', notifRoutes);

// ── Manejo centralizado de errores (debe ir al final)
app.use(manejarError);

// ── Arrancar servidor
const iniciar = async () => {
  await conectarDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
};

iniciar();
