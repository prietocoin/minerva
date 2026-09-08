const pool = require('../config/db');

let borradorTasas = {};

const getUltimasTasas = async (req, res) => {
  try {
    const lastLotRes = await pool.query(`
      SELECT id_tasa FROM mercado_tasas ORDER BY timestamp DESC, id DESC LIMIT 1;
    `);

    if (lastLotRes.rows.length === 0) {
      return res.json({ id_tasa: 'T360', tasas: { USD: 1.0, USDT: 1.0, PYUSD: 1.2, ECU: 1.0, PAN: 1.0 } });
    }

    const lastIdTasa = lastLotRes.rows[0].id_tasa;
    const ratesRes = await pool.query(
      `SELECT moneda, tasa_base FROM mercado_tasas WHERE id_tasa = $1;`,
      [lastIdTasa]
    );

    const tasasObj = { USD: 1.0, USDT: 1.0, PYUSD: 1.2, ECU: 1.0, PAN: 1.0 };
    ratesRes.rows.forEach(r => {
      tasasObj[r.moneda.toUpperCase()] = parseFloat(r.tasa_base);
    });

    res.json({ id_tasa: lastIdTasa, tasas: tasasObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const n8nWebhook = (req, res) => {
  try {
    let payload = req.body;
    if (Array.isArray(payload)) payload = payload[0] || {};
    if (payload.json) payload = payload.json;

    borradorTasas = payload;
    return res.json({ success: true, message: 'Borrador cargado en memoria', rates: borradorTasas });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const fetchHoo = (req, res) => {
  if (!borradorTasas || Object.keys(borradorTasas).length === 0) {
    return res.status(404).json({ success: false, msg: 'El motor de n8n aún no ha enviado un borrador reciente.' });
  }
  return res.json({ success: true, rates: borradorTasas });
};

const publicarTasas = async (req, res) => {
  try {
    const { id_tasa, tasas } = req.body;
    const timestamp = Math.floor(Date.now() / 1000);

    if (!tasas || Object.keys(tasas).length === 0) {
      return res.status(400).json({ success: false, message: 'No se enviaron tasas para publicar.' });
    }

    let codigoTasa = id_tasa;
    if (!codigoTasa) {
      const lastRes = await pool.query("SELECT id_tasa FROM mercado_tasas ORDER BY id DESC LIMIT 1;");
      if (lastRes.rows.length > 0) {
        const lastLot = lastRes.rows[0].id_tasa;
        const match = lastLot.match(/\d+/);
        const num = match ? parseInt(match[0], 10) + 1 : 1;
        codigoTasa = `T${String(num).padStart(3, '0')}`;
      } else {
        codigoTasa = 'T360';
      }
    }

    for (const [moneda, valor] of Object.entries(tasas)) {
      if (valor && !isNaN(valor)) {
        await pool.query(
          `INSERT INTO mercado_tasas (id_tasa, moneda, tasa_base, timestamp) VALUES ($1, $2, $3, $4);`,
          [codigoTasa, moneda.toUpperCase(), parseFloat(valor), timestamp]
        );
      }
    }

    await pool.query(
      `INSERT INTO notificaciones_tasas (id_tasa) VALUES ($1);`,
      [codigoTasa]
    );

    res.json({ success: true, id_tasa: codigoTasa, message: `Tasa ${codigoTasa} publicada correctamente` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const reenviarTasas = async (req, res) => {
  try {
    const { id_tasa } = req.body;
    let codigoTasa = id_tasa;

    if (!codigoTasa) {
      const lastRes = await pool.query("SELECT id_tasa FROM mercado_tasas ORDER BY id DESC LIMIT 1;");
      if (lastRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'No hay tasas registradas para reenviar.' });
      }
      codigoTasa = lastRes.rows[0].id_tasa;
    }

    await pool.query(`INSERT INTO notificaciones_tasas (id_tasa) VALUES ($1);`, [codigoTasa]);

    res.json({ success: true, id_tasa: codigoTasa, message: `Reenvío activado para la tasa ${codigoTasa}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getUltimasTasas,
  n8nWebhook,
  fetchHoo,
  publicarTasas,
  reenviarTasas
};
