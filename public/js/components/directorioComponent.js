export const directorioMixin = {
  async cargarSocios() {
    try {
      const res = await fetch('/api/socios');
      if (res.ok) this.socios = (await res.json()).map(s => s.nombre);
    } catch (err) {
      console.error("Error al cargar socios:", err);
    }
  },

  async cargarDirectorio() {
    try {
      const res = await fetch('/api/directorio');
      if (res.ok) this.directorio = await res.json();
    } catch (err) {
      console.error("Error al cargar directorio:", err);
    }
  },

  async toggleEstadoSocio(nombre, nuevoEstado) {
    try {
      const res = await fetch(`/api/socios/${encodeURIComponent(nombre)}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado })
      });
      if (res.ok) await this.cargarDirectorio();
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  },

  async guardarConfigSocio() {
    if (!this.socioConfigEdit.nombre) return;
    this.guardandoConfig = true;

    try {
      const payload = {
        ...this.socioConfigEdit,
        talla: this.calcularTallaDinamica(this.contarPaisesActivosEdit()),
        cartelera_paises: this.carteleraPaisesEdit.map((p, idx) => ({
          pais: p.nombrePais,
          moneda: p.code,
          activo: p.activo,
          orden: idx + 1
        }))
      };

      const res = await fetch('/api/socios/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        this.modalConfigSocioAbierto = false;
        await this.cargarDirectorio();
        await this.cargarSocios();
        await this.cargarComprobantes();
      }
    } catch (err) {
      console.error("Error guardando socio:", err);
    } finally {
      this.guardandoConfig = false;
    }
  }
};
