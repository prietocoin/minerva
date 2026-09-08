import { matrizFactorRemesaT363, listaPaisesBase, listaMonedas } from './constants/marketData.js';
import { comprobantesMixin } from './components/comprobantesComponent.js';
import { tasasMixin } from './components/tasasComponent.js';
import { directorioMixin } from './components/directorioComponent.js';
import { reportesMixin } from './components/reportesComponent.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
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
      ajustes: {}
    },

    carteleraPaisesEdit: [],
    tasasBaul: {},
    cargandoTasas: false,
    publicandoTasas: false,
    codigoTasaActual: '',
    mensajeTasas: '',

    metricas: { recibidos: 0, iaOk: 0, descartados: 0, duplicados: 0 },

    ...comprobantesMixin,
    ...tasasMixin,
    ...directorioMixin,
    ...reportesMixin,

    async init() {
      await this.cargarUltimasTasasMercado();
      await this.cargarSocios();
      await this.cargarDirectorio();
      await this.cargarComprobantes();
      await this.cargarReportes();
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
    }
  }));
});
