const express = require('express');
const cors = require('cors');
const path = require('path');
const { closeDatabase } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS (Mendukung lokal & domain frontend Vercel)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute Utama (Agar saat membuka URL backend di browser tidak 404)
app.get('/', (req, res) => {
  res.json({ message: 'Backend API Sistem Absensi Online Berhasil Berjalan!' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/parents', require('./routes/parents'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/attendances', require('./routes/attendances'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/academic-years', require('./routes/academicYears'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));

// Error handling
app.use('/api/*', notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

// Jalankan server lokal jika bukan lingkungan production
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  });
}

// WAJIB: Export app agar bisa dijalankan oleh Vercel Serverless Function
module.exports = app;
