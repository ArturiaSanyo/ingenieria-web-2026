// Utilidades HTTP compartidas por los controladores:
// enviar JSON y leer un cuerpo JSON con sus validaciones de protocolo.

const TAMANO_MAXIMO_CUERPO = 100 * 1024; // 100 KB

// Error con código HTTP (415, 413, 400 por JSON mal formado, 404...).
class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

function enviarJSON(res, estado, datos) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
    'Cache-Control': 'no-store'
  });
  res.end(cuerpo);
}

function enviarError(res, estado, mensaje, detalles) {
  const datos = { error: mensaje };
  if (detalles && detalles.length > 0) datos.detalles = detalles;
  enviarJSON(res, estado, datos);
}

// Lee el cuerpo completo y lo interpreta como JSON.
function leerCuerpoJSON(req) {
  return new Promise((resolver, rechazar) => {
    const tipo = (req.headers['content-type'] || '').toLowerCase();
    if (!tipo.startsWith('application/json')) {
      req.resume(); // descarta el cuerpo
      rechazar(new ErrorHttp(415, 'El cuerpo debe enviarse con Content-Type: application/json.'));
      return;
    }

    const partes = [];
    let tamano = 0;
    let excedido = false;

    req.on('data', (parte) => {
      tamano += parte.length;
      if (tamano > TAMANO_MAXIMO_CUERPO) excedido = true;
      else partes.push(parte);
    });

    req.on('end', () => {
      if (excedido) {
        rechazar(new ErrorHttp(413, 'El cuerpo de la solicitud es demasiado grande.'));
        return;
      }
      const texto = Buffer.concat(partes).toString('utf8');
      try {
        resolver(JSON.parse(texto));
      } catch {
        rechazar(new ErrorHttp(400, 'El cuerpo no contiene JSON válido.'));
      }
    });

    req.on('error', rechazar);
  });
}

module.exports = { ErrorHttp, enviarJSON, enviarError, leerCuerpoJSON };
