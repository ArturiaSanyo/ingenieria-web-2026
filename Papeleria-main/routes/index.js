// Enrutador: según método y ruta, selecciona la acción del controlador.
// También centraliza la traducción de errores no controlados a HTTP.

const productosController = require('../controllers/productosController');
const pedidosController = require('../controllers/pedidosController');
const paginasController = require('../controllers/paginasController');
const { ErrorHttp, enviarError } = require('../controllers/http');

// Tabla de rutas: [método, patrón, acción]. ":nombre" captura un segmento.
const rutas = [
  // API de productos
  ['GET', '/api/productos', productosController.listar],
  ['GET', '/api/productos/:id', productosController.obtener],
  // API de pedidos
  ['GET', '/api/pedidos', pedidosController.listar],
  ['POST', '/api/pedidos', pedidosController.crear],
  ['GET', '/api/pedidos/:id', pedidosController.obtener],
  // Vistas
  ['GET', '/', paginasController.vista('catalogo')],
  ['GET', '/carrito', paginasController.vista('carrito')],
  ['GET', '/pedidos', paginasController.vista('pedidos')],
  // Recursos estáticos
  ['GET', '/css/*', paginasController.estatico],
  ['GET', '/js/*', paginasController.estatico],
  ['GET', '/img/*', paginasController.estatico]
];

function coincidir(patron, ruta) {
  if (patron.endsWith('/*')) {
    const prefijo = patron.slice(0, -1); // "/css/"
    return ruta.startsWith(prefijo) ? { ruta: ruta.slice(1) } : null;
  }
  const partesPatron = patron.split('/');
  const partesRuta = ruta.split('/');
  if (partesPatron.length !== partesRuta.length) return null;

  const parametros = {};
  for (let i = 0; i < partesPatron.length; i++) {
    if (partesPatron[i].startsWith(':')) {
      parametros[partesPatron[i].slice(1)] = decodificar(partesRuta[i]);
    } else if (partesPatron[i] !== partesRuta[i]) {
      return null;
    }
  }
  return parametros;
}

async function manejarSolicitud(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  const ruta = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const esApi = ruta === '/api' || ruta.startsWith('/api/');

  try {
    let rutaExiste = false;
    for (const [metodo, patron, accion] of rutas) {
      const parametros = coincidir(patron, ruta);
      if (!parametros) continue;
      rutaExiste = true;
      if (metodo === req.method) {
        await accion(req, res, parametros);
        return;
      }
    }

    if (rutaExiste) {
      res.setHeader('Allow', permitidos(ruta).join(', '));
      enviarError(res, 405, `El método ${req.method} no está permitido en ${ruta}.`);
    } else if (esApi) {
      enviarError(res, 404, `La ruta ${ruta} no existe en la API.`);
    } else {
      paginasController.noEncontrado(res);
    }
  } catch (error) {
    if (res.headersSent) {
      res.end();
      return;
    }
    if (error instanceof ErrorHttp) {
      enviarError(res, error.estado, error.message);
      return;
    }
    console.error('[error interno]', error);
    enviarError(res, 500, 'Ocurrió un error interno en el servidor. Intenta de nuevo.');
  }
}

function decodificar(texto) {
  try {
    return decodeURIComponent(texto);
  } catch {
    return texto;
  }
}

function permitidos(ruta) {
  return rutas.filter(([, patron]) => coincidir(patron, ruta)).map(([metodo]) => metodo);
}

module.exports = { manejarSolicitud };
