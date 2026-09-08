const FACTORES_BASE_MERCADO = {
  "P-USDT": 1.0,   "D-USDT": 1.0,
  "P-PYUSD": 0.8,  "D-PYUSD": 1.2,
  "P-PEN": 0.976,  "D-PEN": 1.026,
  "P-COP": 0.976,  "D-COP": 1.030,
  "P-CLP": 0.962,  "D-CLP": 1.042,
  "P-ARS": 0.962,  "D-ARS": 1.042,
  "P-VES": 0.976,  "D-VES": 1.026,
  "P-BRL": 0.952,  "D-BRL": 1.053,
  "P-MXN": 0.943,  "D-MXN": 1.064,
  "P-PYG": 0.962,  "D-PYG": 1.042,
  "P-EUR": 0.926,  "D-EUR": 1.087,
  "P-USD": 0.930,  "D-USD": 1.087,
  "P-ECU": 0.940,  "D-ECU": 1.064,
  "P-DOP": 0.943,  "D-DOP": 1.064,
  "P-CRC": 0.943,  "D-CRC": 1.064,
  "P-CAD": 0.962,  "D-CAD": 1.042,
  "P-BOB": 0.926,  "D-BOB": 1.087
};

const SEED_SOCIOS_CONFIG = {
  "GENERAL": {
    "id_grupo": "GRP_GENERAL",
    "nombre": "GENERAL",
    "roles": "MATRIZ_GENERAL",
    "moneda_socio": "USDT",
    "talla": "L",
    "whatsapp": "120363421142957552@g.us",
    "activo": false,
    "pen": "A", "cop": "A", "clp": "A", "ars": "A", "ves": "A", "brl": "A", "mxn": "A", "pyg": "A", "usd": "A", "ecu": "A", "eur": "A", "usdt": "A",
    "cartelera_paises": [
      { "pais": "Argentina", "moneda": "ARS", "activo": true, "orden": 1 },
      { "pais": "Venezuela", "moneda": "VES", "activo": true, "orden": 2 },
      { "pais": "Peru", "moneda": "PEN", "activo": true, "orden": 3 },
      { "pais": "Colombia", "moneda": "COP", "activo": true, "orden": 4 },
      { "pais": "Chile", "moneda": "CLP", "activo": true, "orden": 5 },
      { "pais": "Brazil", "moneda": "BRL", "activo": true, "orden": 6 }
    ],
    "ajustes": FACTORES_BASE_MERCADO
  },
  "OMAR": {
    "id_grupo": "120363323877732465@g.us",
    "nombre": "Omar",
    "roles": "SOCIO",
    "moneda_socio": "USDT",
    "talla": "M",
    "whatsapp": "120363323877732465@g.us",
    "activo": true,
    "pen": "A", "cop": "A", "clp": "A", "ars": "A", "ves": "A", "brl": "A", "mxn": "A", "pyg": "A", "usd": "A", "ecu": "A", "eur": "A", "usdt": "A",
    "cartelera_paises": [
      { "pais": "Brazil", "moneda": "BRL", "activo": true, "orden": 1 },
      { "pais": "Colombia", "moneda": "COP", "activo": true, "orden": 2 },
      { "pais": "Chile", "moneda": "CLP", "activo": true, "orden": 3 },
      { "pais": "Peru", "moneda": "PEN", "activo": true, "orden": 4 }
    ],
    "ajustes": FACTORES_BASE_MERCADO
  },
  "CHASAN": {
    "id_grupo": "120363339357414946@g.us",
    "nombre": "Chasan",
    "roles": "SOCIO",
    "moneda_socio": "USDT",
    "talla": "M",
    "whatsapp": "120363339357414946@g.us",
    "activo": true,
    "pen": "A", "cop": "A", "clp": "A", "ars": "A", "ves": "A", "brl": "A", "mxn": "A", "pyg": "A", "usd": "A", "ecu": "A", "eur": "A", "usdt": "A",
    "cartelera_paises": [
      { "pais": "Peru", "moneda": "PEN", "activo": true, "orden": 1 },
      { "pais": "Chile", "moneda": "CLP", "activo": true, "orden": 2 },
      { "pais": "Colombia", "moneda": "COP", "activo": true, "orden": 3 },
      { "pais": "Argentina", "moneda": "ARS", "activo": true, "orden": 4 }
    ],
    "ajustes": FACTORES_BASE_MERCADO
  }
};

module.exports = {
  FACTORES_BASE_MERCADO,
  SEED_SOCIOS_CONFIG
};
