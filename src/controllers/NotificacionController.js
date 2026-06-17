// =====================================================
//  controllers/NotificacionController.js
// =====================================================

const { Notificacion } = require('../models');
const { Op }           = require('sequelize');

// GET /api/notificaciones
const misNotificaciones = async (req, res) => {
  try {
    const solo_no_leidas = req.query.no_leidas === 'true';
    const where = { id_usuario: req.usuario.id_usuario };
    if (solo_no_leidas) where.leido = 0;

    const notificaciones = await Notificacion.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const no_leidas = await Notificacion.count({
      where: { id_usuario: req.usuario.id_usuario, leido: 0 },
    });

    res.json({ ok: true, no_leidas, notificaciones });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo notificaciones' });
  }
};

// PUT /api/notificaciones/:id/leer
const marcarLeida = async (req, res) => {
  try {
    const notif = await Notificacion.findOne({
      where: { id_notificacion: req.params.id, id_usuario: req.usuario.id_usuario },
    });
    if (!notif) return res.status(404).json({ ok: false, mensaje: 'Notificación no encontrada' });

    await notif.update({ leido: 1 });
    res.json({ ok: true, mensaje: 'Marcada como leída' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error actualizando notificación' });
  }
};

// PUT /api/notificaciones/leer-todas
const marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.update(
      { leido: 1 },
      { where: { id_usuario: req.usuario.id_usuario, leido: 0 } }
    );
    res.json({ ok: true, mensaje: 'Todas marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error actualizando notificaciones' });
  }
};

module.exports = { misNotificaciones, marcarLeida, marcarTodasLeidas };
