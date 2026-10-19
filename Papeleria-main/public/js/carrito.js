// Estado del carrito en localStorage.
// Solo se guarda [{ producto_id, cantidad }]: nombres y precios se consultan a la API,
// así el carrito nunca decide precios.

const CLAVE = 'la-libreta.carrito';
const CANTIDAD_MAXIMA = 999;

export function leerCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    if (!Array.isArray(datos)) return [];
    return datos.filter(
      (item) => Number.isInteger(item.producto_id) && Number.isInteger(item.cantidad) && item.cantidad > 0
    );
  } catch {
    return [];
  }
}

function guardarCarrito(items) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // almacenamiento no disponible (modo privado): el carrito dura mientras la página esté abierta
  }
  actualizarContador();
}

export function agregarProducto(productoId, cantidad = 1) {
  const items = leerCarrito();
  const existente = items.find((item) => item.producto_id === productoId);
  if (existente) existente.cantidad = Math.min(existente.cantidad + cantidad, CANTIDAD_MAXIMA);
  else items.push({ producto_id: productoId, cantidad });
  guardarCarrito(items);
}

export function cambiarCantidad(productoId, cantidad) {
  const valor = Math.min(Math.max(1, Math.trunc(cantidad) || 1), CANTIDAD_MAXIMA);
  const items = leerCarrito().map((item) =>
    item.producto_id === productoId ? { ...item, cantidad: valor } : item
  );
  guardarCarrito(items);
  return valor;
}

export function retirarProducto(productoId) {
  guardarCarrito(leerCarrito().filter((item) => item.producto_id !== productoId));
}

export function vaciarCarrito() {
  guardarCarrito([]);
}

export function contarUnidades() {
  return leerCarrito().reduce((suma, item) => suma + item.cantidad, 0);
}

// Actualiza el número junto al enlace "Carrito" en la navegación.
export function actualizarContador() {
  const unidades = contarUnidades();
  document.querySelectorAll('[data-contador-carrito]').forEach((elemento) => {
    elemento.textContent = unidades;
    elemento.hidden = unidades === 0;
  });
}

export { CANTIDAD_MAXIMA };
