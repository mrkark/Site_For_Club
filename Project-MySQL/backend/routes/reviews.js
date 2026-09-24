const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { queryAll, queryOne, runSql } = require('../mysql-adapter');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Reviews get their own uploads subfolder, separate from the shared /uploads root
const REVIEWS_DIR = path.join(__dirname, '..', '..', 'frontend', 'uploads', 'reviews');
if (!fs.existsSync(REVIEWS_DIR)) fs.mkdirSync(REVIEWS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, REVIEWS_DIR);
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



router.get('/', async (req, res) => {
  const reviews = await queryAll('SELECT * FROM reviews ORDER BY sortOrder, id DESC');
  res.json(reviews);
});

router.get('/:id', async (req, res) => {
  const item = await queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  const { author, text, sortOrder } = req.body;
  if (!author || !text) return res.status(400).json({ error: 'Author and text required' });
  const photo = req.file ? '/uploads/reviews/' + req.file.filename : null;
  const result = await runSql('INSERT INTO reviews (author, text, photo, sortOrder) VALUES (?, ?, ?, ?)',
    [author, text, photo, sortOrder || 0]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, upload.single('photo'), async (req, res) => {
  const { author, text, sortOrder, removePhoto } = req.body;
  const review = await queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
  if (!review) return res.status(404).json({ error: 'Not found' });

  if (req.file || removePhoto === '1') {
    const oldFile = review.photo;
    if (oldFile) {
      const oldPath = path.resolve(REVIEWS_DIR, path.basename(oldFile));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }

  let photo = req.file ? '/uploads/reviews/' + req.file.filename : null;
  if (!req.file && removePhoto === '1') photo = '';

  await runSql('UPDATE reviews SET author = COALESCE(?, author), text = COALESCE(?, text), photo = COALESCE(?, photo), sortOrder = COALESCE(?, sortOrder) WHERE id = ?',
    [author || null, text || null, photo || null, sortOrder || null, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const review = await queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
  if (!review) return res.status(404).json({ error: 'Not found' });
  if (review.photo) {
    const filePath = path.resolve(REVIEWS_DIR, path.basename(review.photo));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await runSql('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
