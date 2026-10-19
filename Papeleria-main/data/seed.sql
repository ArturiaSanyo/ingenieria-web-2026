-- Datos iniciales (ficticios). Se cargan solo cuando la tabla productos está vacía.
-- Los ids 1 y 2 coinciden con el ejemplo del enunciado:
-- 2 cuadernos de 12 000 + 1 bolígrafo de 2 500 = 26 500 COP.

INSERT INTO productos (id, nombre, descripcion, precio) VALUES
  (1, 'Cuaderno argollado', 'Cuaderno de 100 hojas cuadriculadas, tapa dura y argolla doble.', 12000),
  (2, 'Bolígrafo de gel', 'Bolígrafo de tinta negra, punta fina de 0,7 mm y agarre de caucho.', 2500),
  (3, 'Set de resaltadores', 'Cuatro resaltadores pastel con punta biselada.', 9800),
  (4, 'Agenda 2027', 'Agenda semanal tamaño carta con calendario y páginas de notas.', 28000),
  (5, 'Lápices de colores', 'Caja con 24 lápices de colores de mina suave.', 18500),
  (6, 'Borrador y tajalápiz', 'Kit de borrador blanco y tajalápiz con depósito.', 3200),
  (7, 'Regla de 30 cm', 'Regla transparente de acrílico con escala en centímetros.', 2800),
  (8, 'Notas adhesivas', 'Bloque de 400 notas adhesivas de 7,5 × 7,5 cm en cuatro colores.', 7500);
