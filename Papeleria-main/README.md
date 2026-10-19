# Papelería La Libreta

Primera versión de una tienda web académica de útiles escolares y de oficina. Permite **consultar el catálogo, organizar un carrito y registrar un pedido simulado** (no se realiza ningún cobro) y luego consultar los pedidos guardados.

Práctica integradora del 20 % — Ingeniería Web, Universidad Cooperativa de Colombia. Docente: Luis Miguel Gómez Meneses.

**Integrantes:**

- Jeremy Rentería
- Anwar Palacio

Aportes de cada integrante: [docs/APORTES.md](docs/APORTES.md).

## Requisitos

- **Node.js 24.11.0 o superior** (usa el módulo nativo `node:sqlite`).
- No hay dependencias externas: no se necesita `npm install`.

## Instalación y arranque

```bash
git clone <url-del-repositorio>
cd <carpeta-del-repositorio>
npm start
```

Abrir **http://localhost:3000**. Para detener el servidor: `Ctrl + C` en la terminal.

> **Windows / PowerShell:** si aparece «npm.ps1 no se puede cargar… la ejecución de scripts está deshabilitada», usar `npm.cmd start`, o `node server_rutas.js`, o abrir una terminal **Command Prompt**. En VS Code también se puede arrancar con **Ejecutar y depurar → Node.js** teniendo abierto `server_rutas.js`.

Otros comandos:

| Comando | Para qué sirve |
|---|---|
| `npm start` | Inicia el servidor en el puerto 3000 (`PORT=4000 npm start` para cambiarlo). |
| `npm run reset-db` | Borra la base y la recrea solo con los productos iniciales (con el servidor detenido). |
| `npm run probar` | Ejecuta las pruebas de aceptación de la API con una base temporal y muestra la tabla de resultados. |

## Datos iniciales

No se versiona ningún archivo `.db` (está en `.gitignore` porque guarda nombres y correos). Al arrancar, `repositories/db.js`:

1. crea `data/tienda.db` si no existe,
2. ejecuta `data/schema.sql` (tablas `productos`, `pedidos`, `detalle_pedido`),
3. si `productos` está vacía, carga `data/seed.sql` (8 productos ficticios).

Los ids 1 y 2 son el cuaderno de 12 000 COP y el bolígrafo de 2 500 COP del ejemplo del enunciado.

## Funcionalidades

| Página | Ruta | Qué hace |
|---|---|---|
| Catálogo | `/` | Muestra los productos obtenidos con `fetch('/api/productos')` y permite agregarlos al carrito. |
| Carrito | `/carrito` | Cambia cantidades, retira productos, muestra subtotales y total provisional, pide nombre y correo, registra el pedido y muestra la confirmación del servidor. |
| Pedidos | `/pedidos` | Lista los pedidos guardados (id, comprador, fecha, total y productos con cantidades). |

Las tres páginas muestran estados de carga, ausencia de registros y error.

## Decisiones del proyecto

- **Moneda:** pesos colombianos enteros; todos los productos tienen precio positivo.
- **Carrito en `localStorage`:** se conserva al cerrar la pestaña. Solo guarda `producto_id` y `cantidad`; nombres y precios se consultan a la API.
- **Vistas como páginas separadas** (`/`, `/carrito`, `/pedidos`); la confirmación es una sección de la página del carrito.
- **Productos repetidos en un pedido:** se **agrupan** sumando sus cantidades; se guarda un solo detalle por producto (`UNIQUE (pedido_id, producto_id)`).
- **Precios y total los calcula el servidor** con los precios de SQLite; cualquier `total` o `precio` enviado por el navegador se ignora. `precio_unitario` guarda el precio usado al comprar.
- **Cantidad máxima** por producto: 999, también después de agrupar repetidos (evita totales absurdos).
- **Correo:** el formulario usa `type="email"`; el servidor exige que no esté vacío y que tenga la forma `algo@dominio.ext`.
- El carrito se vacía **solo** después de una respuesta 201.
- Información **ficticia** y ejecución **local**. Sin pagos, cuentas, envíos, inventario ni panel administrativo.

## Estructura (MVC en capas)

```
server_rutas.js            Arranque: abre la base, inicia el servidor y delega
routes/index.js            Tabla de rutas: elige la acción del controlador
controllers/               Interpretan HTTP y eligen código y formato
  http.js                    enviarJSON, leerCuerpoJSON (415, 413, 400)
  productosController.js
  pedidosController.js
  paginasController.js       vistas HTML y archivos estáticos
models/                    Reglas de negocio
  pedidoModel.js             validación, agrupación y cálculo del total
  productoModel.js
  errores.js                 ErrorValidacion → 400
repositories/              Acceso a datos (consultas parametrizadas)
  db.js                      conexión, esquema, datos iniciales, enTransaccion
  productosRepository.js
  pedidosRepository.js
views/                     catalogo.html, carrito.html, pedidos.html
public/                    css/, js/ (fetch y carrito), img/
data/                      schema.sql, seed.sql  (tienda.db se genera)
scripts/                   probar_api.js, reiniciar_db.js
docs/                      OOHDM, arquitectura, API, pruebas, aportes, guion
```

El controlador usa el modelo y el modelo usa el repositorio; el repositorio nunca construye respuestas HTTP. Detalle y diagrama en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

## API

| Método | Ruta | Entrada | Salida | Estados |
|---|---|---|---|---|
| GET | `/api/productos` | — | Arreglo de productos | 200 |
| GET | `/api/productos/:id` | id en la ruta | Un producto | 200 · 404 |
| POST | `/api/pedidos` | JSON `{ nombre, correo, items: [{ producto_id, cantidad }] }` | Pedido creado con id, fecha, total y detalles | 201 · 400 · 413 · 415 · 500 |
| GET | `/api/pedidos` | — | Arreglo de pedidos con detalles (`[]` si no hay) | 200 |
| GET | `/api/pedidos/:id` | id en la ruta | Un pedido con detalles | 200 · 404 |

Los errores también son JSON: `{ "error": "…", "detalles": ["…"] }`.

**Solicitud**

```json
{"nombre":"Ana Ejemplo","correo":"ana@example.com",
 "items":[{"producto_id":1,"cantidad":2},{"producto_id":2,"cantidad":1}]}
```

**Respuesta 201**

```json
{"id":1,"nombre":"Ana Ejemplo","correo":"ana@example.com","fecha":"2026-10-15 18:49:02","total":26500,
 "detalles":[{"producto_id":1,"nombre":"Cuaderno argollado","cantidad":2,"precio_unitario":12000,"subtotal":24000},
             {"producto_id":2,"nombre":"Bolígrafo de gel","cantidad":1,"precio_unitario":2500,"subtotal":2500}]}
```

Contrato completo, reglas y ejemplo con `fetch`: [docs/CONTRATO_API.md](docs/CONTRATO_API.md).

### Por qué una API HTTP orientada a recursos (REST, SOAP y GraphQL)

La tienda expone **recursos** —productos y pedidos— identificados por URL (`/api/productos/1`) y manipulados con los métodos estándar de HTTP: `GET` para consultar y `POST` para crear. Los códigos de estado (200, 201, 400, 404) comunican el resultado sin inventar un protocolo propio, y JSON es el formato que `fetch` y JavaScript procesan de forma nativa. Este estilo **REST** encaja con un CRUD pequeño, se prueba con el navegador o `curl` y no necesita librerías. **SOAP** es un protocolo basado en mensajes XML con sobre (envelope) y un contrato formal **WSDL**; aporta tipado estricto y estándares WS-* útiles en integraciones empresariales, pero sería excesivo aquí. **GraphQL** usa normalmente un único endpoint donde el cliente describe con una consulta exactamente qué campos quiere; es útil cuando hay muchos clientes con necesidades distintas o datos muy relacionados, pero exige un esquema y un intérprete de consultas que esta versión no justifica.

## OOHDM

Diseño conceptual, navegacional, interfaz abstracta (bocetos en `docs/bocetos/`) e implementación: [docs/OOHDM.md](docs/OOHDM.md).

## Pruebas

Los 9 casos de aceptación, con entrada, esperado, observado y evidencia: [docs/PRUEBAS.md](docs/PRUEBAS.md). Capturas en `docs/evidencias/`.
