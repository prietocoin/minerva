function aplicarReglaPrecision(val) {
  const v = Math.abs(parseFloat(val) || 0);
  if (v === 0) return 0;

  if (v > 499.99) {
    return Math.trunc(v);
  } else if (v < 10) {
    if (v < 1) {
      const magnitud = Math.floor(Math.log10(v));
      const f = Math.pow(10, 2 - magnitud);
      return Math.trunc(v * f) / f;
    }
    return Math.trunc(v * 1000) / 1000;
  } else {
    return Math.trunc(v * 100) / 100;
  }
}

function calcularTallaAutomatica(conteo) {
  if (conteo <= 3) return 'S';
  if (conteo <= 6) return 'M';
  return 'L';
}

module.exports = {
  aplicarReglaPrecision,
  calcularTallaAutomatica
};
