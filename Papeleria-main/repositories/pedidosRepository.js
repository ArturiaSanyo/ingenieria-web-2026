// Consultas parametrizadas sobre pedidos y detalle_pedido.
// Devuelve datos; nunca construye respuestas HTTP.

const { obtenerConexion, enTransaccion } = require('./db');

const SQL_PEDIDOS_CON_DETALLES = `
  SELECT p.id, p.nombre, p.correo, p.fecha, p.total,
         d.producto_id, pr.nombre AS producto_nombre,
         d.cantidad, d.precio_unitario
  FROM pedidos p
  JOIN detalle_pedido d ON d.pedido_id = p.id
  JOIN productos pr     ON pr.id = d.producto_id
`;

// Guarda el pedido y todos sus detalles como una sola operación.
// pedido = { nombre, correo, total, detalles: [{ producto_id, cantidad, precio_unitario }] }
function crear(pedido) {
  const id = enTransaccion((db) => {
    const resultado = db
      .prepare('INSERT INTO pedidos (nombre, correo, total) VALUES (?, ?, ?)')
      .run(pedido.nombre, pedido.correo, pedido.total);
    const pedidoId = Number(resultado.lastInsertRowid);

    const insertarDetalle = db.prepare(
      'INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)'
    );
    for (const detalle of pedido.detalles) {
      insertarDetalle.run(pedidoId, detalle.producto_id, detalle.cantidad, detalle.precio_unitario);
    }
    return pedidoId;
  });

  return buscarPorId(id);
}

function listar() {
  const filas = obtenerConexion()
    .prepare(`${SQL_PEDIDOS_CON_DETALLES} ORDER BY p.id DESC, d.id`)
    .all();
  return agrupar(filas);
}

function buscarPorId(id) {
  const filas = obtenerConexion()
    .prepare(`${SQL_PEDIDOS_CON_DETALLES} WHERE p.id = ? ORDER BY d.id`)
    .all(id);
  return agrupar(filas)[0] || null;
}

// Convierte las filas del JOIN (una por detalle) en pedidos con su arreglo de detalles.
function agrupar(filas) {
  const pedidos = new Map();
  for (const fila of filas) {
    if (!pedidos.has(fila.id)) {
      pedidos.set(fila.id, {
        id: fila.id,
        nombre: fila.nombre,
        correo: fila.correo,
        fecha: fila.fecha,
        total: fila.total,
        detalles: []
      });
    }
    pedidos.get(fila.id).detalles.push({
      producto_id: fila.producto_id,
      nombre: fila.producto_nombre,
      cantidad: fila.cantidad,
      precio_unitario: fila.precio_unitario,
      subtotal: fila.cantidad * fila.precio_unitario
    });
  }
  return [...pedidos.values()];
}

module.exports = { crear, listar, buscarPorId };
