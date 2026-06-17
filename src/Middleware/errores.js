const { validationResult } = require('express-validator');

// ── Manejo centralizado de errores
const manejarError = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      ok: false,
      mensaje: 'Error de validación en base de datos',
      errores: err.errors.map(e => e.message),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      ok: false,
      mensaje: 'Ya existe un registro con esos datos',
      campo: err.errors[0]?.path,
    });
  }

  res.status(err.status || 500).json({
    ok: false,
    mensaje: err.message || 'Error interno del servidor',
  });
};

// ── Valida resultados de express-validator
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Datos de entrada inválidos',
      errores: errores.array().map(e => ({ campo: e.path, mensaje: e.msg })),
    });
  }
  next();
};

module.exports = { manejarError, validar };