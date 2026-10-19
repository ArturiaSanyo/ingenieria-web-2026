// Capa de acceso a datos: conexión única a SQLite, creación del esquema,
// carga de datos iniciales y la función enTransaccion.
// Usa el módulo nativo node:sqlite (sin dependencias externas).

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const CARPETA_DATA = path.join(__dirname, '..', 'data');
const RUTA_DB = process.env.DB_PATH || path.join(CARPETA_DATA, 'tienda.db');

let conexion = null;

// Abre la base (la crea si no existe), activa las claves foráneas
// y garantiza que existan las tablas y los productos iniciales.
function obtenerConexion() {
  if (conexion) return conexion;

  conexion = new DatabaseSync(RUTA_DB);
  conexion.exec('PRAGMA foreign_keys = ON;');

  const esquema = fs.readFileSync(path.join(CARPETA_DATA, 'schema.sql'), 'utf8');
  conexion.exec(esquema);

  const { cantidad } = conexion.prepare('SELECT COUNT(*) AS cantidad FROM productos').get();
  if (cantidad === 0) {
    const semilla = fs.readFileSync(path.join(CARPETA_DATA, 'seed.sql'), 'utf8');
    conexion.exec(semilla);
  }

  return conexion;
}

// Ejecuta "operacion" como una sola transacción:
// si algo falla se deshace todo (no quedan pedidos ni detalles parciales).
function enTransaccion(operacion) {
  const db = obtenerConexion();
  db.exec('BEGIN');
  try {
    const resultado = operacion(db);
    db.exec('COMMIT');
    return resultado;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function cerrarConexion() {
  if (conexion) {
    conexion.close();
    conexion = null;
  }
}

module.exports = { obtenerConexion, enTransaccion, cerrarConexion, RUTA_DB };
