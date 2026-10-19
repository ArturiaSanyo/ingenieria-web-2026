// Lógica de negocio de pedidos:
//  1. valida comprador e items (reglas obligatorias del enunciado),
//  2. agrupa productos repetidos,
//  3. recupera los precios desde SQLite (a través del repositorio),
//  4. calcula subtotales y total, y
//  5. pide al repositorio guardar pedido y detalles en una transacción.
// Cualquier precio o total enviado por el navegador se ignora.

const productosRepository = require('../repositories/productosRepository');
const pedidosRepository = require('../repositories/pedidosRepository');
const { ErrorValidacion } = require('./errores');

const LARGO_MAXIMO_NOMBRE = 100;
const LARGO_MAXIMO_CORREO = 254;
const CANTIDAD_MAXIMA = 999;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function listarPedidos() {
  return pedidosRepository.listar();
}

function obtenerPedido(idTexto) {
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) return null;
  return pedidosRepository.buscarPorId(id);
}

function registrarPedido(datos) {
  const { nombre, correo, items } = validarEntrada(datos);

  // Precios desde la base de datos, nunca desde el navegador.
  const ids = items.map((item) => item.producto_id);
  const productos = productosRepository.buscarPorIds(ids);
  const preciosPorId = new Map(productos.map((p) => [p.id, p.precio]));

  const inexistentes = ids.filter((id) => !preciosPorId.has(id));
  if (inexistentes.length > 0) {
    throw new ErrorValidacion(
      'El pedido incluye productos que no existen.',
      inexistentes.map((id) => `El producto con id ${id} no existe.`)
    );
  }

  const detalles = items.map((item) => ({
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_unitario: preciosPorId.get(item.producto_id)
  }));
  const total = detalles.reduce((suma, d) => suma + d.cantidad * d.precio_unitario, 0);

  return pedidosRepository.crear({ nombre, correo, total, detalles });
}

// Revisa toda la entrada y reúne todos los problemas en una sola respuesta.
function validarEntrada(datos) {
  const errores = [];

  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ErrorValidacion('El cuerpo debe ser un objeto JSON con nombre, correo e items.');
  }

  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const correo = typeof datos.correo === 'string' ? datos.correo.trim() : '';

  if (nombre === '') errores.push('El nombre es obligatorio.');
  else if (nombre.length > LARGO_MAXIMO_NOMBRE) errores.push(`El nombre admite máximo ${LARGO_MAXIMO_NOMBRE} caracteres.`);

  if (correo === '') errores.push('El correo es obligatorio.');
  else if (correo.length > LARGO_MAXIMO_CORREO || !FORMATO_CORREO.test(correo)) {
    errores.push('El correo no tiene un formato válido.');
  }

  const items = [];
  if (!Array.isArray(datos.items) || datos.items.length === 0) {
    errores.push('El pedido debe contener al menos un producto.');
  } else {
    datos.items.forEach((item, posicion) => {
      const etiqueta = `Producto ${posicion + 1}`;
      if (item === null || typeof item !== 'object') {
        errores.push(`${etiqueta}: debe ser un objeto con producto_id y cantidad.`);
        return;
      }
      const { producto_id, cantidad } = item;
      let valido = true;
      if (!Number.isSafeInteger(producto_id) || producto_id <= 0) {
        errores.push(`${etiqueta}: producto_id debe ser un entero positivo.`);
        valido = false;
      }
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        errores.push(`${etiqueta}: la cantidad debe ser un número entero positivo.`);
        valido = false;
      } else if (cantidad > CANTIDAD_MAXIMA) {
        errores.push(`${etiqueta}: la cantidad máxima por producto es ${CANTIDAD_MAXIMA}.`);
        valido = false;
      }
      if (valido) items.push({ producto_id, cantidad });
    });
  }

  const agrupados = agruparRepetidos(items);
  for (const { producto_id, cantidad } of agrupados) {
    if (cantidad > CANTIDAD_MAXIMA) {
      errores.push(`El producto ${producto_id} suma ${cantidad} unidades; el máximo por producto es ${CANTIDAD_MAXIMA}.`);
    }
  }

  if (errores.length > 0) {
    throw new ErrorValidacion('Los datos del pedido no son válidos.', errores);
  }

  return { nombre, correo, items: agrupados };
}

// Decisión de diseño: si un producto llega varias veces, se suman sus cantidades
// y se guarda un solo detalle por producto.
function agruparRepetidos(items) {
  const cantidades = new Map();
  for (const { producto_id, cantidad } of items) {
    cantidades.set(producto_id, (cantidades.get(producto_id) || 0) + cantidad);
  }
  return [...cantidades].map(([producto_id, cantidad]) => ({ producto_id, cantidad }));
}

module.exports = { listarPedidos, obtenerPedido, registrarPedido, validarEntrada };
