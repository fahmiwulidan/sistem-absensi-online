// Global error handler middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Data sudah ada (duplikat)' });
  }
  
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ error: 'Referensi data tidak valid' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Terjadi kesalahan pada server',
  });
}

// Not found handler
function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} tidak ditemukan` });
}

module.exports = { errorHandler, notFound };
