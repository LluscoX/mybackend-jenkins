const router = require('express').Router();
const { registro, validarRegistro, login, validarLogin, perfil, listarOtbs } = require('../controllers/authController');
const { autenticar } = require('../middleware/auth');

// Públicas
router.post('/registro', validarRegistro, registro);
router.post('/login',    validarLogin,    login);
router.get('/otbs',      listarOtbs);

// Protegida
router.get('/perfil', autenticar, perfil);

module.exports = router;
