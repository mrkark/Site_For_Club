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
  const articles = await queryAll('SELECT * FROM articles ORDER BY createdAt DESC');
  res.json(articles);
});

router.get('/:id', async (req, res) => {
  const article = await queryOne('SELECT * FROM articles WHERE id = ?', [req.params.id]);
  if (!article) return res.status(404).json({ error: 'Not found' });
  const comments = await queryAll('SELECT * FROM article_comments WHERE articleId = ? ORDER BY createdAt ASC', [req.params.id]);
  const nested = [];
  const map = {};
  comments.forEach(c => {
    map[c.id] = { ...c, replies: [] };
    if (!c.parentId) nested.push(map[c.id]);
  });
  comments.forEach(c => {
    if (c.parentId && map[c.parentId]) map[c.parentId].replies.push(map[c.id]);
  });
  res.json({ article, comments: nested });
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const filePath = req.file ? '/uploads/' + req.file.filename : null;
  const result = await runSql('INSERT INTO articles (title, content, filePath) VALUES (?, ?, ?)', [title, content || null, filePath]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { title, content, removeFile } = req.body;
  const article = await queryOne('SELECT * FROM articles WHERE id = ?', [id]);
  if (!article) return res.status(404).json({ error: 'Not found' });

  let filePath = article.filePath;
  if (req.file) filePath = '/uploads/' + req.file.filename;
  else if (removeFile === 'true' || removeFile === '1') filePath = null;

  await runSql('UPDATE articles SET title = COALESCE(?, title), content = COALESCE(?, content), filePath = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [title || null, content !== undefined ? content : null, filePath, id]);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await runSql('DELETE FROM articles WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

router.post('/:id/view', async (req, res) => {
  await runSql('UPDATE articles SET views = ISNULL(views, 0) + 1 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

router.post('/:id/comments', async (req, res) => {
  const { author, text, parentId } = req.body;
  if (!author || !text) return res.status(400).json({ error: 'Author and text required' });
  const article = await queryOne('SELECT id FROM articles WHERE id = ?', [req.params.id]);
  if (!article) {
    console.log('Comment failed: article id=' + req.params.id + ' not found');
    return res.status(404).json({ error: 'Article not found' });
  }
  // Flatten nesting to 1 level: if parent has a parentId, use grandparent
  let resolvedParentId = parentId || null;
  if (resolvedParentId) {
    const parent = await queryOne('SELECT id, parentId FROM article_comments WHERE id = ? AND articleId = ?', [resolvedParentId, req.params.id]);
    if (!parent) return res.status(400).json({ error: 'Parent comment not found' });
    if (parent.parentId) resolvedParentId = parent.parentId;
  }
  await runSql('INSERT INTO article_comments (articleId, author, text, parentId) VALUES (?, ?, ?, ?)', [req.params.id, author, text, resolvedParentId]);
  res.json({ success: true });
});

router.delete('/:id/comments/:commentId', requireAuth, async (req, res) => {
  await runSql('DELETE FROM article_comments WHERE id = ? AND articleId = ?', [req.params.commentId, req.params.id]);
  res.json({ success: true });
});

module.exports = router;
