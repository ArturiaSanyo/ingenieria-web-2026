# NovaFit — Aplicación Web de Gimnasio

**Autor:** Anwar Joseph Palacios Bejarano  
**Asignatura:** Ingeniería Web  
**Temática:** Gimnasio

## Descripción
NovaFit es una aplicación web temática que permite registrar usuarios y después registrar una afiliación asociada al ID generado por SQLite.

## Tecnologías
HTML semántico, CSS, JavaScript, Node.js 24 o superior, HTTP, SQL y SQLite.

## Archivos
- `index.html`: página principal.
- `acerca.html`: información del proyecto.
- `registro.html`: formulario de usuarios.
- `servicios.html`: planes y formulario de afiliaciones.
- `styles.css`: estilos compartidos.
- `server.js`: servidor, rutas, validación y persistencia.
- `gimnasio.db`: base de datos creada automáticamente.
- `docs/oohdm/`: documentación OOHDM (modelos, diagramas y fuentes editables).

## Rutas
| Método | Ruta | Función | Estado |
|---|---|---|---|
| GET | `/` | Página principal | 200 |
| GET | `/acerca` | Página acerca de | 200 |
| GET | `/registro` | Formulario de registro | 200 |
| GET | `/servicios` | Formulario de afiliación | 200 |
| GET | `/styles.css` | Hoja de estilos | 200 |
| POST | `/usuarios` | Inserta un usuario y muestra su ID | 201 |
| POST | `/afiliaciones` | Inserta una afiliación asociada al usuario | 201 |
| Cualquier otra | — | Ruta inexistente | 404 |

## Modelo de datos
La base de datos se llama `gimnasio.db`.

### Tabla usuarios
- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `nombre TEXT NOT NULL`
- `correo TEXT NOT NULL`
- `telefono TEXT NOT NULL`

### Tabla afiliaciones
- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `usuario_id INTEGER NOT NULL`
- `plan TEXT NOT NULL`
- `horario TEXT NOT NULL`
- `fecha_inicio TEXT NOT NULL`

`usuario_id` conecta la afiliación con el usuario registrado.

## Ejecución
1. Instalar Node.js 24 o superior.
2. Abrir una terminal en la carpeta del proyecto.
3. Ejecutar:
   ```bash
   node server.js
   ```
4. Abrir `http://localhost:3000`.

La base de datos y sus tablas se crean automáticamente si no existen.

## Orden de uso
1. Entrar a Registro.
2. Completar nombre, correo y teléfono.
3. Copiar el ID mostrado.
4. Entrar a Servicios.
5. Introducir el ID, plan, horario y fecha de inicio.
6. Enviar el formulario y verificar la confirmación.

## Pruebas
- Navegación de las cuatro páginas.
- Carga independiente de `/styles.css`.
- Registro válido con respuesta 201.
- Afiliación válida con respuesta 201.
- Campos vacíos con respuesta 400.
- ID inexistente con respuesta 400.
- Ruta no definida con respuesta 404.
- Persistencia después de reiniciar el servidor.

## Evidencias

### ID generado y confirmación del registro
![Captura del ID generado](Capturas%20de%20pantalla/captura-registro-id.png)

### Confirmación de afiliación
![Captura de la confirmación de afiliación](Capturas%20de%20pantalla/captura-afiliacion-confirmacion.png)

### Base de datos SQLite
![Captura de gimnasio.db](Capturas%20de%20pantalla/captura-gimnasio-db.png)

### Terminal del servidor
![Captura de la terminal](Capturas%20de%20pantalla/captura-terminal.png)


## Documentación OOHDM
La aplicación se modeló con la metodología **OOHDM** en cuatro actividades, y cada modelo corresponde con el código real (rutas de `server.js`, formularios HTML y tablas de `gimnasio.db`).

Documento principal: [`docs/oohdm/OOHDM.md`](docs/oohdm/OOHDM.md) (incluye la matriz de correspondencia).

| Actividad | Qué representa en NovaFit | Diagrama |
|---|---|---|
| Diseño conceptual | Clases `Usuario` y `Afiliacion`, relación 1 a 0..* | [Ver](docs/oohdm/01_modelo_conceptual.png) |
| Diseño navegacional | Nodos `/`, `/acerca`, `/registro`, `/servicios` y respuestas | [Ver](docs/oohdm/02_modelo_navegacional.png) |
| Interfaz abstracta | Formularios de registro y afiliación | [Ver](docs/oohdm/03_interfaz_abstracta.png) |
| Implementación | Navegador, Node.js, rutas HTTP y SQLite | [Ver](docs/oohdm/04_implementacion.png) |

Los archivos editables (Graphviz `.dot`) están en [`docs/oohdm/fuentes_editables/`](docs/oohdm/fuentes_editables/).

![Modelo conceptual](docs/oohdm/01_modelo_conceptual.png)
![Modelo navegacional](docs/oohdm/02_modelo_navegacional.png)
![Interfaz abstracta](docs/oohdm/03_interfaz_abstracta.png)
![Implementación](docs/oohdm/04_implementacion.png)
