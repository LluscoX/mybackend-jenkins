const { Tanque, LecturaSensor, Prediccion, Cliente } = require('../models');
const { obtenerUltimaPrediccion } = require('../services/prediccionService');
const { Op, fn, col, literal } = require('sequelize');

// ─────────────────────────────────────────────────────────
//  GET /api/cliente/tanque
//  Retorna el tanque del cliente autenticado con su
//  nivel actual y la última predicción IA.
//  Este endpoint alimenta directamente TanqueProvider en Flutter.
// ─────────────────────────────────────────────────────────
const obtenerMiTanque = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({
      where: { id_usuario: req.usuario.id_usuario },
    });
    if (!cliente) {
      return res.status(404).json({ ok: false, mensaje: 'Perfil de cliente no encontrado' });
    }

    const tanque = await Tanque.findOne({
      where: { id_cliente: cliente.id_cliente, activo: 1 },
    });
    if (!tanque) {
      return res.status(404).json({ ok: false, mensaje: 'No tienes un tanque registrado' });
    }

    const prediccion = await obtenerUltimaPrediccion(tanque.id_tanque);

    res.json({
      ok: true,
      tanque: {
        id_tanque: tanque.id_tanque,
        id_cliente: tanque.id_cliente,   // ← agregar esta línea

        nombre: tanque.nombre,
        capacidad_litros: tanque.capacidad_litros,
        nivel_actual: tanque.nivel_actual,
        porcentaje_actual: tanque.porcentaje_actual,
        ultima_lectura: tanque.ultima_lectura,
        ubicacion: tanque.ubicacion,
      },
      prediccion: prediccion ? {
        dias_restantes: prediccion.dias_restantes,
        fecha_estimacion_vacio: prediccion.fecha_estimacion_vacio,
        nivel_estimado_manana: prediccion.nivel_estimado_manana,
        consumo_diario_promedio: prediccion.consumo_diario_promedio,
        mensaje_alerta: prediccion.mensaje_alerta,
        nivel_alerta: prediccion.nivel_alerta,
      } : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo datos del tanque' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/cliente/tanque/consumo-semanal
//  Retorna los litros de los últimos 7 días agrupados por día.
//  Alimenta el gráfico ConsumptionChart en Flutter.
// ─────────────────────────────────────────────────────────
const consumoSemanal = async (req, res) => {
  try {
    const cliente = await Cliente.findOne({
      where: { id_usuario: req.usuario.id_usuario },
    });
    const tanque = await Tanque.findOne({
      where: { id_cliente: cliente.id_cliente, activo: 1 },
    });
    if (!tanque) {
      return res.status(404).json({ ok: false, mensaje: 'Tanque no encontrado' });
    }

    const hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 6);
    hace7dias.setHours(0, 0, 0, 0);

    // Tomamos la lectura más baja y más alta de cada día
    // La diferencia = litros consumidos ese día
    const lecturas = await LecturaSensor.findAll({
      where: {
        id_tanque: tanque.id_tanque,
        fecha_registro: { [Op.gte]: hace7dias },
      },
      order: [['fecha_registro', 'ASC']],
      attributes: ['nivel_litros', 'fecha_registro'],
    });

    // Agrupar por día y calcular consumo
    const porDia = {};
    lecturas.forEach(l => {
      const dia = new Date(l.fecha_registro).toISOString().split('T')[0];
      if (!porDia[dia]) porDia[dia] = { max: l.nivel_litros, min: l.nivel_litros };
      else {
        if (l.nivel_litros > porDia[dia].max) porDia[dia].max = l.nivel_litros;
        if (l.nivel_litros < porDia[dia].min) porDia[dia].min = l.nivel_litros;
      }
    });

    // Construir los últimos 7 días (incluyendo días sin datos = 0)
    const resultado = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const key = fecha.toISOString().split('T')[0];
      const consumo = porDia[key]
        ? Math.max(0, porDia[key].max - porDia[key].min)
        : 0;
      resultado.push({
        fecha: key,
        litros: consumo,
      });
    }

    res.json({ ok: true, consumo_semanal: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo consumo semanal' });
  }
};

// ─────────────────────────────────────────────────────────
//  GET /api/cliente/tanque/historial-lecturas?dias=30
//  Lecturas crudas del sensor para gráficos detallados.
// ─────────────────────────────────────────────────────────
const historialLecturas = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;
    const limit = parseInt(req.query.limit) || 100;

    const cliente = await Cliente.findOne({
      where: { id_usuario: req.usuario.id_usuario },
    });
    const tanque = await Tanque.findOne({
      where: { id_cliente: cliente.id_cliente, activo: 1 },
    });
    if (!tanque) {
      return res.status(404).json({ ok: false, mensaje: 'Tanque no encontrado' });
    }

    const desde = new Date();
    desde.setDate(desde.getDate() - dias);

    const lecturas = await LecturaSensor.findAll({
      where: {
        id_tanque: tanque.id_tanque,
        fecha_registro: { [Op.gte]: desde },
      },
      order: [['fecha_registro', 'DESC']],
      limit,
      attributes: ['id_lectura', 'nivel_litros', 'porcentaje', 'fecha_registro'],
    });

    res.json({ ok: true, lecturas });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo historial' });
  }
};

module.exports = { obtenerMiTanque, consumoSemanal, historialLecturas };