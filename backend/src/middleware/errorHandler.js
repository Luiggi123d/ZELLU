function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);

  const status = err.status || 500;
  const message = status === 500 ? 'Erro interno do servidor' : err.message;

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
