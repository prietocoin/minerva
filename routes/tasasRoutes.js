const express = require('express');
const router = express.Router();
const {
  getUltimasTasas,
  n8nWebhook,
  fetchHoo,
  publicarTasas,
  reenviarTasas
} = require('../controllers/tasasController');

router.get('/ultimas', getUltimasTasas);
router.post('/n8n-webhook', n8nWebhook);
router.get('/fetch-hoo', fetchHoo);
router.post('/publicar', publicarTasas);
router.post('/reenviar', reenviarTasas);

module.exports = router;
