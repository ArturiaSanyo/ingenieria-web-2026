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
