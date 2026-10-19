# Contrato de la API

Base: `http://localhost:3000`. Todas las respuestas de `/api/...` son JSON (`application/json; charset=utf-8`), incluidos los errores, que tienen la forma:

```json
{ "error": "Mensaje comprensible", "detalles": ["opcional", "lista de problemas"] }
```

## Endpoints

| Método | Ruta | Entrada | Salida | Estados |
|---|---|---|---|---|
| GET | `/api/productos` | — | Arreglo de productos `{ id, nombre, descripcion, precio }` | 200 |
| GET | `/api/productos/:id` | `id` en la ruta | Un producto | 200 · 404 si no existe |
| POST | `/api/pedidos` | JSON `{ nombre, correo, items: [{ producto_id, cantidad }] }` | Pedido creado con `id`, `fecha`, `total` y `detalles` | 201 · 400 datos inválidos o JSON mal formado · 413 cuerpo > 100 KB · 415 sin `Content-Type: application/json` · 500 error interno |
| GET | `/api/pedidos` | — | Arreglo de pedidos con `detalles` (`[]` si no hay), del más reciente al más antiguo | 200 |
| GET | `/api/pedidos/:id` | `id` en la ruta | Un pedido con detalles (ruta adicional, usada en el encabezado `Location`) | 200 · 404 |

Otras respuestas: método no permitido en una ruta existente → **405** con encabezado `Allow`; ruta de la API inexistente → **404**.

## Reglas de validación de `POST /api/pedidos`

- `nombre` y `correo`: texto obligatorio después de `trim()`. `correo` además debe tener forma `algo@dominio.ext`. Máximo 100 y 254 caracteres.
- `items`: arreglo con al menos un elemento.
- `producto_id`: entero positivo que exista en `productos`.
- `cantidad`: número entero positivo (máximo 999). `"2"` (texto), `0`, `-1` o `1.5` se rechazan.
- **Repetidos:** si el mismo `producto_id` llega varias veces, se **agrupan** sumando cantidades (un solo detalle por producto). La suma tampoco puede pasar de 999.
- Campos extra como `total`, `precio` o `subtotal` se **ignoran**: el servidor usa los precios de SQLite.
- Si algo falla → **400** y no se guarda nada (validación previa + transacción).
- `id` y `fecha` los asigna la base de datos.

## Ejemplo de solicitud

```http
POST /api/pedidos
Content-Type: application/json

{
  "nombre": "Ana Ejemplo",
  "correo": "ana@example.com",
  "items": [
    { "producto_id": 1, "cantidad": 2 },
    { "producto_id": 2, "cantidad": 1 }
  ]
}
```

### Respuesta 201

```http
HTTP/1.1 201 Created
Location: /api/pedidos/1
Content-Type: application/json; charset=utf-8
```

```json
{
  "id": 1,
  "nombre": "Ana Ejemplo",
  "correo": "ana@example.com",
  "fecha": "2026-10-15 18:49:02",
  "total": 26500,
  "detalles": [
    { "producto_id": 1, "nombre": "Cuaderno argollado", "cantidad": 2, "precio_unitario": 12000, "subtotal": 24000 },
    { "producto_id": 2, "nombre": "Bolígrafo de gel", "cantidad": 1, "precio_unitario": 2500, "subtotal": 2500 }
  ]
}
```

### Respuesta 400

```json
{
  "error": "Los datos del pedido no son válidos.",
  "detalles": [
    "El nombre es obligatorio.",
    "Producto 1: la cantidad debe ser un número entero positivo."
  ]
}
```

## Ejemplo con `fetch`

```js
const respuesta = await fetch('/api/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Ana Ejemplo',
    correo: 'ana@example.com',
    items: [{ producto_id: 1, cantidad: 2 }, { producto_id: 2, cantidad: 1 }]
  })
});
const datos = await respuesta.json();
if (!respuesta.ok) console.error(datos.error, datos.detalles);
else console.log('Pedido', datos.id, 'total', datos.total);
```

## Ejemplos con `curl` (PowerShell: usar `curl.exe`)

```bash
curl -i http://localhost:3000/api/productos
curl -i http://localhost:3000/api/productos/999
curl -i http://localhost:3000/api/pedidos
curl -i -X POST http://localhost:3000/api/pedidos -H "Content-Type: application/json" \
  -d '{"nombre":"Ana Ejemplo","correo":"ana@example.com","items":[{"producto_id":1,"cantidad":2},{"producto_id":2,"cantidad":1}]}'
```
