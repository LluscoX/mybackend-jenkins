const router    = require('express').Router();
const ctrl      = require('../controllers/TanqueController');
const { autenticar, soloCliente } = require('../middleware/auth');

// Todas protegidas y solo para clientes
router.use(autenticar, soloCliente);

router.get('/tanque',                  ctrl.obtenerMiTanque);
router.get('/tanque/consumo-semanal',  ctrl.consumoSemanal);
router.get('/tanque/historial-lecturas', ctrl.historialLecturas);

module.exports = router;
