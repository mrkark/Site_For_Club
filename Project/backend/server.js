const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const { getDb } = require('./database');
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
app.use(session({
  secret: 'karate-club-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'frontend', 'uploads')));

app.use(async (req, res, next) => {
  try {
    await getDb();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/admin', adminRoutes);
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
