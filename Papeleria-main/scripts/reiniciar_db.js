// Borra la base generada para volver al estado inicial (solo productos, sin pedidos).
// Uso: npm run reset-db   (con el servidor detenido)

const fs = require('node:fs');
const { RUTA_DB, obtenerConexion, cerrarConexion } = require('../repositories/db');

for (const sufijo of ['', '-journal', '-wal', '-shm']) {
  fs.rmSync(RUTA_DB + sufijo, { force: true });
}
obtenerConexion();
cerrarConexion();
console.log(`Base recreada con los productos iniciales: ${RUTA_DB}`);
