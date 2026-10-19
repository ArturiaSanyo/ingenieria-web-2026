// Pruebas de aceptación de la API (casos 1 y 3 a 9 del enunciado).
// El caso 2 (carrito) se prueba en el navegador; ver docs/PRUEBAS.md.
//
// Uso: npm run probar
// Levanta su propio servidor en el puerto 3100 con una base temporal,
// así no modifica data/tienda.db. Para el caso 9 detiene y vuelve a iniciar ese servidor.

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PUERTO = 3100;
const BASE = `http://localhost:${PUERTO}`;
const DB_PRUEBA = path.join(os.tmpdir(), `tienda-prueba-${Date.now()}.db`);
const RAIZ = path.join(__dirname, '..');

const resultados = [];
let servidor;

function iniciarServidor() {
  return new Promise((resolver, rechazar) => {
    servidor = spawn(process.execPath, ['--no-warnings', 'server_rutas.js'], {
      cwd: RAIZ,
      env: { ...process.env, PORT: String(PUERTO), DB_PATH: DB_PRUEBA }
    });
    servidor.stdout.on('data', (d) => d.toString().includes('http://localhost') && resolver());
    servidor.stderr.on('data', (d) => process.stderr.write(d));
    servidor.on('error', rechazar);
  });
}

function detenerServidor() {
  return new Promise((resolver) => {
    servidor.once('exit', resolver);
    servidor.kill('SIGTERM');
  });
}

// Consulta directa a SQLite (fuera del servidor) para comprobar registros.
function contarRegistros() {
  const db = new DatabaseSync(DB_PRUEBA, { readOnly: true });
  const pedidos = db.prepare('SELECT COUNT(*) AS n FROM pedidos').get().n;
  const detalles = db.prepare('SELECT COUNT(*) AS n FROM detalle_pedido').get().n;
  db.close();
  return { pedidos, detalles };
}

async function pedir(metodo, ruta, cuerpo) {
  const opciones = { method: metodo, headers: {} };
  if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }
  const r = await fetch(BASE + ruta, opciones);
  return { estado: r.status, tipo: r.headers.get('content-type'), datos: await r.json() };
}

function registrar(caso, entrada, esperado, observado, ok) {
  resultados.push({ caso, entrada, esperado, observado, ok });
  console.log(`${ok ? '✔' : '✘'} ${caso}: ${observado}`);
}

// Envía un pedido que debe ser rechazado y verifica 400 sin registros nuevos.
async function casoRechazo(caso, entrada, cuerpo) {
  const antes = contarRegistros();
  const r = await pedir('POST', '/api/pedidos', cuerpo);
  const despues = contarRegistros();
  const sinCambios = antes.pedidos === despues.pedidos && antes.detalles === despues.detalles;
  registrar(
    caso,
    entrada,
    '400 con explicación; sin registros nuevos',
    `${r.estado} · "${r.datos.error}" ${r.datos.detalles ? JSON.stringify(r.datos.detalles) : ''} · ` +
      `pedidos ${antes.pedidos}→${despues.pedidos}, detalles ${antes.detalles}→${despues.detalles}`,
    r.estado === 400 && sinCambios
  );
}

async function main() {
  await iniciarServidor();

  // Caso 1: catálogo
  const productos = await pedir('GET', '/api/productos');
  registrar(
    '1 Catálogo',
    'GET /api/productos',
    '200, JSON, al menos 6 productos',
    `${productos.estado} · ${productos.tipo} · ${productos.datos.length} productos`,
    productos.estado === 200 && productos.tipo.includes('application/json') && productos.datos.length >= 6
  );

  // Caso 3: pedido válido (ejemplo del enunciado)
  const antes = contarRegistros();
  const valido = await pedir('POST', '/api/pedidos', {
    nombre: 'Ana Ejemplo',
    correo: 'ana@example.com',
    items: [
      { producto_id: 1, cantidad: 2 },
      { producto_id: 2, cantidad: 1 }
    ]
  });
  const despues = contarRegistros();
  registrar(
    '3 Pedido válido',
    'POST 2×producto 1 + 1×producto 2',
    '201, total 26500, +1 pedido y +2 detalles',
    `${valido.estado} · id ${valido.datos.id} · total ${valido.datos.total} · ` +
      `pedidos ${antes.pedidos}→${despues.pedidos}, detalles ${antes.detalles}→${despues.detalles}`,
    valido.estado === 201 &&
      valido.datos.total === 26500 &&
      despues.pedidos === antes.pedidos + 1 &&
      despues.detalles === antes.detalles + 2
  );

  const item = [{ producto_id: 1, cantidad: 1 }];

  // Caso 4: datos del comprador
  await casoRechazo('4a Nombre vacío', 'nombre "   "', { nombre: '   ', correo: 'a@b.co', items: item });
  await casoRechazo('4b Correo vacío', 'correo ""', { nombre: 'Ana', correo: '', items: item });

  // Caso 5: carrito vacío
  await casoRechazo('5 Carrito vacío', 'items []', { nombre: 'Ana', correo: 'a@b.co', items: [] });

  // Caso 6: cantidades inválidas
  for (const cantidad of [0, -3, 1.5, '2']) {
    await casoRechazo(`6 Cantidad ${JSON.stringify(cantidad)}`, `cantidad ${JSON.stringify(cantidad)}`, {
      nombre: 'Ana',
      correo: 'a@b.co',
      items: [{ producto_id: 1, cantidad }]
    });
  }

  // Caso 6 (complemento): repetidos que al agruparse superan el máximo por producto
  await casoRechazo('6 Repetidos > 999', 'producto 1 dos veces con 999', {
    nombre: 'Ana',
    correo: 'a@b.co',
    items: [
      { producto_id: 1, cantidad: 999 },
      { producto_id: 1, cantidad: 999 }
    ]
  });

  // Caso 7: producto inexistente junto a uno válido
  await casoRechazo('7 Producto inválido', 'producto 1 (válido) + producto 999', {
    nombre: 'Ana',
    correo: 'a@b.co',
    items: [
      { producto_id: 1, cantidad: 1 },
      { producto_id: 999, cantidad: 1 }
    ]
  });

  // Caso 8: total y precio alterados por el cliente
  const alterado = await pedir('POST', '/api/pedidos', {
    nombre: 'Ana',
    correo: 'a@b.co',
    total: 1,
    items: [{ producto_id: 1, cantidad: 1, precio: 10, precio_unitario: 10, subtotal: 10 }]
  });
  registrar(
    '8 Total alterado',
    'total 1 y precio 10 enviados por el cliente',
    '201 con total 12000 (precio de SQLite)',
    `${alterado.estado} · total ${alterado.datos.total} · precio_unitario ${alterado.datos.detalles[0].precio_unitario}`,
    alterado.estado === 201 && alterado.datos.total === 12000 && alterado.datos.detalles[0].precio_unitario === 12000
  );

  // Caso 9: persistencia tras reiniciar + 404
  const idGuardado = valido.datos.id;
  await detenerServidor();
  await iniciarServidor();
  const lista = await pedir('GET', '/api/pedidos');
  const recuperado = lista.datos.find((p) => p.id === idGuardado);
  registrar(
    '9a Persistencia',
    `reiniciar servidor y GET /api/pedidos`,
    `pedido ${idGuardado} con sus 2 detalles`,
    `${lista.estado} · ${lista.datos.length} pedidos · pedido ${idGuardado}: ` +
      (recuperado ? `${recuperado.detalles.length} detalles, total ${recuperado.total}` : 'no encontrado'),
    lista.estado === 200 && !!recuperado && recuperado.detalles.length === 2
  );
  const noExiste = await pedir('GET', '/api/productos/999');
  registrar(
    '9b Producto inexistente',
    'GET /api/productos/999',
    '404 con JSON',
    `${noExiste.estado} · "${noExiste.datos.error}"`,
    noExiste.estado === 404
  );

  // Extras de protocolo que el enunciado pide conservar
  const malJson = await fetch(`${BASE}/api/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"nombre": "Ana",'
  });
  registrar('Extra JSON inválido', 'cuerpo mal formado', '400', `${malJson.status} · ${(await malJson.json()).error}`, malJson.status === 400);
  const sinTipo = await fetch(`${BASE}/api/pedidos`, { method: 'POST', body: 'nombre=Ana' });
  registrar('Extra Content-Type', 'sin application/json', '415', `${sinTipo.status} · ${(await sinTipo.json()).error}`, sinTipo.status === 415);

  // Repetidos válidos: se agrupan en un solo detalle (decisión documentada)
  const repetidos = await pedir('POST', '/api/pedidos', {
    nombre: 'Ana',
    correo: 'a@b.co',
    items: [
      { producto_id: 2, cantidad: 1 },
      { producto_id: 2, cantidad: 2 }
    ]
  });
  registrar(
    'Extra Repetidos agrupados',
    'producto 2 con cantidad 1 y luego 2',
    '201 con un solo detalle de 3 unidades (total 7500)',
    `${repetidos.estado} · ${repetidos.datos.detalles.length} detalle · cantidad ${repetidos.datos.detalles[0].cantidad} · total ${repetidos.datos.total}`,
    repetidos.estado === 201 && repetidos.datos.detalles.length === 1 && repetidos.datos.detalles[0].cantidad === 3 && repetidos.datos.total === 7500
  );

  const metodo = await fetch(`${BASE}/api/pedidos`, { method: 'DELETE' });
  registrar('Extra Método no permitido', 'DELETE /api/pedidos', '405 con JSON', `${metodo.status} · ${(await metodo.json()).error}`, metodo.status === 405);

  await detenerServidor();
  for (const sufijo of ['', '-journal', '-wal', '-shm']) fs.rmSync(DB_PRUEBA + sufijo, { force: true });

  const fallidos = resultados.filter((r) => !r.ok).length;
  console.log(`\n${resultados.length - fallidos}/${resultados.length} comprobaciones correctas.`);
  if (process.argv.includes('--markdown')) imprimirMarkdown();
  process.exitCode = fallidos === 0 ? 0 : 1;
}

function imprimirMarkdown() {
  console.log('\n| Caso | Entrada | Esperado | Observado | Resultado |\n|---|---|---|---|---|');
  for (const r of resultados) {
    const celda = (t) => String(t).replaceAll('|', '\\|');
    console.log(`| ${celda(r.caso)} | ${celda(r.entrada)} | ${celda(r.esperado)} | ${celda(r.observado)} | ${r.ok ? '✔ Cumple' : '✘ Falla'} |`);
  }
}

main().catch(async (error) => {
  console.error(error);
  if (servidor) servidor.kill();
  process.exitCode = 1;
});
