const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { queryAll, queryOne, runSql } = require('../mssql-adapter');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'frontend', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let name = file.originalname;
    if (!/[а-яёА-ЯЁ]/i.test(name)) {
      const fixed = Buffer.from(name, 'latin1').toString('utf8');
      if (/[а-яёА-ЯЁ]/i.test(fixed)) name = fixed;
    }
    cb(null, uniqueSuffix + '-' + name);
  }
});
const upload = multer({ storage });

function requireAuth(req, res, next) {
  if (!req.session.adminId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', async (req, res) => {
  const news = await queryAll('SELECT * FROM news ORDER BY createdAt DESC');
  res.json(news);
});

router.get('/:id', async (req, res) => {
  const item = await queryOne('SELECT * FROM news WHERE id = ?', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const filePath = req.file ? req.file.filename : null;
  const result = await runSql('INSERT INTO news (title, content, filePath) VALUES (?, ?, ?)', [title, content || null, filePath]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { title, content, removeFile } = req.body;
  const item = await queryOne('SELECT * FROM news WHERE id = ?', [id]);
  if (!item) return res.status(404).json({ error: 'Not found' });

  if (req.file || removeFile === 'true' || removeFile === '1') {
    const oldFile = item.filePath;
    if (oldFile) {
      const oldPath = path.resolve(__dirname, '..', '..', 'frontend', 'uploads', path.basename(oldFile));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }

  let filePath = item.filePath;
  if (req.file) filePath = req.file.filename;
  else if (removeFile === 'true' || removeFile === '1') filePath = null;

  await runSql('UPDATE news SET title = COALESCE(?, title), content = COALESCE(?, content), filePath = ? WHERE id = ?',
    [title || null, content !== undefined ? content : null, filePath, id]);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const item = await queryOne('SELECT * FROM news WHERE id = ?', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (item.filePath) {
    const filePath = path.resolve(__dirname, '..', '..', 'frontend', 'uploads', path.basename(item.filePath));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await runSql('DELETE FROM news WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
