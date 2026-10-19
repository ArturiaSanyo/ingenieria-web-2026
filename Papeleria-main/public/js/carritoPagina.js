// Página del carrito: muestra cantidades, subtotales y total provisional,
// recoge nombre y correo, envía el pedido y muestra la confirmación del servidor.

import { obtenerProductos, registrarPedido, pesos, escapar } from './api.js';
import {
  leerCarrito,
  cambiarCantidad,
  retirarProducto,
  vaciarCarrito,
  actualizarContador,
  CANTIDAD_MAXIMA
} from './carrito.js';

const estado = document.getElementById('estado');
const contenido = document.getElementById('contenido-carrito');
const filas = document.getElementById('filas');
const totalCelda = document.getElementById('total');
const formulario = document.getElementById('formulario');
const errorFormulario = document.getElementById('error-formulario');
const botonEnviar = document.getElementById('boton-enviar');

let productosPorId = new Map();

actualizarContador();
iniciar();

async function iniciar() {
  try {
    const productos = await obtenerProductos();
    productosPorId = new Map(productos.map((p) => [p.id, p]));
    // Retira del carrito productos que ya no existen en el catálogo.
    leerCarrito()
      .filter((item) => !productosPorId.has(item.producto_id))
      .forEach((item) => retirarProducto(item.producto_id));
    pintar();
  } catch (error) {
    mostrarEstado(`No se pudo cargar el carrito. ${error.message}`, true);
  }
}

function pintar() {
  const items = leerCarrito();
  if (items.length === 0) {
    mostrarEstado('Tu carrito está vacío. Agrega productos desde el catálogo.');
    estado.insertAdjacentHTML('beforeend', ' <a href="/">Ir al catálogo</a>');
    return;
  }

  let total = 0;
  filas.innerHTML = items
    .map((item) => {
      const producto = productosPorId.get(item.producto_id);
      const subtotal = producto.precio * item.cantidad;
      total += subtotal;
      return `
        <tr>
          <td data-etiqueta="Producto">${escapar(producto.nombre)}</td>
          <td data-etiqueta="Precio" class="numero">${pesos(producto.precio)}</td>
          <td data-etiqueta="Cantidad">
            <div class="cantidad">
              <button type="button" class="mini" data-restar="${producto.id}" aria-label="Restar uno a ${escapar(producto.nombre)}">−</button>
              <input type="number" min="1" max="${CANTIDAD_MAXIMA}" step="1" value="${item.cantidad}"
                     data-cantidad="${producto.id}" aria-label="Cantidad de ${escapar(producto.nombre)}">
              <button type="button" class="mini" data-sumar="${producto.id}" aria-label="Sumar uno a ${escapar(producto.nombre)}">+</button>
            </div>
          </td>
          <td data-etiqueta="Subtotal" class="numero">${pesos(subtotal)}</td>
          <td><button type="button" class="enlace-peligro" data-retirar="${producto.id}">Retirar</button></td>
        </tr>`;
    })
    .join('');

  totalCelda.textContent = pesos(total);
  estado.hidden = true;
  contenido.hidden = false;
}

// Botones + / − / Retirar
filas.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button');
  if (!boton) return;
  const { sumar, restar, retirar } = boton.dataset;
  const actual = (id) => leerCarrito().find((item) => item.producto_id === id)?.cantidad || 1;

  if (sumar) cambiarCantidad(Number(sumar), actual(Number(sumar)) + 1);
  else if (restar) cambiarCantidad(Number(restar), actual(Number(restar)) - 1);
  else if (retirar) retirarProducto(Number(retirar));
  else return;
  pintar();
});

// Cantidad escrita a mano
filas.addEventListener('change', (evento) => {
  const campo = evento.target.closest('[data-cantidad]');
  if (!campo) return;
  cambiarCantidad(Number(campo.dataset.cantidad), Number(campo.value));
  pintar();
});

// Al corregir un campo se oculta el mensaje de error anterior.
formulario.addEventListener('input', ocultarError);

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  ocultarError();

  const nombre = formulario.nombre.value.trim();
  const correo = formulario.correo.value.trim();
  const problemas = [];
  if (!nombre) problemas.push('Escribe tu nombre.');
  if (!correo) problemas.push('Escribe tu correo.');
  else if (!formulario.correo.checkValidity()) problemas.push('El correo no tiene un formato válido.');
  const items = leerCarrito().map(({ producto_id, cantidad }) => ({ producto_id, cantidad }));
  if (items.length === 0) problemas.push('El carrito está vacío.');
  if (problemas.length > 0) {
    mostrarError('Revisa el formulario:', problemas);
    return;
  }

  botonEnviar.disabled = true;
  botonEnviar.textContent = 'Registrando…';
  try {
    const pedido = await registrarPedido({ nombre, correo, items });
    vaciarCarrito(); // solo después de un registro exitoso
    mostrarConfirmacion(pedido);
  } catch (error) {
    // El carrito se conserva para que el comprador pueda corregir e intentar de nuevo.
    mostrarError(`No se pudo registrar el pedido. ${error.message}`, error.detalles);
  } finally {
    botonEnviar.disabled = false;
    botonEnviar.textContent = 'Registrar pedido';
  }
});

function mostrarConfirmacion(pedido) {
  document.getElementById('conf-id').textContent = `#${pedido.id}`;
  document.getElementById('conf-nombre').textContent = pedido.nombre;
  document.getElementById('conf-total').textContent = pesos(pedido.total);
  document.getElementById('conf-detalles').innerHTML = pedido.detalles
    .map(
      (d) =>
        `<li><span>${d.cantidad} × ${escapar(d.nombre)}</span><span>${pesos(d.subtotal)}</span></li>`
    )
    .join('');
  document.getElementById('zona-carrito').hidden = true;
  const seccion = document.getElementById('confirmacion');
  seccion.hidden = false;
  seccion.focus?.();
  window.scrollTo({ top: 0 });
}

function mostrarError(mensaje, detalles = []) {
  errorFormulario.innerHTML =
    `<p>${escapar(mensaje)}</p>` +
    (detalles.length ? `<ul>${detalles.map((d) => `<li>${escapar(d)}</li>`).join('')}</ul>` : '');
  errorFormulario.hidden = false;
}

function ocultarError() {
  errorFormulario.hidden = true;
  errorFormulario.innerHTML = '';
}

function mostrarEstado(mensaje, esError = false) {
  estado.textContent = mensaje;
  estado.classList.toggle('error', esError);
  estado.hidden = false;
  contenido.hidden = true;
}
