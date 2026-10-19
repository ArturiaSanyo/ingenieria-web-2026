# Aportes de los integrantes

**Equipo:** Jeremy Rentería · Anwar Palacio

| Integrante | Aportes principales | Archivos de referencia |
|---|---|---|
| Jeremy Rentería | **Backend y datos.** Esquema SQLite con sus tres tablas, claves foráneas y datos iniciales; capa de acceso a datos con consultas parametrizadas y la función `enTransaccion`; modelo de pedidos (validaciones obligatorias, agrupación de productos repetidos, cálculo del total con precios de SQLite); controladores y rutas de la API con sus códigos HTTP (200, 201, 400, 404, 405, 413, 415, 500); pruebas automáticas de los casos de aceptación; contrato de la API y esquema de arquitectura. | `data/`, `repositories/`, `models/`, `controllers/`, `routes/`, `server_rutas.js`, `scripts/`, `docs/CONTRATO_API.md`, `docs/ARQUITECTURA.md` |
| Anwar Palacio | **Frontend y diseño OOHDM.** Vistas de catálogo, carrito con formulario y confirmación, y consulta de pedidos; consumo de la API con `fetch`; carrito en `localStorage`; estados de carga, vacío y error; estilos y versión para pantallas pequeñas; diseño conceptual, navegacional e interfaz abstracta (diagramas y bocetos); recorrido de pruebas en el navegador y capturas de evidencia. | `views/`, `public/`, `docs/OOHDM.md`, `docs/bocetos/`, `docs/PRUEBAS.md`, `docs/evidencias/` |
| Ambos | README, revisión cruzada del código del otro, guion y preparación de la sustentación. | `README.md`, `docs/GUION_SUSTENTACION.md` |

