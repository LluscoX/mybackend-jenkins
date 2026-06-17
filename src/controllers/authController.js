const jwt      = require('jsonwebtoken');
const { body } = require('express-validator');
const { Usuario, Cliente, Otb } = require('../models');
const { validar } = require('../middleware/errores');
const { notificarSistema } = require('../services/notificacionService');

// ── Generar token JWT
const generarToken = (id_usuario, tipo_usuario) => {
  return jwt.sign(
    { id_usuario, tipo_usuario },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─────────────────────────────────────────────────────────
//  POST /api/auth/registro
//  Registra un nuevo cliente
// ─────────────────────────────────────────────────────────
const validarRegistro = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  body('id_otb').isInt({ min: 1 }).withMessage('OTB requerida'),
  body('latitud').optional().isFloat().withMessage('Latitud inválida'),
  body('longitud').optional().isFloat().withMessage('Longitud inválida'),
  validar,
];

const registro = async (req, res) => {
  try {
    const {
      nombre, apellido, telefono, email, password,
      id_otb, direccion, latitud, longitud, referencia,
    } = req.body;

    // Verificar que la OTB exista
    const otb = await Otb.findByPk(id_otb);
    if (!otb) {
      return res.status(400).json({ ok: false, mensaje: 'OTB no encontrada' });
    }

    // Crear usuario base
    const usuario = await Usuario.create({
      nombre,
      apellido,
      telefono,
      email,
      password,
      tipo_usuario: 'cliente',
    });

    // Crear perfil cliente
    const cliente = await Cliente.create({
      id_usuario: usuario.id_usuario,
      id_otb,
      direccion,
      latitud:    latitud  ? parseFloat(latitud)  : null,
      longitud:   longitud ? parseFloat(longitud) : null,
      referencia,
    });

    // Notificación de bienvenida
    await notificarSistema(
      usuario.id_usuario,
      '¡Bienvenido a YacuApp!',
      `Hola ${nombre}, tu cuenta fue creada exitosamente. Ya puedes pedir agua.`
    );

    const token = generarToken(usuario.id_usuario, 'cliente');

    res.status(201).json({
      ok: true,
      mensaje: '¡Registro exitoso!',
      token,
      usuario: {
        id_usuario:   usuario.id_usuario,
        nombre:       usuario.nombre,
        apellido:     usuario.apellido,
        email:        usuario.email,
        tipo_usuario: usuario.tipo_usuario,
        id_cliente:   cliente.id_cliente,
        id_otb:       cliente.id_otb,
        otb_nombre:   otb.nombre,
      },
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ ok: false, mensaje: 'El email ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar usuario' });
  }
};

// ─────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────
const validarLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Password requerido'),
  validar,
];

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
    }

    if (!usuario.activo) {
      return res.status(401).json({ ok: false, mensaje: 'Cuenta deshabilitada' });
    }

    const passwordOk = await usuario.verificarPassword(password);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
    }

    // Obtener perfil cliente con OTB
    const cliente = await Cliente.findOne({
      where: { id_usuario: usuario.id_usuario },
      include: [{ model: Otb, as: 'otb' }],
    });

    const token = generarToken(usuario.id_usuario, usuario.tipo_usuario);

    res.json({
      ok: true,
      token,
      usuario: {
        id_usuario:   usuario.id_usuario,
        nombre:       usuario.nombre,
        apellido:     usuario.apellido,
        email:        usuario.email,
        tipo_usuario: usuario.tipo_usuario,
        id_cliente:   cliente?.id_cliente,
        id_otb:       cliente?.id_otb,
        otb_nombre:   cliente?.otb?.nombre,
        direccion:    cliente?.direccion,
        latitud:      cliente?.latitud,
        longitud:     cliente?.longitud,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en el login' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/auth/perfil  (requiere token)
// ─────────────────────────────────────────────────────────
const perfil = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({
      where: { id_usuario: req.usuario.id_usuario },
      include: [{ model: Otb, as: 'otb' }],
    });

    res.json({
      ok: true,
      usuario: {
        ...req.usuario.toJSON(),
        id_cliente: cliente?.id_cliente,
        id_otb:     cliente?.id_otb,
        otb_nombre: cliente?.otb?.nombre,
        direccion:  cliente?.direccion,
        latitud:    cliente?.latitud,
        longitud:   cliente?.longitud,
        referencia: cliente?.referencia,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo perfil' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/auth/otbs  — Lista OTBs disponibles para registro
// ─────────────────────────────────────────────────────────
const listarOtbs = async (req, res) => {
  try {
    const otbs = await Otb.findAll({ order: [['nombre', 'ASC']] });
    res.json({ ok: true, otbs });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo OTBs' });
  }
};

module.exports = {
  registro, validarRegistro,
  login,    validarLogin,
  perfil,
  listarOtbs,
};