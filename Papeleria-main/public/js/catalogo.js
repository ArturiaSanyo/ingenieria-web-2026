// Página de catálogo: obtiene los productos con GET /api/productos y permite agregarlos al carrito.

import { obtenerProductos, pesos, escapar } from './api.js';
import { agregarProducto, actualizarContador, leerCarrito } from './carrito.js';

const estado = document.getElementById('estado');
const contenedor = document.getElementById('productos');

actualizarContador();
cargar();

async function cargar() {
  try {
    const productos = await obtenerProductos();
    if (productos.length === 0) {
      mostrarEstado('No hay productos disponibles por ahora.');
      return;
    }
    contenedor.innerHTML = productos.map(tarjeta).join('');
    estado.hidden = true;
    contenedor.hidden = false;
  } catch (error) {
    mostrarEstado(`No se pudo cargar el catálogo. ${error.message}`, true);
  }
}

function tarjeta(producto) {
  const enCarrito = leerCarrito().find((item) => item.producto_id === producto.id);
  return `
    <article class="tarjeta producto">
      <span class="codigo">Ref. ${producto.id}</span>
      <h2>${escapar(producto.nombre)}</h2>
      <p>${escapar(producto.descripcion)}</p>
      <div class="pie-producto">
        <span class="precio">${pesos(producto.precio)}</span>
        <button class="boton" type="button" data-agregar="${producto.id}">Agregar</button>
      </div>
      <p class="aviso" data-aviso="${producto.id}" aria-live="polite">${
        enCarrito ? `En el carrito: ${enCarrito.cantidad}` : ''
      }</p>
    </article>`;
}

contenedor.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-agregar]');
  if (!boton) return;
  const id = Number(boton.dataset.agregar);
  agregarProducto(id);
  const cantidad = leerCarrito().find((item) => item.producto_id === id).cantidad;
  contenedor.querySelector(`[data-aviso="${id}"]`).textContent = `Agregado ✓ · En el carrito: ${cantidad}`;
});

function mostrarEstado(mensaje, esError = false) {
  estado.textContent = mensaje;
  estado.classList.toggle('error', esError);
  estado.hidden = false;
  contenedor.hidden = true;
}
