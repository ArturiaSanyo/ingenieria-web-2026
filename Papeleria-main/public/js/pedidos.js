// Página de pedidos: consulta GET /api/pedidos y muestra cada pedido con sus productos.

import { obtenerPedidos, pesos, escapar } from './api.js';
import { actualizarContador } from './carrito.js';

const estado = document.getElementById('estado');
const contenedor = document.getElementById('pedidos');

actualizarContador();
cargar();

async function cargar() {
  try {
    const pedidos = await obtenerPedidos();
    if (pedidos.length === 0) {
      estado.innerHTML = 'Todavía no hay pedidos registrados. <a href="/">Ir al catálogo</a>';
      return;
    }
    contenedor.innerHTML = pedidos.map(tarjeta).join('');
    estado.hidden = true;
    contenedor.hidden = false;
  } catch (error) {
    estado.textContent = `No se pudieron cargar los pedidos. ${error.message}`;
    estado.classList.add('error');
  }
}

function tarjeta(pedido) {
  return `
    <article class="tarjeta pedido">
      <header class="pedido-encabezado">
        <h2>Pedido #${pedido.id}</h2>
        <time datetime="${escapar(pedido.fecha.replace(' ', 'T'))}">${formatearFecha(pedido.fecha)}</time>
      </header>
      <p class="comprador">${escapar(pedido.nombre)} · <span>${escapar(pedido.correo)}</span></p>
      <ul class="lista-detalles">
        ${pedido.detalles
          .map(
            (d) => `<li>
              <span>${d.cantidad} × ${escapar(d.nombre)} <small>(${pesos(d.precio_unitario)} c/u)</small></span>
              <span>${pesos(d.subtotal)}</span>
            </li>`
          )
          .join('')}
      </ul>
      <p class="pedido-total">Total <strong>${pesos(pedido.total)}</strong></p>
    </article>`;
}

// "2026-10-15 18:49:02" → "15 oct 2026, 6:49 p. m."
function formatearFecha(texto) {
  const fecha = new Date(texto.replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return escapar(texto);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha);
}
