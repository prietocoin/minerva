export const reportesMixin = {
  async cargarReportes() {
    const params = new URLSearchParams();
    if (this.filtroReporteRol) params.append('rol', this.filtroReporteRol);
    if (this.filtroReporteNombre) params.append('socio', this.filtroReporteNombre);
    if (this.filtroReporteFechaInicio) params.append('fechaInicio', this.filtroReporteFechaInicio);
    if (this.filtroReporteFechaFin) params.append('fechaFin', this.filtroReporteFechaFin);
    if (this.filtroReporteDesdeHash) params.append('desdeHash', this.filtroReporteDesdeHash);

    try {
      const res = await fetch(`/api/reportes?${params.toString()}`);
      if (res.ok) this.comprobantesReporte = await res.json();
    } catch (err) {
      console.error("Error al cargar reportes:", err);
    }
  }
};
