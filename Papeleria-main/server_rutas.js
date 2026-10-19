// Arranque: prepara la base de datos, inicia el servidor y delega cada solicitud al enrutador.

const http = require('node:http');
const { manejarSolicitud } = require('./routes');
const { obtenerConexion, cerrarConexion, RUTA_DB } = require('./repositories/db');

const PUERTO = Number(process.env.PORT) || 3000;

obtenerConexion(); // crea tablas y productos iniciales si hace falta

// Registro de peticiones: imprime en la terminal método, ruta, código y tiempo de cada solicitud.
// Ejemplo: [14:05:12] POST /api/pedidos → 201 (8 ms)
function registrarPeticion(req, res) {
  const inicio = Date.now();
  res.on('finish', () => {
    const hora = new Date().toLocaleTimeString('es-CO', { hour12: false });
    const ms = Date.now() - inicio;
    console.log(`[${hora}] ${req.method} ${req.url} → ${res.statusCode} (${ms} ms)`);
  });
  return manejarSolicitud(req, res);
}

const servidor = http.createServer(registrarPeticion);

servidor.listen(PUERTO, () => {
  console.log(`Papelería La Libreta en http://localhost:${PUERTO}`);
  console.log(`Base de datos: ${RUTA_DB}`);
});

function detener() {
  servidor.close(() => {
    cerrarConexion();
    process.exit(0);
  });
}
process.on('SIGINT', detener);
process.on('SIGTERM', detener);
