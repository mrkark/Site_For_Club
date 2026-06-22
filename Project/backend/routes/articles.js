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
  const articles = queryAll('SELECT * FROM articles ORDER BY createdAt DESC');
  res.json(articles);
});

router.get('/:id', (req, res) => {
  const article = queryOne('SELECT * FROM articles WHERE id = ?', [req.params.id]);
  if (!article) return res.status(404).json({ error: 'Not found' });
  const comments = queryAll('SELECT * FROM article_comments WHERE articleId = ? ORDER BY createdAt DESC', [req.params.id]);
  res.json({ article, comments });
});

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const filePath = req.file ? '/uploads/' + req.file.filename : null;
  const result = runSql('INSERT INTO articles (title, content, filePath) VALUES (?, ?, ?)', [title, content || null, filePath]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, upload.single('file'), (req, res) => {
  const { id } = req.params;
  const { title, content, removeFile } = req.body;
  const article = queryOne('SELECT * FROM articles WHERE id = ?', [id]);
  if (!article) return res.status(404).json({ error: 'Not found' });

  let filePath = article.filePath;
  if (req.file) filePath = '/uploads/' + req.file.filename;
  else if (removeFile === 'true' || removeFile === '1') filePath = null;

  runSql('UPDATE articles SET title = COALESCE(?, title), content = COALESCE(?, content), filePath = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [title || null, content !== undefined ? content : null, filePath, id]);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = runSql('DELETE FROM articles WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

router.post('/:id/comments', (req, res) => {
  const { author, text } = req.body;
  if (!author || !text) return res.status(400).json({ error: 'Author and text required' });
  const article = queryOne('SELECT id FROM articles WHERE id = ?', [req.params.id]);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  runSql('INSERT INTO article_comments (articleId, author, text) VALUES (?, ?, ?)', [req.params.id, author, text]);
  res.json({ success: true });
});

router.delete('/:id/comments/:commentId', requireAuth, (req, res) => {
  runSql('DELETE FROM article_comments WHERE id = ? AND articleId = ?', [req.params.commentId, req.params.id]);
  res.json({ success: true });
});

module.exports = router;
