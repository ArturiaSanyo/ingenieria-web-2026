# Evidencias de pruebas — casos mínimos de aceptación

Fecha de ejecución: 15/10/2026. Entorno: ejecución local con Node.js y `node:sqlite`. Base de datos limpia (`npm run reset-db`) antes de empezar.

## Cómo repetir las pruebas

- **Interfaz (casos 1, 2, 3 y 9):** recorrido en el navegador descrito abajo. Capturas en [`evidencias/`](evidencias/).
- **API (casos 1 y 3 a 9):** `npm run probar` (o `node scripts/probar_api.js --markdown` si PowerShell bloquea `npm`). El script `scripts/probar_api.js`:
  - levanta su propio servidor en el puerto 3100 con una base temporal (no toca `data/tienda.db`),
  - consulta SQLite directamente para contar pedidos y detalles **antes y después** de cada rechazo,
  - para el caso 9 **detiene y vuelve a iniciar** el servidor.
- **Respuestas HTTP y consultas a la base:** [`evidencias/respuestas_api.txt`](evidencias/respuestas_api.txt) contiene la salida de `curl -i` y de tres consultas SQL, tomadas después de reiniciar el servidor.
- **Consultas manuales** (con cualquier visor de SQLite, o `sqlite3 data/tienda.db`):
  ```sql
  SELECT COUNT(*) FROM pedidos;
  SELECT COUNT(*) FROM detalle_pedido;
  SELECT p.id, p.nombre, p.total, d.producto_id, d.cantidad, d.precio_unitario
  FROM pedidos p JOIN detalle_pedido d ON d.pedido_id = p.id ORDER BY p.id DESC;
  ```

## 1. Recorrido en el navegador

| Caso | Acción | Esperado | Observado | Evidencia |
|---|---|---|---|---|
| 1 Catálogo | Abrir `http://localhost:3000` | ≥ 6 productos obtenidos con `fetch`; `GET /api/productos` → 200 JSON | 8 tarjetas. Red: `GET /api/productos -> 200 application/json; charset=utf-8` | `01_catalogo.png` |
| 2 Carrito | Agregar **cuaderno** (12 000) y **bolígrafo** (2 500) | 2 filas, total 14 500 | Total provisional $ 14.500 | `02a_carrito_agregados.png` |
| 2 Carrito | Cuaderno con **+** → 2; escribir **3** en bolígrafo | Subtotales 24 000 y 7 500; total 31 500 | $ 24.000 · $ 7.500 · total $ 31.500 | `02b_carrito_cantidades.png` |
| 2 Carrito | **Retirar** bolígrafo | Queda una fila; total 24 000 | Total $ 24.000 | `02c_carrito_retirado.png` |
| 2 Carrito | **Retirar** cuaderno (vaciar) | Mensaje de carrito vacío | «Tu carrito está vacío. Agrega productos desde el catálogo. Ir al catálogo» | `02d_carrito_vacio.png` |
| RF3 | Registrar con el formulario vacío | Error comprensible | «Revisa el formulario: Escribe tu nombre. Escribe tu correo.» Al escribir en un campo, el mensaje se oculta. | `03a_formulario_error.png` |
| RF3 | Registrar con el **servidor apagado** | Error comprensible; el carrito se conserva | «No se pudo registrar el pedido. No fue posible conectar con el servidor. Verifica que esté encendido.» El carrito sigue con su producto. | `03d_error_sin_servidor.png` |
| 3 Pedido válido | 2 cuadernos + 1 bolígrafo; nombre «  Ana Ejemplo  » y correo; **Registrar pedido** | 201; confirmación con id y total del servidor; carrito vacío | Red: `POST /api/pedidos -> 201`. «Pedido #1 a nombre de Ana Ejemplo · Total $ 26.500». Contador del carrito en 0. Nombre guardado sin espacios exteriores. | `03b_formulario_listo.png`, `03c_confirmacion.png` |
| RF5 | Abrir Pedidos con la base vacía | Mensaje de ausencia de registros | «Todavía no hay pedidos registrados. Ir al catálogo» (la API devolvió `[]`) | `00_pedidos_vacio.png` |
| 9 Persistencia | Detener el servidor, iniciarlo de nuevo y abrir Pedidos | El pedido sigue con sus dos productos | Pedido #1: 2 × Cuaderno argollado, 1 × Bolígrafo de gel, total $ 26.500, con fecha | `04_pedidos_tras_reinicio.png`, `respuestas_api.txt` |
| RF6 | Carrito en pantalla de 390 px | Interfaz legible | La tabla se convierte en tarjetas | `06_movil.png` |

En todo el recorrido la consola del navegador no registró errores.

## 2. Pruebas de la API (`npm run probar`)

Salida real de la última ejecución:

| Caso | Entrada | Esperado | Observado | Resultado |
|---|---|---|---|---|
| 1 Catálogo | GET /api/productos | 200, JSON, al menos 6 productos | 200 · application/json; charset=utf-8 · 8 productos | ✔ Cumple |
| 3 Pedido válido | POST 2×producto 1 + 1×producto 2 | 201, total 26500, +1 pedido y +2 detalles | 201 · id 1 · total 26500 · pedidos 0→1, detalles 0→2 | ✔ Cumple |
| 4a Nombre vacío | nombre "   " | 400 con explicación; sin registros nuevos | 400 · "Los datos del pedido no son válidos." ["El nombre es obligatorio."] · pedidos 1→1, detalles 2→2 | ✔ Cumple |
| 4b Correo vacío | correo "" | 400 con explicación; sin registros nuevos | 400 · "Los datos del pedido no son válidos." ["El correo es obligatorio."] · pedidos 1→1, detalles 2→2 | ✔ Cumple |
| 5 Carrito vacío | items [] | 400 con explicación; sin registros nuevos | 400 · "Los datos del pedido no son válidos." ["El pedido debe contener al menos un producto."] · pedidos 1→1, detalles 2→2 | ✔ Cumple |
| 6 Cantidad 0 | cantidad 0 | 400 con explicación; sin registros nuevos | 400 · "Los datos del pedido no son válidos." ["Producto 1: la cantidad debe ser un número entero positivo."] · pedidos 1→1, detalles 2→2 | ✔ Cumple |
| 6 Cantidad -3 | cantidad -3 | 400 con explicación; sin registros nuevos | 400 · "Los datos del pedido no son válidos." ["Producto 1: la cantidad debe ser un número entero positivo."] · pedidos 1→1, detalles 2→2 | ✔ Cumple |
| 6 Cantidad 1.5 | cantidad 1.5 | 400 con explicación; sin registros nuevos | 400 · "Los datos del pedido no son válidos." ["Producto 1: la cantidad debe ser un número entero positivo."] · pedidos 1→1, detalles 2→2 | ✔ Cumple |
| 6 Cantidad "2" | cantidad "2" | 400 con explicación; sin registros nuevos | 400 · "Los datos del pedido no son válidos." ["Producto 1: la cantidad debe ser un número entero positivo."] · pedidos 1→1, detalles 2→2 | ✔ Cumple |
| 6 Repetidos > 999 | producto 1 dos veces con 999 | 400 con explicación; sin registros nuevos | 400 · "Los datos del pedido no son válidos." ["El producto 1 suma 1998 unidades; el máximo por producto es 999."] · pedidos 1→1, detalles 2→2 | ✔ Cumple |
| 7 Producto inválido | producto 1 (válido) + producto 999 | 400 con explicación; sin registros nuevos | 400 · "El pedido incluye productos que no existen." ["El producto con id 999 no existe."] · pedidos 1→1, detalles 2→2 | ✔ Cumple |
| 8 Total alterado | total 1 y precio 10 enviados por el cliente | 201 con total 12000 (precio de SQLite) | 201 · total 12000 · precio_unitario 12000 | ✔ Cumple |
| 9a Persistencia | reiniciar servidor y GET /api/pedidos | pedido 1 con sus 2 detalles | 200 · 2 pedidos · pedido 1: 2 detalles, total 26500 | ✔ Cumple |
| 9b Producto inexistente | GET /api/productos/999 | 404 con JSON | 404 · "No existe un producto con id 999." | ✔ Cumple |
| Extra JSON inválido | cuerpo mal formado | 400 | 400 · El cuerpo no contiene JSON válido. | ✔ Cumple |
| Extra Content-Type | sin application/json | 415 | 415 · El cuerpo debe enviarse con Content-Type: application/json. | ✔ Cumple |
| Extra Repetidos agrupados | producto 2 con cantidad 1 y luego 2 | 201 con un solo detalle de 3 unidades (total 7500) | 201 · 1 detalle · cantidad 3 · total 7500 | ✔ Cumple |
| Extra Método no permitido | DELETE /api/pedidos | 405 con JSON | 405 · El método DELETE no está permitido en /api/pedidos. | ✔ Cumple |

**18/18 comprobaciones correctas.** En cada rechazo, el conteo de pedidos y detalles es igual antes y después, es decir, no quedó ningún pedido ni detalle parcial.

## 3. Verificaciones adicionales

| Comprobación | Resultado |
|---|---|
| Transacción: se forzó un detalle con `producto_id` inexistente dentro de `enTransaccion` | SQLite respondió `FOREIGN KEY constraint failed`; tras el `ROLLBACK` la tabla `pedidos` siguió con 0 filas. Aunque una validación fallara, no quedan pedidos sin detalles. |
| Claves foráneas activas | `PRAGMA foreign_keys = ON` en `repositories/db.js`, demostrado por el error anterior. |
| Rechazo con total alterado y producto inexistente después de reiniciar | 400 y la base sigue con 1 pedido y 2 detalles (ver `respuestas_api.txt`). |
| Ruta de la API inexistente (`GET /api/clientes`) | 404 con JSON. |
| Intento de leer archivos fuera de `public/` (`/js/../../server_rutas.js`) | 404. |

> Para la sustentación conviene repetir el caso 3 con la pestaña **Red** abierta (F12) y mostrar la solicitud `POST /api/pedidos` con su respuesta 201, y luego un rechazo desde la consola (ver `GUION_SUSTENTACION.md`).
