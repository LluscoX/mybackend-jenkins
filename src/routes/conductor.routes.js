const router = require('express').Router();
const ctrl   = require('../controllers/ConductorController');
const { autenticar, soloConductor } = require('../middleware/auth');

// Pública
router.post('/registro', ctrl.validarRegistro, ctrl.registro);

// Protegidas — solo conductores
router.use(autenticar, soloConductor);

router.get('/perfil',                       ctrl.perfil);
router.put('/estado',                       ctrl.cambiarEstado);
router.post('/ubicacion',                   ctrl.actualizarUbicacion);
router.get('/pedidos/disponibles',          ctrl.pedidosDisponibles);
router.get('/pedidos/historial',            ctrl.historialConductor);
router.put('/pedidos/:id/aceptar',          ctrl.aceptarPedido);
router.put('/pedidos/:id/en-camino',        ctrl.marcarEnCamino);
router.put('/pedidos/:id/entregado',        ctrl.marcarEntregado);

module.exports = router;
