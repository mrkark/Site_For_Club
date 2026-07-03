const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('express-async-errors');

const fs = require('fs');
const adminRoutes = require('./routes/admin');
const articlesRoutes = require('./routes/articles');
const newsRoutes = require('./routes/news');
const instructorsRoutes = require('./routes/instructors');
const scheduleRoutes = require('./routes/schedule');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Disable ETag for API responses to prevent caching
app.set('etag', false);
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
});
app.use(session({
  secret: 'karate-club-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'frontend', 'uploads')));

// Download endpoint with original filename
app.get('/api/download/:filename', (req, res) => {
  const filePath = path.resolve(__dirname, '..', 'frontend', 'uploads', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send(`<h2>Файл не найден</h2><p>Файл ${req.params.filename} не найден на сервере.</p><a href="/">Вернуться на главную</a>`);
  }
  const originalName = req.params.filename.replace(/^\d+-\d+-/, '');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
  res.sendFile(filePath);
});

app.use('/api/admin', adminRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/instructors', instructorsRoutes);
app.use('/api/schedule', scheduleRoutes);

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
