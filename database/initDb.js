const pool = require('../config/db');
const { SEED_SOCIOS_CONFIG } = require('../constants/market');

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mercado_tasas (
        id SERIAL PRIMARY KEY,
        id_tasa VARCHAR(20) NOT NULL,
        moneda VARCHAR(10) NOT NULL,
        tasa_base NUMERIC(18, 6) NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notificaciones_tasas (
        id SERIAL PRIMARY KEY,
        id_tasa VARCHAR(50) NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_mercado_tasas_id_tasa ON mercado_tasas(id_tasa);
      CREATE INDEX IF NOT EXISTS idx_mercado_tasas_moneda_ts ON mercado_tasas(moneda, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_mercado_tasas_ts ON mercado_tasas (timestamp ASC);
      CREATE INDEX IF NOT EXISTS idx_cola_fb_ts ON cola_fb (timestamp DESC);
    `);

    await pool.query(`
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS usd VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS pen VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS cop VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS clp VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS ves VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS ars VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS mxn VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS brl VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS pyg VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS dop VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS crc VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS eur VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS cad VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS ecu VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS pan VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS usdt VARCHAR(10);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS talla VARCHAR(10) DEFAULT 'M';
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS recordar_activo BOOLEAN DEFAULT FALSE;
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS cartelera_paises JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE nombres_fb ADD COLUMN IF NOT EXISTS ajustes JSONB DEFAULT '{}'::jsonb;
    `);

    for (const [socioKey, config] of Object.entries(SEED_SOCIOS_CONFIG)) {
      const check = await pool.query(
        `SELECT id_grupo FROM nombres_fb WHERE UPPER(TRIM(nombre)) = UPPER(TRIM($1));`,
        [config.nombre]
      );

      const jsonCartelera = JSON.stringify(config.cartelera_paises || []);
      const jsonAjustes = JSON.stringify(config.ajustes || {});

      if (check.rows.length > 0) {
        await pool.query(
          `UPDATE nombres_fb SET 
            roles = COALESCE($1, roles),
            moneda_socio = COALESCE($2, moneda_socio),
            talla = COALESCE($3, talla),
            whatsapp = COALESCE($4, whatsapp),
            activo = COALESCE($5, activo),
            pen = COALESCE($6, pen),
            cop = COALESCE($7, cop),
            clp = COALESCE($8, clp),
            ars = COALESCE($9, ars),
            ves = COALESCE($10, ves),
            brl = COALESCE($11, brl),
            mxn = COALESCE($12, mxn),
            pyg = COALESCE($13, pyg),
            usd = COALESCE($14, usd),
            ecu = COALESCE($15, ecu),
            eur = COALESCE($16, eur),
            usdt = COALESCE($17, usdt),
            cartelera_paises = CASE WHEN cartelera_paises = '[]'::jsonb OR cartelera_paises IS NULL THEN $18::jsonb ELSE cartelera_paises END,
            ajustes = CASE WHEN ajustes = '{}'::jsonb OR ajustes IS NULL THEN $19::jsonb ELSE ajustes END
           WHERE UPPER(TRIM(nombre)) = UPPER(TRIM($20));`,
          [
            config.roles, config.moneda_socio, config.talla, config.whatsapp,
            config.activo ?? true,
            config.pen, config.cop, config.clp, config.ars, config.ves,
            config.brl, config.mxn, config.pyg, config.usd, config.ecu,
            config.eur, config.usdt,
            jsonCartelera, jsonAjustes, config.nombre
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO nombres_fb (
            id_grupo, nombre, roles, moneda_socio, talla, whatsapp, activo,
            pen, cop, clp, ars, ves, brl, mxn, pyg, usd, ecu, eur, usdt,
            cartelera_paises, ajustes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::jsonb, $21::jsonb)
          ON CONFLICT DO NOTHING;`,
          [
            config.id_grupo, config.nombre, config.roles, config.moneda_socio, config.talla, config.whatsapp,
            config.activo ?? true,
            config.pen, config.cop, config.clp, config.ars, config.ves,
            config.brl, config.mxn, config.pyg, config.usd, config.ecu, config.eur, config.usdt,
            jsonCartelera, jsonAjustes
          ]
        );
      }
    }
    console.log('✅ Base de datos sembrada.');

    await pool.query(`
      DROP VIEW IF EXISTS v_comprobantes_auditados CASCADE;
      CREATE VIEW v_comprobantes_auditados AS
      WITH primer_lote AS (
        SELECT id_tasa, timestamp
        FROM mercado_tasas
        ORDER BY timestamp ASC
        LIMIT 1
      ),
      lotes_rangos AS (
        SELECT 
          id_tasa,
          timestamp AS t_inicio,
          LEAD(timestamp) OVER (ORDER BY timestamp ASC) AS t_fin
        FROM (
          SELECT DISTINCT id_tasa, timestamp 
          FROM mercado_tasas
        ) lotes
      )
      SELECT 
        c.hash_largo,
        c.hash_corto,
        c.timestamp AS timestamp_comprobante,
        to_timestamp(c.timestamp) AS fecha_hora_comprobante,
        COALESCE(f.monto, 0) AS monto,
        COALESCE(UPPER(f.moneda), 'USDT') AS moneda,
        f.banco,
        f.titular,
        f.referencia,
        COALESCE(f.procesado_ia, FALSE) AS procesado_ia,
        c.nombre_socio_1,
        c.nombre_socio_2,
        c.url_imagen,
        COALESCE(c.conteo, 1) AS conteo,
        COALESCE(lr.id_tasa, (SELECT id_tasa FROM primer_lote), 'T360') AS lote_tasa_asignado,
        
        COALESCE(
          mt.tasa_base, 
          mt_primer.tasa_base,
          CASE WHEN UPPER(COALESCE(f.moneda, 'USDT')) IN ('USD', 'USDT', 'PYUSD') THEN 1.0 ELSE NULL END
        ) AS tasa_mercado_aplicada,
        
        CASE 
          WHEN UPPER(COALESCE(f.moneda, 'USDT')) IN ('USD', 'USDT', 'PYUSD') THEN ROUND(COALESCE(f.monto, 0)::numeric, 2)
          WHEN COALESCE(mt.tasa_base, mt_primer.tasa_base) > 0 
            THEN ROUND((COALESCE(f.monto, 0) / COALESCE(mt.tasa_base, mt_primer.tasa_base))::numeric, 2)
          ELSE NULL
        END AS monto_usd_equivalente

      FROM cola_fb c
      LEFT JOIN comprobantes_fb f ON TRIM(LOWER(c.hash_largo)) = TRIM(LOWER(f.hash_largo))
      LEFT JOIN lotes_rangos lr 
        ON c.timestamp >= lr.t_inicio 
       AND (lr.t_fin IS NULL OR c.timestamp < lr.t_fin)
      LEFT JOIN mercado_tasas mt 
        ON mt.id_tasa = lr.id_tasa 
       AND mt.moneda = UPPER(f.moneda)
      LEFT JOIN mercado_tasas mt_primer
        ON mt_primer.id_tasa = (SELECT id_tasa FROM primer_lote)
       AND mt_primer.moneda = UPPER(f.moneda);
    `);
    console.log('✅ Vista v_comprobantes_auditados sincronizada.');
  } catch (err) {
    console.error('⚠️ Error al inicializar esquema en PostgreSQL:', err.message);
  }
}

module.exports = initDB;
