// Lógica de negocio de productos: valida el identificador y delega al repositorio.

const productosRepository = require('../repositories/productosRepository');

function listarProductos() {
  return productosRepository.listar();
}

// Devuelve el producto, o null si el id no es válido o no existe.
function obtenerProducto(idTexto) {
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) return null;
  return productosRepository.buscarPorId(id);
}

module.exports = { listarProductos, obtenerProducto };
