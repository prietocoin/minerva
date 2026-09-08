const app = require('./app');
const initDB = require('./database/initDb');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

process.on('uncaughtException', (err) => console.error('⚠️ Excepción aislada:', err.message));
process.on('unhandledRejection', (reason) => console.error('⚠️ Promesa rechazada aislada:', reason));

initDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`✅ Servidor Atenea v2.0 Modular activo en http://${HOST}:${PORT}`);
  });
});
