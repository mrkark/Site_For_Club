const express = require('express');
const { queryAll, queryOne, runSql } = require('../mssql-adapter');
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.adminId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', async (req, res) => {
  const month = new Date().getMonth() + 1;
  const isSummer = month >= 6 && month <= 8;

  if (req.query.all === '1' || req.query.all === 'true') {
    const schedule = await queryAll('SELECT * FROM schedule ORDER BY sortOrder, id');
    return res.json(schedule);
  }

  const season = req.query.season || (isSummer ? 'summer' : 'winter');
  const isSummerParam = season === 'summer' ? 1 : 0;

  const schedule = await queryAll('SELECT * FROM schedule WHERE isSummer = ? ORDER BY sortOrder, id', [isSummerParam]);
  res.json(schedule);
});

router.get('/:id', async (req, res) => {
  const item = await queryOne('SELECT * FROM schedule WHERE id = ?', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', requireAuth, async (req, res) => {
  const { dayOfWeek, time, group_name, description, isSummer } = req.body;
  if (!dayOfWeek || !time) return res.status(400).json({ error: 'Day and time required' });
  const result = await runSql('INSERT INTO schedule (dayOfWeek, time, group_name, description, isSummer) VALUES (?, ?, ?, ?, ?)',
    [dayOfWeek, time, group_name || null, description || null, isSummer ? 1 : 0]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', requireAuth, async (req, res) => {
  const { dayOfWeek, time, group_name, description, sortOrder, isSummer } = req.body;
  const item = await queryOne('SELECT * FROM schedule WHERE id = ?', [req.params.id]);
  if (!item) return res.status(404).json({ error: 'Not found' });

  await runSql('UPDATE schedule SET dayOfWeek = COALESCE(?, dayOfWeek), time = COALESCE(?, time), group_name = COALESCE(?, group_name), description = COALESCE(?, description), sortOrder = COALESCE(?, sortOrder), isSummer = COALESCE(?, isSummer) WHERE id = ?',
    [dayOfWeek || null, time || null, group_name || null, description || null, sortOrder || null, isSummer !== undefined ? (isSummer ? 1 : 0) : null, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await runSql('DELETE FROM schedule WHERE id = ?', [req.params.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
