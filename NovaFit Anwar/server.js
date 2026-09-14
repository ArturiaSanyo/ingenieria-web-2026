const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = 3000;
const database = new DatabaseSync(path.join(__dirname, 'gimnasio.db'));

database.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo TEXT NOT NULL,
    telefono TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS afiliaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    plan TEXT NOT NULL,
    horario TEXT NOT NULL,
    fecha_inicio TEXT NOT NULL
  );
`);

const insertUsuario = database.prepare(
  'INSERT INTO usuarios (nombre, correo, telefono) VALUES (?, ?, ?)'
);
const insertAfiliacion = database.prepare(
  'INSERT INTO afiliaciones (usuario_id, plan, horario, fecha_inicio) VALUES (?, ?, ?, ?)'
);
const findUsuario = database.prepare('SELECT id FROM usuarios WHERE id = ?');

function send(res, status, contentType, body) {
  res.writeHead(status, {'Content-Type': contentType});
  res.end(body);
}

function page(title, message, link='/') {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><link rel="stylesheet" href="/styles.css"></head><body><header><h1>NovaFit</h1><p>Resultado de la operación</p></header><main><section class="content"><h2>${title}</h2><p>${message}</p><a class="button" href="${link}">Continuar</a></section></main><footer><p>NovaFit · Ingeniería Web</p></footer></body></html>`;
}

function valid(values) {
  return values.every(value => value !== undefined && value.trim() !== '');
}

const server = http.createServer(async (req, res) => {
  try {
    console.log(`${req.method} ${req.url}`);

    if (req.method === 'GET') {
      const routes = {
        '/': 'index.html',
        '/acerca': 'acerca.html',
        '/registro': 'registro.html',
        '/servicios': 'servicios.html'
      };
      if (req.url === '/styles.css') {
        return send(res, 200, 'text/css; charset=utf-8', fs.readFileSync(path.join(__dirname, 'styles.css')));
      }
      if (routes[req.url]) {
        return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(__dirname, routes[req.url])));
      }
      return send(res, 404, 'text/html; charset=utf-8', page('404', 'La ruta solicitada no existe.'));
    }

    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const data = new URLSearchParams(body);

      if (req.url === '/usuarios') {
        const nombre = (data.get('nombre') || '').trim();
        const correo = (data.get('correo') || '').trim();
        const telefono = (data.get('telefono') || '').trim();
        if (!valid([nombre, correo, telefono])) {
          return send(res, 400, 'text/html; charset=utf-8', page('Datos incompletos', 'Todos los campos del registro son obligatorios.', '/registro'));
        }
        const result = insertUsuario.run(nombre, correo, telefono);
        const id = Number(result.lastInsertRowid);
        console.log(`Usuario creado con ID: ${id}`);
        return send(res, 201, 'text/html; charset=utf-8', page('Registro exitoso', `Tu usuario fue registrado correctamente. Tu ID es <strong>${id}</strong>. Guárdalo para registrar una afiliación.`, '/servicios'));
      }

      if (req.url === '/afiliaciones') {
        const usuario_id = (data.get('usuario_id') || '').trim();
        const plan = (data.get('plan') || '').trim();
        const horario = (data.get('horario') || '').trim();
        const fecha_inicio = (data.get('fecha_inicio') || '').trim();
        if (!valid([usuario_id, plan, horario, fecha_inicio]) || !/^\d+$/.test(usuario_id)) {
          return send(res, 400, 'text/html; charset=utf-8', page('Datos incompletos', 'Verifica todos los campos de la afiliación.', '/servicios'));
        }
        if (!findUsuario.get(Number(usuario_id))) {
          return send(res, 400, 'text/html; charset=utf-8', page('Usuario no encontrado', 'El ID indicado no pertenece a un usuario registrado.', '/servicios'));
        }
        const result = insertAfiliacion.run(Number(usuario_id), plan, horario, fecha_inicio);
        const id = Number(result.lastInsertRowid);
        console.log(`Afiliación creada con ID: ${id}`);
        return send(res, 201, 'text/html; charset=utf-8', page('Afiliación exitosa', `La afiliación fue registrada correctamente con el ID <strong>${id}</strong>.`, '/'));
      }
    }

    send(res, 404, 'text/html; charset=utf-8', page('404', 'La ruta solicitada no existe.'));
  } catch (error) {
    console.error(error);
    send(res, 500, 'text/html; charset=utf-8', page('Error interno', 'Ocurrió un error controlado en el servidor.'));
  }
});

server.listen(PORT, () => console.log(`NovaFit ejecutándose en http://localhost:${PORT}`));