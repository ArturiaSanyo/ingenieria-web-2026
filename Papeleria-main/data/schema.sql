-- Esquema de la tienda: tres tablas.
-- Se ejecuta al arrancar el servidor (CREATE TABLE IF NOT EXISTS no borra datos).

CREATE TABLE IF NOT EXISTS productos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT    NOT NULL,
  descripcion TEXT    NOT NULL,
  precio      INTEGER NOT NULL CHECK (precio > 0)          -- pesos colombianos enteros
);

CREATE TABLE IF NOT EXISTS pedidos (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,                -- lo asigna la base
  nombre TEXT    NOT NULL CHECK (length(trim(nombre)) > 0), -- datos del comprador
  correo TEXT    NOT NULL CHECK (length(trim(correo)) > 0), -- guardados en el pedido
  fecha  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')), -- la asigna la base
  total  INTEGER NOT NULL CHECK (total > 0)                -- calculado por el servidor
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id       INTEGER NOT NULL REFERENCES pedidos(id)   ON DELETE CASCADE,
  producto_id     INTEGER NOT NULL REFERENCES productos(id),
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario INTEGER NOT NULL CHECK (precio_unitario > 0), -- precio usado al comprar
  UNIQUE (pedido_id, producto_id)                           -- productos repetidos se agrupan
);

CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido ON detalle_pedido(pedido_id);
