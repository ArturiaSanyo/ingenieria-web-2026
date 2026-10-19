// Consultas parametrizadas sobre la tabla productos.
// Devuelve datos; nunca construye respuestas HTTP.

const { obtenerConexion } = require('./db');

function listar() {
  return obtenerConexion()
    .prepare('SELECT id, nombre, descripcion, precio FROM productos ORDER BY id')
    .all()
    .map(aObjeto);
}

function buscarPorId(id) {
  const fila = obtenerConexion()
    .prepare('SELECT id, nombre, descripcion, precio FROM productos WHERE id = ?')
    .get(id);
  return fila ? aObjeto(fila) : null;
}

// Recupera varios productos en una sola consulta: WHERE id IN (?, ?, ...)
function buscarPorIds(ids) {
  if (ids.length === 0) return [];
  const marcadores = ids.map(() => '?').join(', ');
  return obtenerConexion()
    .prepare(`SELECT id, nombre, descripcion, precio FROM productos WHERE id IN (${marcadores})`)
    .all(...ids)
    .map(aObjeto);
}

// node:sqlite devuelve objetos sin prototipo; se copian a objetos normales.
function aObjeto(fila) {
  return { id: fila.id, nombre: fila.nombre, descripcion: fila.descripcion, precio: fila.precio };
}

module.exports = { listar, buscarPorId, buscarPorIds };
