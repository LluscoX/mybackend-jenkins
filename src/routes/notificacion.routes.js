const router = require('express').Router();
const ctrl   = require('../controllers/NotificacionController');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

router.get('/',               ctrl.misNotificaciones);
router.put('/leer-todas',     ctrl.marcarTodasLeidas);
router.put('/:id/leer',       ctrl.marcarLeida);

module.exports = router;
