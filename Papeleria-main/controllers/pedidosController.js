// Controlador de pedidos: lee la solicitud, usa el modelo y traduce el resultado a HTTP.

const pedidoModel = require('../models/pedidoModel');
const { ErrorValidacion } = require('../models/errores');
const { enviarJSON, enviarError, leerCuerpoJSON } = require('./http');

// GET /api/pedidos → 200 con el arreglo de pedidos y sus detalles ([] si no hay)
function listar(req, res) {
  enviarJSON(res, 200, pedidoModel.listarPedidos());
}

// POST /api/pedidos → 201 con el pedido creado, 400 si los datos no son válidos
async function crear(req, res) {
  const datos = await leerCuerpoJSON(req); // 415 / 413 / 400 los maneja el enrutador

  try {
    const pedido = pedidoModel.registrarPedido(datos);
    res.setHeader('Location', `/api/pedidos/${pedido.id}`);
    enviarJSON(res, 201, pedido);
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      enviarError(res, 400, error.message, error.detalles);
      return;
    }
    throw error; // error interno → 500 en el enrutador
  }
}

// GET /api/pedidos/:id → 200 con el pedido, 404 si no existe (ruta adicional)
function obtener(req, res, parametros) {
  const pedido = pedidoModel.obtenerPedido(parametros.id);
  if (!pedido) {
    enviarError(res, 404, `No existe un pedido con id ${parametros.id}.`);
    return;
  }
  enviarJSON(res, 200, pedido);
}

module.exports = { listar, crear, obtener };
