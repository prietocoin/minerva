const express = require('express');
const router = express.Router();
const {
  desactivarTodosSocios,
  guardarVigentes,
  restaurarVigentes,
  cambiarEstadoSocio,
  getSociosNombres,
  guardarSocioConfig
} = require('../controllers/sociosController');

router.patch('/desactivar-todos', desactivarTodosSocios);
router.post('/guardar-vigentes', guardarVigentes);
router.post('/restaurar-vigentes', restaurarVigentes);
router.patch('/:nombre/estado', cambiarEstadoSocio);
router.get('/', getSociosNombres);
router.post('/config', guardarSocioConfig);

module.exports = router;
