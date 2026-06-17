const router = require('express').Router();
const ctrl   = require('../controllers/SensorController');

// Sin autenticación JWT — el sensor se autentica con x-sensor-token en cada request
router.get('/ping',      ctrl.ping);
router.post('/lectura',  ctrl.recibirLectura);

module.exports = router;
