const pool = require('../config/db');
const { FACTORES_BASE_MERCADO } = require('../constants/market');
const { calcularTallaAutomatica } = require('../utils/helpers');

const desactivarTodosSocios = async (req, res) => {
  try {
    await pool.query(`UPDATE nombres_fb SET activo = FALSE WHERE UPPER(TRIM(nombre)) != 'GENERAL';`);
    res.json({ success: true, message: 'Todos los socios desactivados correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const guardarVigentes = async (req, res) => {
  try {
    await pool.query(`UPDATE nombres_fb SET recordar_activo = activo;`);
    res.json({ success: true, message: 'Plantilla de socios activos memorizada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const restaurarVigentes = async (req, res) => {
  try {
    await pool.query(`UPDATE nombres_fb SET activo = COALESCE(recordar_activo, FALSE);`);
    res.json({ success: true, message: 'Socios vigentes restaurados correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const cambiarEstadoSocio = async (req, res) => {
  try {
    const { nombre } = req.params;
    const { activo } = req.body;

    const { rows } = await pool.query(
      `UPDATE nombres_fb SET activo = $1 WHERE UPPER(TRIM(nombre)) = UPPER(TRIM($2)) RETURNING nombre, activo;`,
      [activo, nombre]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSociosNombres = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT nombre FROM (
        SELECT nombre_socio_1 AS nombre FROM cola_fb WHERE nombre_socio_1 IS NOT NULL AND nombre_socio_1 != ''
        UNION
        SELECT nombre_socio_2 AS nombre FROM cola_fb WHERE nombre_socio_2 IS NOT NULL AND nombre_socio_2 != ''
        UNION
        SELECT nombre FROM nombres_fb WHERE roles IN ('SOCIO', 'MATRIZ_GENERAL', 'ASESOR', 'GRUPO', 'COMPRAS')
      ) s ORDER BY nombre ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDirectorio = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM nombres_fb ORDER BY nombre ASC;');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const eliminarSocioDirectorio = async (req, res) => {
  try {
    const { nombre } = req.params;
    if (!nombre) return res.status(400).json({ error: 'Nombre de socio requerido.' });

    const { rows } = await pool.query(
      `DELETE FROM nombres_fb WHERE UPPER(TRIM(nombre)) = UPPER(TRIM($1)) RETURNING *;`,
      [nombre]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Socio no encontrado.' });
    res.json({ success: true, message: `Socio ${nombre} eliminado correctamente.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const guardarSocioConfig = async (req, res) => {
  try {
    const { 
      nombre, roles, moneda_socio, whatsapp, activo,
      pen, cop, clp, ars, ves, brl, mxn, pyg, dop, crc, eur, cad, usd, ecu, pan, usdt,
      cartelera_paises, ajustes 
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del socio es obligatorio.' });
    }

    const socioNombre = nombre.trim();
    const cpArray = (cartelera_paises && cartelera_paises.length > 0) 
      ? cartelera_paises 
      : [
          { pais: 'Peru', moneda: 'PEN', activo: true, orden: 1 },
          { pais: 'Chile', moneda: 'CLP', activo: true, orden: 2 },
          { pais: 'Colombia', moneda: 'COP', activo: true, orden: 3 },
          { pais: 'Argentina', moneda: 'ARS', activo: true, orden: 4 }
        ];

    const conteoActivos = cpArray.filter(p => p.activo).length;
    const tallaCalculada = calcularTallaAutomatica(conteoActivos);

    const factoresFinales = { ...FACTORES_BASE_MERCADO, ...(ajustes || {}) };

    const jsonCartelera = JSON.stringify(cpArray);
    const jsonAjustes = JSON.stringify(factoresFinales);

    const checkQuery = `SELECT id_grupo, whatsapp FROM nombres_fb WHERE UPPER(TRIM(nombre)) = UPPER(TRIM($1));`;
    const checkRes = await pool.query(checkQuery, [socioNombre]);

    let rows;

    if (checkRes.rows.length > 0) {
      const updateQuery = `
        UPDATE nombres_fb SET
          roles = $1,
          moneda_socio = $2,
          talla = $3,
          whatsapp = $4,
          activo = $5,
          pen = $6, cop = $7, clp = $8, ars = $9, ves = $10, brl = $11, mxn = $12, pyg = $13,
          dop = $14, crc = $15, eur = $16, cad = $17, usd = $18, ecu = $19, pan = $20, usdt = $21,
          cartelera_paises = $22::jsonb,
          ajustes = $23::jsonb
        WHERE UPPER(TRIM(nombre)) = UPPER(TRIM($24))
        RETURNING *;
      `;
      const updateRes = await pool.query(updateQuery, [
        roles || 'SOCIO', moneda_socio || 'USDT', tallaCalculada, 
        whatsapp || checkRes.rows[0].whatsapp || '',
        activo ?? true,
        pen || 'A', cop || 'A', clp || 'A', ars || 'A', ves || 'A', brl || 'A', mxn || 'A', pyg || 'A',
        dop || 'A', crc || 'A', eur || 'A', cad || 'A', usd || 'A', ecu || 'A', pan || 'A', usdt || 'A',
        jsonCartelera, jsonAjustes, socioNombre
      ]);
      rows = updateRes.rows;
    } else {
      const idGrupo = whatsapp && whatsapp.trim() ? whatsapp.trim() : ('GRP_' + socioNombre.toUpperCase().replace(/\s+/g, '_'));
      const insertQuery = `
        INSERT INTO nombres_fb (
          id_grupo, nombre, roles, moneda_socio, talla, whatsapp, activo,
          pen, cop, clp, ars, ves, brl, mxn, pyg, dop, crc, eur, cad, usd, ecu, pan, usdt,
          cartelera_paises, ajustes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24::jsonb, $25::jsonb)
        RETURNING *;
      `;
      const insertRes = await pool.query(insertQuery, [
        idGrupo, socioNombre, roles || 'SOCIO', moneda_socio || 'USDT', tallaCalculada, whatsapp || '',
        activo ?? true,
        pen || 'A', cop || 'A', clp || 'A', ars || 'A', ves || 'A', brl || 'A', mxn || 'A', pyg || 'A',
        dop || 'A', crc || 'A', eur || 'A', cad || 'A', usd || 'A', ecu || 'A', pan || 'A', usdt || 'A',
        jsonCartelera, jsonAjustes
      ]);
      rows = insertRes.rows;
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Error guardando socio:", err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  desactivarTodosSocios,
  guardarVigentes,
  restaurarVigentes,
  cambiarEstadoSocio,
  getSociosNombres,
  getDirectorio,
  eliminarSocioDirectorio,
  guardarSocioConfig
};
