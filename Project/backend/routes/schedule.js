const express = require('express');
const { queryAll, queryOne, runSql } = require('../database');
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.adminId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', (req, res) => {
  const schedule = queryAll('SELECT * FROM schedule ORDER BY sortOrder, id');
  res.json(schedule);
});

router.get('/:id', (req, res) => {
  const item = queryOne('SELECT * FROM schedule WHERE id = ?', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', requireAuth, (req, res) => {
  const { dayOfWeek, time, group_name, description } = req.body;
  if (!dayOfWeek || !time) return res.status(400).json({ error: 'Day and time required' });
  const result = runSql('INSERT INTO schedule (dayOfWeek, time, group_name, description) VALUES (?, ?, ?, ?)',
    [dayOfWeek, time, group_name || null, description || null]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, (req, res) => {
  const { dayOfWeek, time, group_name, description, sortOrder } = req.body;
  const item = queryOne('SELECT * FROM schedule WHERE id = ?', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Not found' });

  runSql('UPDATE schedule SET dayOfWeek = COALESCE(?, dayOfWeek), time = COALESCE(?, time), group_name = COALESCE(?, group_name), description = COALESCE(?, description), sortOrder = COALESCE(?, sortOrder) WHERE id = ?',
    [dayOfWeek || null, time || null, group_name || null, description || null, sortOrder || null, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = runSql('DELETE FROM schedule WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
