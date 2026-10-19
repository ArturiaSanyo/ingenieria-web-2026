// Cliente de la API: todas las llamadas fetch de la interfaz pasan por aquí.

export class ErrorApi extends Error {
  constructor(mensaje, estado, detalles = []) {
    super(mensaje);
    this.estado = estado;
    this.detalles = detalles;
  }
}

async function pedirJSON(url, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new ErrorApi('No fue posible conectar con el servidor. Verifica que esté encendido.', 0);
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // respuesta sin JSON
  }

  if (!respuesta.ok) {
    const mensaje = datos && datos.error ? datos.error : `El servidor respondió con el código ${respuesta.status}.`;
    throw new ErrorApi(mensaje, respuesta.status, (datos && datos.detalles) || []);
  }
  return datos;
}

export const obtenerProductos = () => pedirJSON('/api/productos');

export const obtenerPedidos = () => pedirJSON('/api/pedidos');

// Solo se envían nombre, correo e items (producto_id y cantidad).
// Los precios y el total los calcula el servidor.
export const registrarPedido = (pedido) =>
  pedirJSON('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido)
  });

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

export const pesos = (valor) => formatoPesos.format(valor);

// Evita inyectar HTML con datos que vienen de la base.
export function escapar(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
