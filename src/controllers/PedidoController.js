// =====================================================
//  controllers/PedidoController.js
//  Ciclo completo de pedidos:
//    Cliente → crea pedido
//    Conductor → acepta, marca en camino, entrega
//    Cliente → califica
// =====================================================

const { body }  = require('express-validator');
const { Op }    = require('sequelize');
const {
  Pedido, Cliente, Conductor, Usuario, Otb, Calificacion, SeguimientoPedido,
} = require('../models');
const { validar }         = require('../middleware/errores');
const { notificarPedido } = require('../services/notificacionService');

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────
const incluirConductor = [
  {
    model: Conductor,
    as: 'conductor',
    include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'telefono'] }],
  },
];

const incluirCliente = [
  {
    model: Cliente,
    as: 'cliente',
    include: [
      { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'telefono'] },
      { model: Otb,     as: 'otb',     attributes: ['nombre'] },
    ],
  },
];

// ─────────────────────────────────────────────────────────
//  POST /api/pedidos
//  Cliente crea un nuevo pedido
// ─────────────────────────────────────────────────────────
const validarCrear = [
  body('cantidad_litros').isInt({ min: 100 }).withMessage('Mínimo 100 litros'),
  validar,
];

const crearPedido = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({
      where: { id_usuario: req.usuario.id_usuario },
      include: [{ model: Otb, as: 'otb' }],
    });
    if (!cliente) return res.status(404).json({ ok: false, mensaje: 'Perfil de cliente no encontrado' });

    const { cantidad_litros, direccion_entrega, latitud_entrega, longitud_entrega } = req.body;

    // Usar la dirección del cliente si no se envía una específica
    const pedido = await Pedido.create({
      id_cliente:        cliente.id_cliente,
      cantidad_litros,
      direccion_entrega: direccion_entrega || cliente.direccion,
      latitud_entrega:   latitud_entrega   || cliente.latitud,
      longitud_entrega:  longitud_entrega  || cliente.longitud,
      estado:            'pendiente',
    });

    res.status(201).json({
      ok: true,
      mensaje: 'Pedido creado. Buscando conductor disponible en tu zona...',
      pedido: {
        id_pedido:      pedido.id_pedido,
        estado:         pedido.estado,
        cantidad_litros: pedido.cantidad_litros,
        fecha_pedido:   pedido.fecha_pedido,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al crear pedido' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/pedidos/activo
//  Cliente obtiene su pedido activo (pendiente / en curso)
// ─────────────────────────────────────────────────────────
const miPedidoActivo = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    if (!cliente) return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado' });

    const pedido = await Pedido.findOne({
      where: {
        id_cliente: cliente.id_cliente,
        estado: { [Op.in]: ['pendiente', 'aceptado', 'en_camino'] },
      },
      include: incluirConductor,
      order: [['fecha_pedido', 'DESC']],
    });

    if (!pedido) return res.json({ ok: true, pedido: null });

    res.json({ ok: true, pedido: _formatearPedido(pedido) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo pedido activo' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/pedidos/historial?pagina=1&limite=10
//  Cliente consulta su historial de pedidos finalizados
// ─────────────────────────────────────────────────────────
const historialPedidos = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    if (!cliente) return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado' });

    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const offset = (pagina - 1) * limite;

    const { count, rows } = await Pedido.findAndCountAll({
      where: {
        id_cliente: cliente.id_cliente,
        estado: { [Op.in]: ['entregado', 'cancelado'] },
      },
      include: incluirConductor,
      order: [['fecha_pedido', 'DESC']],
      limit: limite,
      offset,
    });

    res.json({
      ok: true,
      total: count,
      pagina,
      paginas_totales: Math.ceil(count / limite),
      pedidos: rows.map(_formatearPedido),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo historial' });
  }
};

// ─────────────────────────────────────────────────────────
//  DELETE /api/pedidos/:id/cancelar
//  Cliente cancela su pedido (solo si está pendiente)
// ─────────────────────────────────────────────────────────
const cancelarPedido = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    const pedido  = await Pedido.findOne({
      where: { id_pedido: req.params.id, id_cliente: cliente.id_cliente },
    });

    if (!pedido) return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({
        ok: false,
        mensaje: `No se puede cancelar un pedido en estado "${pedido.estado}"`,
      });
    }

    await pedido.update({
      estado:           'cancelado',
      fecha_cancelado:  new Date(),
      motivo_cancelacion: req.body.motivo || 'Cancelado por el cliente',
    });

    res.json({ ok: true, mensaje: 'Pedido cancelado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error cancelando pedido' });
  }
};

// ─────────────────────────────────────────────────────────
//  POST /api/pedidos/:id/calificar
//  Cliente califica al conductor después de entrega
// ─────────────────────────────────────────────────────────
const validarCalificar = [
  body('estrellas').isInt({ min: 1, max: 5 }).withMessage('Estrellas deben ser entre 1 y 5'),
  validar,
];

const calificarPedido = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    const pedido  = await Pedido.findOne({
      where: { id_pedido: req.params.id, id_cliente: cliente.id_cliente, estado: 'entregado' },
    });

    if (!pedido) return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado o no entregado' });
    if (!pedido.id_conductor) return res.status(400).json({ ok: false, mensaje: 'El pedido no tiene conductor asignado' });

    // Una sola calificación por pedido
    const yaCalificado = await Calificacion.findOne({ where: { id_pedido: pedido.id_pedido } });
    if (yaCalificado) return res.status(400).json({ ok: false, mensaje: 'Ya calificaste este pedido' });

    const { estrellas, comentario } = req.body;

    await Calificacion.create({
      id_pedido:    pedido.id_pedido,
      id_cliente:   cliente.id_cliente,
      id_conductor: pedido.id_conductor,
      estrellas,
      comentario,
    });

    // Actualizar promedio de calificación del conductor
    const { fn, col } = require('sequelize');
    const [resultado] = await Calificacion.findAll({
      where: { id_conductor: pedido.id_conductor },
      attributes: [[fn('AVG', col('estrellas')), 'promedio']],
      raw: true,
    });
    const promedio = parseFloat(resultado.promedio || 5).toFixed(2);
    await Conductor.update(
      { calificacion: promedio },
      { where: { id_conductor: pedido.id_conductor } }
    );

    res.json({ ok: true, mensaje: 'Calificación enviada. ¡Gracias!', promedio_conductor: promedio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al calificar' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/pedidos/:id/seguimiento
//  Últimas posiciones GPS del conductor para el cliente
// ─────────────────────────────────────────────────────────
const seguimientoPedido = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({ where: { id_usuario: req.usuario.id_usuario } });
    const pedido  = await Pedido.findOne({
      where: { id_pedido: req.params.id, id_cliente: cliente.id_cliente },
      include: incluirConductor,
    });

    if (!pedido) return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });

    const posiciones = await SeguimientoPedido.findAll({
      where: { id_pedido: pedido.id_pedido },
      order: [['fecha', 'DESC']],
      limit: 20, // últimas 20 posiciones
    });

    res.json({
      ok: true,
      estado: pedido.estado,
      conductor: pedido.conductor ? {
        nombre:    pedido.conductor.usuario?.nombre,
        apellido:  pedido.conductor.usuario?.apellido,
        telefono:  pedido.conductor.usuario?.telefono,
        placa:     pedido.conductor.placa,
        lat_actual: pedido.conductor.latitud_actual,
        lng_actual: pedido.conductor.longitud_actual,
      } : null,
      posiciones,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo seguimiento' });
  }
};

// ─────────────────────────────────────────────────────────
//  Formatear pedido para respuesta
// ─────────────────────────────────────────────────────────
const _formatearPedido = (pedido) => ({
  id_pedido:         pedido.id_pedido,
  estado:            pedido.estado,
  cantidad_litros:   pedido.cantidad_litros,
  precio_total:      pedido.precio_total,
  direccion_entrega: pedido.direccion_entrega,
  latitud_entrega:   pedido.latitud_entrega,
  longitud_entrega:  pedido.longitud_entrega,
  fecha_pedido:      pedido.fecha_pedido,
  fecha_aceptado:    pedido.fecha_aceptado,
  fecha_en_camino:   pedido.fecha_en_camino,
  fecha_entregado:   pedido.fecha_entregado,
  motivo_cancelacion: pedido.motivo_cancelacion,
  calificacion:      pedido.calificacion,
  conductor: pedido.conductor ? {
    nombre:          pedido.conductor.usuario?.nombre,
    apellido:        pedido.conductor.usuario?.apellido,
    telefono:        pedido.conductor.usuario?.telefono,
    placa:           pedido.conductor.placa,
    precio_por_litro: pedido.conductor.precio_por_litro,
    calificacion:    pedido.conductor.calificacion,
    lat_actual:      pedido.conductor.latitud_actual,
    lng_actual:      pedido.conductor.longitud_actual,
  } : null,
});

module.exports = {
  crearPedido,     validarCrear,
  miPedidoActivo,
  historialPedidos,
  cancelarPedido,
  calificarPedido, validarCalificar,
  seguimientoPedido,
};
