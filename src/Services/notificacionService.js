const { Notificacion } = require('../models');

/**
 * Crea una notificación relacionada a un pedido.
 * @param {number}  id_usuario  - Destinatario
 * @param {number}  id_pedido
 * @param {string}  titulo
 * @param {string}  mensaje
 */
const notificarPedido = async (id_usuario, id_pedido, titulo, mensaje) => {
  try {
    await Notificacion.create({
      id_usuario,
      id_pedido,
      titulo,
      mensaje,
      tipo: 'pedido',
    });
  } catch (error) {
    console.error('Error creando notificación de pedido:', error.message);
  }
};

/**
 * Crea una notificación del sistema.
 */
const notificarSistema = async (id_usuario, titulo, mensaje) => {
  try {
    await Notificacion.create({
      id_usuario,
      titulo,
      mensaje,
      tipo: 'sistema',
    });
  } catch (error) {
    console.error('Error creando notificación sistema:', error.message);
  }
};

module.exports = { notificarPedido, notificarSistema };