export const comprobantesMixin = {
  async cargarComprobantes() {
    const params = new URLSearchParams();
    if (this.filtroSocio) params.append('socio', this.filtroSocio);
    if (this.filtroFecha) params.append('fechaInicio', this.filtroFecha);
    if (this.filtroHash) params.append('hash', this.filtroHash);
    params.append('soloDuplicados', this.soloDuplicados ? 'true' : 'false');

    try {
      const res = await fetch(`/api/comprobantes?${params.toString()}`);
      if (res.ok) {
        this.comprobantes = await res.json();
        this.calcularMetricas();
      }
    } catch (err) {
      console.error("Error al cargar comprobantes:", err);
    }
  },

  abrirModal(item) {
    this.itemEdicion = { 
      ...item, 
      tipo_manual: this.getCodigoOperativo(item.nombre_socio_1, item.moneda) || 'A' 
    };
    this.modalAbierto = true;
  },

  async guardarCambios() {
    try {
      const res = await fetch(`/api/comprobantes/${this.itemEdicion.hash_largo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.itemEdicion)
      });
      if (res.ok) {
        this.modalAbierto = false;
        await this.cargarComprobantes();
      }
    } catch (err) {
      console.error("Error al guardar cambios:", err);
    }
  },

  async eliminarComprobante(hash_largo) {
    if (!confirm('¿Deseas eliminar este comprobante de la tabla maestra?')) return;
    try {
      const res = await fetch(`/api/comprobantes/${hash_largo}`, { method: 'DELETE' });
      if (res.ok) {
        this.modalAbierto = false;
        await this.cargarComprobantes();
      }
    } catch (err) {
      console.error("Error al eliminar comprobante:", err);
    }
  },

  calcularMetricas() {
    this.metricas.recibidos = this.comprobantes.length;
    this.metricas.iaOk = this.comprobantes.filter(c => c.procesado_ia).length;
    this.metricas.duplicados = this.comprobantes.filter(c => c.conteo > 1).length;
  }
};
