// =====================================================
//  controllers/ConductorController.js
//  Todo lo que hace el conductor:
//    - Registro
//    - Ver pedidos disponibles en su OTB
//    - Aceptar / actualizar estado del pedido
//    - Enviar ubicación GPS
//    - Ver su historial
// =====================================================

const { body } = require('express-validator');
const { Op }   = require('sequelize');
const {
  Usuario, Conductor, Otb, Pedido, Cliente, SeguimientoPedido,
} = require('../models');
const { validar }          = require('../middleware/errores');
const { notificarPedido }  = require('../services/notificacionService');

// ─────────────────────────────────────────────────────────
//  POST /api/conductor/registro
//  Registra un nuevo conductor (usuario + perfil)
// ─────────────────────────────────────────────────────────
const validarRegistro = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  body('id_otb').isInt({ min: 1 }).withMessage('OTB requerida'),
  body('placa').notEmpty().withMessage('La placa del vehículo es requerida'),
  body('capacidad_litros').isInt({ min: 500 }).withMessage('Capacidad mínima 500 litros'),
  body('precio_por_litro').isFloat({ min: 0.01 }).withMessage('Precio por litro requerido'),
  validar,
];

const registro = async (req, res) => {
  try {
    const {
      nombre, apellido, telefono, email, password,
      id_otb, nombre_empresa, placa, capacidad_litros, precio_por_litro,
    } = req.body;

    const otb = await Otb.findByPk(id_otb);
    if (!otb) return res.status(400).json({ ok: false, mensaje: 'OTB no encontrada' });

    const usuario = await Usuario.create({
      nombre, apellido, telefono, email, password,
      tipo_usuario: 'conductor',
    });

    const conductor = await Conductor.create({
      id_usuario:      usuario.id_usuario,
      id_otb,
      nombre_empresa,
      placa:            placa.toUpperCase(),
      capacidad_litros: parseInt(capacidad_litros),
      precio_por_litro: parseFloat(precio_por_litro),
      estado:           'offline',
    });

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, tipo_usuario: 'conductor' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      ok: true,
      mensaje: '¡Registro de conductor exitoso!',
      token,
      usuario: {
        id_usuario:    usuario.id_usuario,
        nombre:        usuario.nombre,
        apellido:      usuario.apellido,
        email:         usuario.email,
        tipo_usuario:  'conductor',
        id_conductor:  conductor.id_conductor,
        id_otb:        conductor.id_otb,
        otb_nombre:    otb.nombre,
        placa:         conductor.placa,
        capacidad_litros: conductor.capacidad_litros,
        precio_por_litro: conductor.precio_por_litro,
        estado:        conductor.estado,
      },
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const campo = error.errors[0]?.path;
      const msg   = campo === 'placa' ? 'Esa placa ya está registrada' : 'El email ya está registrado';
      return res.status(400).json({ ok: false, mensaje: msg });
    }
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar conductor' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/conductor/perfil
//  Datos del conductor autenticado
// ─────────────────────────────────────────────────────────
const perfil = async (req, res) => {
  try {
    const conductor = await Conductor.findOne({
      where: { id_usuario: req.usuario.id_usuario },
      include: [{ model: Otb, as: 'otb' }],
    });
    if (!conductor) return res.status(404).json({ ok: false, mensaje: 'Perfil de conductor no encontrado' });

    res.json({
      ok: true,
      conductor: {
        id_conductor:    conductor.id_conductor,
        nombre_empresa:  conductor.nombre_empresa,
        placa:           conductor.placa,
        capacidad_litros: conductor.capacidad_litros,
        precio_por_litro: conductor.precio_por_litro,
        estado:          conductor.estado,
        calificacion:    conductor.calificacion,
        total_entregas:  conductor.total_entregas,
        otb:             conductor.otb?.nombre,
        lat_actual:      conductor.latitud_actual,
        lng_actual:      conductor.longitud_actual,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo perfil' });
  }
};

// ─────────────────────────────────────────────────────────
//  PUT /api/conductor/estado
//  Conductor cambia su disponibilidad (disponible / offline)
// ─────────────────────────────────────────────────────────
const cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['disponible', 'offline'].includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'Estado debe ser "disponible" u "offline"' });
    }

    const conductor = await Conductor.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    if (!conductor) return res.status(404).json({ ok: false, mensaje: 'Conductor no encontrado' });

    await conductor.update({ estado });
    res.json({ ok: true, mensaje: `Estado cambiado a "${estado}"`, estado });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error cambiando estado' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/conductor/pedidos/disponibles
//  Pedidos pendientes en la OTB del conductor
// ─────────────────────────────────────────────────────────
const pedidosDisponibles = async (req, res) => {
  try {
    const conductor = await Conductor.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    if (!conductor) return res.status(404).json({ ok: false, mensaje: 'Conductor no encontrado' });

    // Solo pedidos pendientes de la misma OTB
    const pedidos = await Pedido.findAll({
      where: { estado: 'pendiente', id_conductor: null },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          where: { id_otb: conductor.id_otb }, // misma OTB
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'telefono'] },
            { model: Otb,     as: 'otb',     attributes: ['nombre'] },
          ],
        },
      ],
      order: [['fecha_pedido', 'ASC']], // más antiguo primero
    });

    res.json({
      ok: true,
      pedidos: pedidos.map(p => ({
        id_pedido:         p.id_pedido,
        cantidad_litros:   p.cantidad_litros,
        precio_estimado:   (p.cantidad_litros * conductor.precio_por_litro).toFixed(2),
        direccion_entrega: p.direccion_entrega,
        latitud_entrega:   p.latitud_entrega,
        longitud_entrega:  p.longitud_entrega,
        fecha_pedido:      p.fecha_pedido,
        cliente: {
          nombre:   p.cliente.usuario?.nombre,
          apellido: p.cliente.usuario?.apellido,
          telefono: p.cliente.usuario?.telefono,
          otb:      p.cliente.otb?.nombre,
        },
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo pedidos disponibles' });
  }
};

// ─────────────────────────────────────────────────────────
//  PUT /api/conductor/pedidos/:id/aceptar
//  Conductor acepta un pedido pendiente
// ─────────────────────────────────────────────────────────
const aceptarPedido = async (req, res) => {
  try {
    const conductor = await Conductor.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    if (!conductor) return res.status(404).json({ ok: false, mensaje: 'Conductor no encontrado' });

    // Verificar que no tenga otro pedido activo
    const pedidoActivo = await Pedido.findOne({
      where: { id_conductor: conductor.id_conductor, estado: { [Op.in]: ['aceptado', 'en_camino'] } },
    });
    if (pedidoActivo) {
      return res.status(400).json({ ok: false, mensaje: 'Ya tienes un pedido activo. Complétalo antes de aceptar otro.' });
    }

    const pedido = await Pedido.findOne({
      where: { id_pedido: req.params.id, estado: 'pendiente', id_conductor: null },
      include: [{ model: Cliente, as: 'cliente' }],
    });
    if (!pedido) return res.status(404).json({ ok: false, mensaje: 'Pedido no disponible' });

    const precio_total = pedido.cantidad_litros * conductor.precio_por_litro;

    await pedido.update({
      id_conductor:  conductor.id_conductor,
      estado:        'aceptado',
      fecha_aceptado: new Date(),
      precio_total:  precio_total.toFixed(2),
    });

    await conductor.update({ estado: 'ocupado' });

    // Notificar al cliente
    const usuario_cliente = await Usuario.findOne({
      include: [{ model: require('../models').Cliente, as: 'perfilCliente', where: { id_cliente: pedido.id_cliente } }],
    });
    if (usuario_cliente) {
      await notificarPedido(
        usuario_cliente.id_usuario,
        pedido.id_pedido,
        '🚚 ¡Conductor en camino!',
        `${req.usuario.nombre} aceptó tu pedido de ${pedido.cantidad_litros} litros. Precio total: Bs ${precio_total.toFixed(2)}.`
      );
    }

    res.json({
      ok: true,
      mensaje: 'Pedido aceptado',
      pedido: {
        id_pedido:      pedido.id_pedido,
        estado:         'aceptado',
        cantidad_litros: pedido.cantidad_litros,
        precio_total:   precio_total.toFixed(2),
        direccion_entrega: pedido.direccion_entrega,
        latitud_entrega: pedido.latitud_entrega,
        longitud_entrega: pedido.longitud_entrega,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error aceptando pedido' });
  }
};

// ─────────────────────────────────────────────────────────
//  PUT /api/conductor/pedidos/:id/en-camino
//  Conductor marca que salió con el agua
// ─────────────────────────────────────────────────────────
const marcarEnCamino = async (req, res) => {
  try {
    const conductor = await Conductor.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    const pedido = await Pedido.findOne({
      where: { id_pedido: req.params.id, id_conductor: conductor.id_conductor, estado: 'aceptado' },
      include: [{ model: Cliente, as: 'cliente' }],
    });
    if (!pedido) return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado o no aceptado por ti' });

    await pedido.update({ estado: 'en_camino', fecha_en_camino: new Date() });

    const usuario_cliente = await _obtenerUsuarioDeCliente(pedido.id_cliente);
    if (usuario_cliente) {
      await notificarPedido(
        usuario_cliente.id_usuario,
        pedido.id_pedido,
        '🚛 El conductor está en camino',
        `Tu cisterna está en camino con ${pedido.cantidad_litros} litros. ¡Prepárate!`
      );
    }

    res.json({ ok: true, mensaje: 'Estado actualizado a "en camino"' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error actualizando estado' });
  }
};

// ─────────────────────────────────────────────────────────
//  PUT /api/conductor/pedidos/:id/entregado
//  Conductor confirma entrega
// ─────────────────────────────────────────────────────────
const marcarEntregado = async (req, res) => {
  try {
    const conductor = await Conductor.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    const pedido = await Pedido.findOne({
      where: { id_pedido: req.params.id, id_conductor: conductor.id_conductor, estado: 'en_camino' },
    });
    if (!pedido) return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado o no en camino' });

    await pedido.update({ estado: 'entregado', fecha_entregado: new Date() });
    await conductor.update({
      estado:         'disponible',
      total_entregas: conductor.total_entregas + 1,
    });

    const usuario_cliente = await _obtenerUsuarioDeCliente(pedido.id_cliente);
    if (usuario_cliente) {
      await notificarPedido(
        usuario_cliente.id_usuario,
        pedido.id_pedido,
        '✅ ¡Agua entregada!',
        `Tu pedido de ${pedido.cantidad_litros} litros fue entregado. ¿Puedes calificar al conductor?`
      );
    }

    res.json({ ok: true, mensaje: 'Entrega confirmada. ¡Buen trabajo!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error confirmando entrega' });
  }
};

// ─────────────────────────────────────────────────────────
//  POST /api/conductor/ubicacion
//  Conductor envía su GPS (llamado periódicamente desde la app)
// ─────────────────────────────────────────────────────────
const actualizarUbicacion = async (req, res) => {
  try {
    const { latitud, longitud, velocidad_kmh } = req.body;

    if (!latitud || !longitud) {
      return res.status(400).json({ ok: false, mensaje: 'latitud y longitud son requeridos' });
    }

    const conductor = await Conductor.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    if (!conductor) return res.status(404).json({ ok: false, mensaje: 'Conductor no encontrado' });

    await conductor.update({
      latitud_actual:   parseFloat(latitud),
      longitud_actual:  parseFloat(longitud),
      ultima_ubicacion: new Date(),
    });

    // Si tiene pedido activo, guardar en seguimiento_pedido
    const pedidoActivo = await Pedido.findOne({
      where: { id_conductor: conductor.id_conductor, estado: { [Op.in]: ['aceptado', 'en_camino'] } },
    });

    if (pedidoActivo) {
      await SeguimientoPedido.create({
        id_pedido:    pedidoActivo.id_pedido,
        id_conductor: conductor.id_conductor,
        latitud:      parseFloat(latitud),
        longitud:     parseFloat(longitud),
        velocidad_kmh: velocidad_kmh ? parseFloat(velocidad_kmh) : null,
      });
    }

    res.json({ ok: true, mensaje: 'Ubicación actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error actualizando ubicación' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/conductor/pedidos/historial
//  Historial de entregas del conductor
// ─────────────────────────────────────────────────────────
const historialConductor = async (req, res) => {
  try {
    const conductor = await Conductor.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    if (!conductor) return res.status(404).json({ ok: false, mensaje: 'Conductor no encontrado' });

    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;

    const { count, rows } = await Pedido.findAndCountAll({
      where: {
        id_conductor: conductor.id_conductor,
        estado: { [Op.in]: ['entregado', 'cancelado'] },
      },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'telefono'] }],
        },
      ],
      order: [['fecha_pedido', 'DESC']],
      limit: limite,
      offset: (pagina - 1) * limite,
    });

    res.json({
      ok: true,
      total:           count,
      total_entregas:  conductor.total_entregas,
      calificacion:    conductor.calificacion,
      pedidos: rows.map(p => ({
        id_pedido:       p.id_pedido,
        estado:          p.estado,
        cantidad_litros: p.cantidad_litros,
        precio_total:    p.precio_total,
        fecha_entregado: p.fecha_entregado,
        cliente_nombre:  `${p.cliente?.usuario?.nombre || ''} ${p.cliente?.usuario?.apellido || ''}`.trim(),
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo historial' });
  }
};

// ── Helper interno
const _obtenerUsuarioDeCliente = async (id_cliente) => {
  const { Cliente, Usuario } = require('../models');
  const cliente = await Cliente.findByPk(id_cliente);
  if (!cliente) return null;
  return Usuario.findByPk(cliente.id_usuario);
};

module.exports = {
  registro,           validarRegistro,
  perfil,
  cambiarEstado,
  pedidosDisponibles,
  aceptarPedido,
  marcarEnCamino,
  marcarEntregado,
  actualizarUbicacion,
  historialConductor,
};
