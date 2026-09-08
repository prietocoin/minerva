const express = require('express');
const router = express.Router();
const {
  getComprobantes,
  actualizarComprobante,
  eliminarComprobante
} = require('../controllers/comprobantesController');

router.get('/', getComprobantes);
router.put('/:hash_largo', actualizarComprobante);
router.delete('/:hash_largo', eliminarComprobante);

module.exports = router;
