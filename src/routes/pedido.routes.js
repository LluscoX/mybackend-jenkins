const router = require('express').Router();
const ctrl   = require('../controllers/PedidoController');
const { autenticar, soloCliente } = require('../middleware/auth');

// Todas protegidas y solo para clientes
router.use(autenticar, soloCliente);

router.post('/',                          ctrl.validarCrear,      ctrl.crearPedido);
router.get('/activo',                     ctrl.miPedidoActivo);
router.get('/historial',                  ctrl.historialPedidos);
router.delete('/:id/cancelar',            ctrl.cancelarPedido);
router.post('/:id/calificar',             ctrl.validarCalificar,  ctrl.calificarPedido);
router.get('/:id/seguimiento',            ctrl.seguimientoPedido);

module.exports = router;
