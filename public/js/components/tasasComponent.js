export const tasasMixin = {
  async cargarUltimasTasasMercado() {
    try {
      const res = await fetch('/api/tasas/ultimas');
      if (res.ok) {
        const data = await res.json();
        this.ultimasTasasMercado = data.tasas || {};
        this.ultimoLoteId = data.id_tasa || '';
      }
    } catch (err) {
      console.error("Error cargando tasas:", err);
    }
  },

  async consultarApiHoo() {
    this.cargandoTasas = true;
    this.mensajeTasas = 'Conectando con la API oficial de Hoo...';

    try {
      const res = await fetch('/api/tasas/fetch-hoo');
      const data = await res.json();
      if (data && data.success && data.rates) {
        this.tasasBaul = data.rates;
        this.mensajeTasas = '';
      } else {
        this.mensajeTasas = 'El motor de Hoo no ha enviado un borrador reciente.';
      }
    } catch (err) {
      this.mensajeTasas = `Error: ${err.message}`;
    } finally {
      this.cargandoTasas = false;
    }
  },

  async publicarTasaOficial() {
    if (Object.keys(this.tasasBaul).length === 0 || this.publicandoTasas) return;
    this.publicandoTasas = true;

    try {
      const res = await fetch('/api/tasas/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_tasa: this.codigoTasaActual || null,
          tasas: this.tasasBaul
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.codigoTasaActual = data.id_tasa;
        await this.cargarUltimasTasasMercado();
        await this.cargarComprobantes();
      }
    } catch (err) {
      console.error("Error publicando tasa:", err);
    } finally {
      this.publicandoTasas = false;
    }
  },

  async reenviarTasas(idTasa = null) {
    try {
      const res = await fetch('/api/tasas/reenviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_tasa: idTasa || this.codigoTasaActual || this.ultimoLoteId })
      });
      const data = await res.json();
      alert(data.message || 'Reenvío solicitado');
    } catch (err) {
      console.error("Error reenviando tasas:", err);
    }
  }
};
