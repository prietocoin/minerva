const express = require('express');
const router = express.Router();
const {
  getDirectorio,
  eliminarSocioDirectorio
} = require('../controllers/sociosController');

router.get('/', getDirectorio);
router.delete('/:nombre', eliminarSocioDirectorio);

module.exports = router;
