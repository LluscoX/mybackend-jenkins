const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// ── Verifica que el token JWT sea válido
const autenticar = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Token de autenticación requerido',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id_usuario, {
      attributes: { exclude: ['password'] },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Usuario no válido o deshabilitado',
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, mensaje: 'Token expirado' });
    }
    return res.status(401).json({ ok: false, mensaje: 'Token inválido' });
  }
};

// ── Verifica que el usuario sea de tipo cliente
const soloCliente = (req, res, next) => {
  if (req.usuario.tipo_usuario !== 'cliente') {
    return res.status(403).json({
      ok: false,
      mensaje: 'Acceso permitido solo para clientes',
    });
  }
  next();
};

// ── Verifica que sea conductor
const soloConductor = (req, res, next) => {
  if (req.usuario.tipo_usuario !== 'conductor') {
    return res.status(403).json({
      ok: false,
      mensaje: 'Acceso permitido solo para conductores',
    });
  }
  next();
};

// ── Verifica que sea admin
const soloAdmin = (req, res, next) => {
  if (req.usuario.tipo_usuario !== 'admin') {
    return res.status(403).json({
      ok: false,
      mensaje: 'Acceso permitido solo para administradores',
    });
  }
  next();
};

// ── Autenticación del sensor IoT (header x-sensor-key)
const autenticarSensor = (req, res, next) => {
  const sensorKey = req.headers['x-sensor-key'];
  if (!sensorKey || sensorKey !== process.env.SENSOR_MASTER_KEY) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Clave de sensor inválida',
    });
  }
  next();
};

module.exports = {
  autenticar,
  soloCliente,
  soloConductor,
  soloAdmin,
  autenticarSensor,
};