const express = require('express');
const multer = require('multer');
const path = require('path');
const { queryAll, queryOne, runSql } = require('../database');
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

router.get('/', (req, res) => {
  const news = queryAll('SELECT * FROM news ORDER BY createdAt DESC');
  res.json(news);
});

router.get('/:id', (req, res) => {
  const item = queryOne('SELECT * FROM news WHERE id = ?', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const filePath = req.file ? '/uploads/' + req.file.filename : null;
  const result = runSql('INSERT INTO news (title, content, filePath) VALUES (?, ?, ?)', [title, content || null, filePath]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, upload.single('file'), (req, res) => {
  const { id } = req.params;
  const { title, content, removeFile } = req.body;
  const item = queryOne('SELECT * FROM news WHERE id = ?', [id]);
  if (!item) return res.status(404).json({ error: 'Not found' });

  let filePath = item.filePath;
  if (req.file) filePath = '/uploads/' + req.file.filename;
  else if (removeFile === 'true' || removeFile === '1') filePath = null;

  runSql('UPDATE news SET title = COALESCE(?, title), content = COALESCE(?, content), filePath = ? WHERE id = ?',
    [title || null, content !== undefined ? content : null, filePath, id]);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = runSql('DELETE FROM news WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
