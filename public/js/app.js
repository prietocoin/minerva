import { matrizFactorRemesaT363, listaPaisesBase, listaMonedas } from './constants/marketData.js';
import { comprobantesMixin } from './components/comprobantesComponent.js';
import { tasasMixin } from './components/tasasComponent.js';
import { directorioMixin } from './components/directorioComponent.js';
import { reportesMixin } from './components/reportesComponent.js';

const appComponent = () => ({
  vistaActiva: 'comprobantes',
  comprobantes: [],
  socios: [],
  directorio: [],
  ultimasTasasMercado: {},
  ultimoLoteId: '',
  filtroSocio: '',
  filtroFecha: '',
  filtroHash: '',
  soloDuplicados: false,
  modalAbierto: false,
  itemEdicion: null,

  modalConfigSocioAbierto: false,
  tabConfigActive: 'reglas',
  guardandoConfig: false,
  paisMaestroGeneral: 'PEN',

  nuevoPaisNombreInput: '',
  nuevoPaisMonedaInput: '',

  filtroReporteRol: '',
  filtroReporteNombre: '',
  filtroReporteFechaInicio: '',
  filtroReporteFechaFin: '',
  filtroReporteDesdeHash: '',
  comprobantesReporte: [],

  matrizFactorRemesaT363,
  listaPaisesBase,
  listaMonedas,

  socioConfigEdit: {
    nombre: '',
    roles: 'SOCIO',
    moneda_socio: 'USDT',
    talla: 'M',
    whatsapp: '',
    activo: true,
    pen: 'A', cop: 'A', clp: 'A', ars: 'A', ves: 'A', brl: 'A', mxn: 'A', pyg: 'A',
    dop: 'A', crc: 'A', eur: 'A', cad: 'A', usd: 'A', ecu: 'A', pan: 'A', usdt: 'A',
    ajustes: {}
  },

  carteleraPaisesEdit: [],
  tasasBaul: {},
  cargandoTasas: false,
  publicandoTasas: false,
  codigoTasaActual: '',
  mensajeTasas: '',

  metricas: { recibidos: 0, iaOk: 0, descartados: 0, duplicados: 0 },

  // Mixins de componentes
  ...comprobantesMixin,
  ...tasasMixin,
  ...directorioMixin,
  ...reportesMixin,

  // Helpers visuales requeridos por index.html
  getCodigoOperativo(nombreSocio, moneda) {
    if (!nombreSocio || !moneda || !this.directorio.length) return null;
    const socioNorm = nombreSocio.trim().toUpperCase();
    const monedaNorm = moneda.trim().toUpperCase();
    const registroSocio = this.directorio.find(d => d.nombre && d.nombre.trim().toUpperCase() === socioNorm);
    if (!registroSocio) return null;
    const codigo = registroSocio[monedaNorm] || registroSocio[monedaNorm.toLowerCase()];
    return codigo ? codigo.toUpperCase() : null;
  },

  claseInsignia(codigo) {
    if (!codigo) return 'hidden';
    const mapa = {
      'D': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-900/50',
      'P': 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-900/50',
      'A': 'bg-[#10b981]/20 text-emerald-300 border-emerald-500/40 shadow-emerald-900/50',
      'C': 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-900/50'
    };
    return mapa[codigo] || 'bg-slate-500/20 text-slate-300 border-slate-500/40';
  },

  obtenerPrimeraPalabra(texto) {
    if (!texto) return '-';
    const str = String(texto).trim();
    return str ? str.split(/\s+/)[0] : '-';
  },

  formatMonto(val) {
    if (val === null || val === undefined || isNaN(val)) return '0.00';
    return parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  formatTasa(val) {
    if (val === null || val === undefined || isNaN(val)) return '-';
    const v = Math.abs(parseFloat(val) || 0);
    if (v === 0) return '0';
    if (v > 499.99) return Math.trunc(v).toString();
    if (v < 10) {
      if (v < 1) {
        const magnitud = Math.floor(Math.log10(v));
        const f = Math.pow(10, 2 - magnitud);
        return (Math.trunc(v * f) / f).toString();
      }
      return (Math.trunc(v * 1000) / 1000).toString();
    }
    return (Math.trunc(v * 100) / 100).toFixed(2);
  },

  formatFechaVE(ts) {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleString('es-VE', { 
      timeZone: 'America/Caracas', 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
    });
  },

  async init() {
    await this.cargarUltimasTasasMercado();
    await this.cargarSocios();
    await this.cargarDirectorio();
    await this.cargarComprobantes();
    await this.cargarReportes();
  }
});

// Registro seguro que evita problemas de tiempo de carga con Alpine CDN
if (window.Alpine) {
  window.Alpine.data('app', appComponent);
} else {
  document.addEventListener('alpine:init', () => {
    window.Alpine.data('app', appComponent);
  });
}
