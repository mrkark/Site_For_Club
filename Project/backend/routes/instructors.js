const express = require('express');
const multer = require('multer');
const path = require('path');
const { queryAll, queryOne, runSql } = require('../mssql-adapter');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'frontend', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

function requireAuth(req, res, next) {
  if (!req.session.adminId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', async (req, res) => {
  const instructors = await queryAll('SELECT * FROM instructors ORDER BY sortOrder, id');
  res.json(instructors);
});

router.get('/:id', async (req, res) => {
  const item = await queryOne('SELECT * FROM instructors WHERE id = ?', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  const { name, title, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const photo = req.file ? '/uploads/' + req.file.filename : null;
  const result = await runSql('INSERT INTO instructors (name, title, photo, description) VALUES (?, ?, ?, ?)',
    [name, title || null, photo, description || null]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, upload.single('photo'), async (req, res) => {
  const { name, title, description, sortOrder } = req.body;
  const photo = req.file ? '/uploads/' + req.file.filename : null;
  const instructor = await queryOne('SELECT * FROM instructors WHERE id = ?', [req.params.id]);
  if (!instructor) return res.status(404).json({ error: 'Not found' });

  await runSql('UPDATE instructors SET name = COALESCE(?, name), title = COALESCE(?, title), photo = COALESCE(?, photo), description = COALESCE(?, description), sortOrder = COALESCE(?, sortOrder) WHERE id = ?',
    [name || null, title || null, photo || null, description || null, sortOrder || null, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await runSql('DELETE FROM instructors WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
