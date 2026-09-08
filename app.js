const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

const tasasRoutes = require('./routes/tasasRoutes');
const sociosRoutes = require('./routes/sociosRoutes');
const directorioRoutes = require('./routes/directorioRoutes');
const comprobantesRoutes = require('./routes/comprobantesRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Servir recursos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/test-db', async (req, res) => {
  try {
    const testQuery = await pool.query("SELECT NOW() AT TIME ZONE 'America/Caracas' AS ahora_ve;");
    const countMaster = await pool.query(
      'SELECT COUNT(*) FROM comprobantes_fb f INNER JOIN cola_fb c ON f.hash_largo = c.hash_largo WHERE c.conteo > 1;'
    );
    res.json({
      status: 'OK',
      hora_servidor_ve: testQuery.rows[0].ahora_ve,
      registros_tabla_maestra: parseInt(countMaster.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', mensaje: err.message });
  }
});

// Enrutamiento modular
app.use('/api/tasas', tasasRoutes);
app.use('/api/socios', sociosRoutes);
app.use('/api/directorio', directorioRoutes);
app.use('/api/comprobantes', comprobantesRoutes);
app.use('/api/cola', comprobantesRoutes);
app.use('/api/reportes', comprobantesRoutes);

// Servir public/index.html para cualquier ruta del cliente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
