// Error de reglas de negocio. El controlador lo traduce a HTTP 400.
class ErrorValidacion extends Error {
  constructor(mensaje, detalles = []) {
    super(mensaje);
    this.name = 'ErrorValidacion';
    this.detalles = detalles;
  }
}

module.exports = { ErrorValidacion };
