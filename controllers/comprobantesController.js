const pool = require('../config/db');
const { aplicarReglaPrecision } = require('../utils/helpers');

const getComprobantes = async (req, res) => {
  try {
    const { socio, fechaInicio, fechaFin, desdeHash, hash, rol, soloDuplicados } = req.query;

    let query = `
      SELECT 
        v.hash_largo, 
        v.monto, 
        v.moneda, 
        v.banco, 
        v.referencia, 
        v.titular, 
        v.procesado_ia,
        v.hash_corto, 
        v.url_imagen, 
        v.nombre_socio_1, 
        v.nombre_socio_2, 
        v.timestamp_comprobante AS timestamp, 
        v.conteo, 
        v.lote_tasa_asignado, 
        
        COALESCE(
          v.tasa_mercado_aplicada,
          CASE WHEN UPPER(v.moneda) IN ('USD', 'USDT', 'PYUSD') THEN 1.0 ELSE NULL END
        ) AS tasa_base,
        
        v.monto_usd_equivalente,

        t.tipo_op,

        CASE 
          WHEN UPPER(TRIM(COALESCE(n1.moneda_socio, 'USDT'))) = 'USD' THEN 'USDT'
          ELSE UPPER(TRIM(COALESCE(n1.moneda_socio, 'USDT')))
        END AS moneda_socio_1,
        n1.roles AS rol_socio_1,
        
        COALESCE(
          mt_s1.tasa_base,
          CASE WHEN UPPER(COALESCE(n1.moneda_socio, 'USDT')) IN ('USD', 'USDT', 'PYUSD') THEN 1.0 ELSE 1.0 END
        ) AS tasa_base_socio_1,
        COALESCE((n1.ajustes->>(t.tipo_op || '-' || v.moneda))::numeric, 1.0) AS factor_1,

        CASE 
          WHEN UPPER(TRIM(COALESCE(n2.moneda_socio, 'USDT'))) = 'USD' THEN 'USDT'
          ELSE UPPER(TRIM(COALESCE(n2.moneda_socio, 'USDT')))
        END AS moneda_socio_2,
        n2.roles AS rol_socio_2,

        COALESCE(
          mt_s2.tasa_base,
          CASE WHEN UPPER(COALESCE(n2.moneda_socio, 'USDT')) IN ('USD', 'USDT', 'PYUSD') THEN 1.0 ELSE 1.0 END
        ) AS tasa_base_socio_2,
        COALESCE((n2.ajustes->>(t.tipo_op || '-' || v.moneda))::numeric, 1.0) AS factor_2

      FROM v_comprobantes_auditados v
      LEFT JOIN nombres_fb n1 ON UPPER(TRIM(n1.nombre)) = UPPER(TRIM(v.nombre_socio_1))
      LEFT JOIN nombres_fb n2 ON UPPER(TRIM(n2.nombre)) = UPPER(TRIM(v.nombre_socio_2))

      LEFT JOIN mercado_tasas mt_s1
        ON mt_s1.id_tasa = v.lote_tasa_asignado
       AND mt_s1.moneda = CASE WHEN UPPER(COALESCE(n1.moneda_socio, 'USDT')) = 'USD' THEN 'USDT' ELSE UPPER(COALESCE(n1.moneda_socio, 'USDT')) END

      LEFT JOIN mercado_tasas mt_s2
        ON mt_s2.id_tasa = v.lote_tasa_asignado
       AND mt_s2.moneda = CASE WHEN UPPER(COALESCE(n2.moneda_socio, 'USDT')) = 'USD' THEN 'USDT' ELSE UPPER(COALESCE(n2.moneda_socio, 'USDT')) END

      LEFT JOIN LATERAL (
        SELECT COALESCE(
          CASE v.moneda
            WHEN 'PEN' THEN n1.pen
            WHEN 'COP' THEN n1.cop
            WHEN 'CLP' THEN n1.clp
            WHEN 'VES' THEN n1.ves
            WHEN 'ARS' THEN n1.ars
            WHEN 'USD' THEN n1.usd
            ELSE 'D'
          END,
          'D'
        ) AS tipo_op
      ) t ON TRUE

      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (soloDuplicados === 'true') {
      query += ` AND v.conteo > 1`;
    }

    if (rol && rol.trim()) {
      query += ` AND (UPPER(TRIM(n1.roles)) = UPPER(TRIM($${paramIndex})) OR UPPER(TRIM(n2.roles)) = UPPER(TRIM($${paramIndex})))`;
      values.push(rol.trim());
      paramIndex++;
    }

    if (socio && socio.trim()) {
      query += ` AND (UPPER(TRIM(v.nombre_socio_1)) = UPPER(TRIM($${paramIndex})) OR UPPER(TRIM(v.nombre_socio_2)) = UPPER(TRIM($${paramIndex})))`;
      values.push(socio.trim());
      paramIndex++;
    }

    if (hash && hash.trim()) {
      query += ` AND (v.hash_corto ILIKE $${paramIndex} OR v.hash_largo ILIKE $${paramIndex})`;
      values.push(`%${hash.trim()}%`);
      paramIndex++;
    }

    if (fechaInicio && fechaInicio.trim()) {
      const startTimestamp = Math.floor(new Date(fechaInicio.trim() + 'T00:00:00-04:00').getTime() / 1000);
      if (!isNaN(startTimestamp)) {
        query += ` AND v.timestamp_comprobante >= $${paramIndex}`;
        values.push(startTimestamp);
        paramIndex++;
      }
    }

    if (fechaFin && fechaFin.trim()) {
      const endTimestamp = Math.floor(new Date(fechaFin.trim() + 'T23:59:59-04:00').getTime() / 1000);
      if (!isNaN(endTimestamp)) {
        query += ` AND v.timestamp_comprobante <= $${paramIndex}`;
        values.push(endTimestamp);
        paramIndex++;
      }
    }

    if (desdeHash && desdeHash.trim()) {
      const hashRes = await pool.query(
        `SELECT timestamp_comprobante FROM v_comprobantes_auditados WHERE hash_corto = $1 OR hash_largo = $1 LIMIT 1;`,
        [desdeHash.trim()]
      );
      if (hashRes.rows.length > 0) {
        const hashTs = hashRes.rows[0].timestamp_comprobante;
        query += ` AND v.timestamp_comprobante >= $${paramIndex}`;
        values.push(hashTs);
        paramIndex++;
      }
    }

    query += ` ORDER BY v.timestamp_comprobante DESC;`;

    const { rows } = await pool.query(query, values);

    const rowsProcesadas = rows.map(row => {
      const monto = parseFloat(row.monto) || 0;
      const tasaBaseOrigen = parseFloat(row.tasa_base) || 1.0;

      let monedaSocio1 = (row.moneda_socio_1 || 'USDT').toUpperCase();
      if (monedaSocio1 === 'USD') monedaSocio1 = 'USDT';
      const tasaBaseSocio1 = parseFloat(row.tasa_base_socio_1) || 1.0;
      const factor1 = Math.abs(parseFloat(row.factor_1) || 1.0);

      const tasaCrossBase1 = tasaBaseSocio1 > 0 ? (tasaBaseOrigen / tasaBaseSocio1) : tasaBaseOrigen;
      const tasa1Raw = tasaCrossBase1 * factor1;
      const tasa1 = aplicarReglaPrecision(tasa1Raw);

      const m1Socio = tasa1 > 0 ? parseFloat((monto / tasa1).toFixed(2)) : 0;
      const m1Usdt = tasaBaseSocio1 > 0 ? parseFloat((m1Socio / tasaBaseSocio1).toFixed(2)) : m1Socio;

      let monedaSocio2 = (row.moneda_socio_2 || 'USDT').toUpperCase();
      if (monedaSocio2 === 'USD') monedaSocio2 = 'USDT';
      const tasaBaseSocio2 = parseFloat(row.tasa_base_socio_2) || 1.0;
      const factor2 = Math.abs(parseFloat(row.factor_2) || 1.0);

      const tasaCrossBase2 = tasaBaseSocio2 > 0 ? (tasaBaseOrigen / tasaBaseSocio2) : tasaBaseOrigen;
      const tasa2Raw = tasaCrossBase2 * factor2;
      const tasa2 = aplicarReglaPrecision(tasa2Raw);

      const m2Socio = tasa2 > 0 ? parseFloat((monto / tasa2).toFixed(2)) : 0;
      const m2Usdt = tasaBaseSocio2 > 0 ? parseFloat((m2Socio / tasaBaseSocio2).toFixed(2)) : m2Socio;

      return {
        ...row,
        tasa_1: tasa1,
        moneda_socio_1: monedaSocio1,
        m1_socio: m1Socio,
        m1_usdt: m1Usdt,

        tasa_2: tasa2,
        moneda_socio_2: monedaSocio2,
        m2_socio: m2Socio,
        m2_usdt: m2Usdt
      };
    });

    res.json(rowsProcesadas);
  } catch (err) {
    console.error('Error en GET /api/comprobantes:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const actualizarComprobante = async (req, res) => {
  try {
    const { hash_largo } = req.params;
    const { monto, moneda, banco, referencia, titular, nombre_socio_1, nombre_socio_2 } = req.body;

    const queryMaster = `
      UPDATE comprobantes_fb
      SET monto = $1, moneda = $2, banco = $3, referencia = $4, titular = $5, procesado_ia = TRUE
      WHERE hash_largo = $6 RETURNING *;
    `;

    const { rows } = await pool.query(queryMaster, [
      monto !== undefined && monto !== '' ? parseFloat(monto) : null,
      moneda || null,
      banco ? banco.toUpperCase() : null,
      referencia || null,
      titular ? titular.toUpperCase() : null,
      hash_largo
    ]);

    if (nombre_socio_1 !== undefined || nombre_socio_2 !== undefined) {
      await pool.query(
        `UPDATE cola_fb SET nombre_socio_1 = $1, nombre_socio_2 = $2 WHERE hash_largo = $3;`,
        [nombre_socio_1 || null, nombre_socio_2 || null, hash_largo]
      );
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const eliminarComprobante = async (req, res) => {
  try {
    const { hash_largo } = req.params;
    const { rows } = await pool.query(`DELETE FROM comprobantes_fb WHERE hash_largo = $1 RETURNING *;`, [hash_largo]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }

    await pool.query(`UPDATE cola_fb SET estado = 'DESCARTADO' WHERE hash_largo = $1;`, [hash_largo]);
    res.json({ success: true, message: 'Comprobante eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getComprobantes,
  actualizarComprobante,
  eliminarComprobante
};
