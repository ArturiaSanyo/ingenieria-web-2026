// Controlador de productos: interpreta HTTP, usa el modelo y elige código y formato.

const productoModel = require('../models/productoModel');
const { enviarJSON, enviarError } = require('./http');

// GET /api/productos → 200 con el arreglo de productos
function listar(req, res) {
  enviarJSON(res, 200, productoModel.listarProductos());
}

// GET /api/productos/:id → 200 con el producto, 404 si no existe
function obtener(req, res, parametros) {
  const producto = productoModel.obtenerProducto(parametros.id);
  if (!producto) {
    enviarError(res, 404, `No existe un producto con id ${parametros.id}.`);
    return;
  }
  enviarJSON(res, 200, producto);
}

module.exports = { listar, obtener };
