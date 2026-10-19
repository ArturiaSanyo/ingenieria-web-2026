// Controlador de interfaz: entrega las vistas HTML (views/) y los recursos estáticos (public/).

const fs = require('node:fs');
const path = require('node:path');

const CARPETA_VISTAS = path.join(__dirname, '..', 'views');
const CARPETA_PUBLICA = path.join(__dirname, '..', 'public');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function enviarArchivo(res, ruta) {
  fs.readFile(ruta, (error, contenido) => {
    if (error) {
      noEncontrado(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] || 'application/octet-stream' });
    res.end(contenido);
  });
}

// GET / , /carrito , /pedidos
function vista(nombre) {
  return (req, res) => enviarArchivo(res, path.join(CARPETA_VISTAS, `${nombre}.html`));
}

// GET /css/... , /js/... , /img/...
function estatico(req, res, parametros) {
  const ruta = path.normalize(path.join(CARPETA_PUBLICA, parametros.ruta));
  // Evita salir de public/ con rutas como /js/../../server_rutas.js
  if (!ruta.startsWith(CARPETA_PUBLICA + path.sep)) {
    noEncontrado(res);
    return;
  }
  enviarArchivo(res, ruta);
}

function noEncontrado(res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><meta charset="utf-8"><title>No encontrado</title>' +
    '<p>La página no existe. <a href="/">Volver al catálogo</a></p>');
}

module.exports = { vista, estatico, noEncontrado };
