const express = require('express');
const bcrypt = require('bcryptjs');
const { queryAll, queryOne, runSql } = require('../mysql-adapter');
const { generateToken, extractToken, verifyToken, requireSuperAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Login and password required' });
  const admin = await queryOne('SELECT * FROM admins WHERE login = ?', [login]);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken({
    id: admin.id,
    login: admin.login,
    superAdmin: !!admin.superAdmin
  });
  res.json({
    success: true,
    token,
    admin: { id: admin.id, login: admin.login, superAdmin: !!admin.superAdmin }
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true });
});

router.get('/session', async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.json({ authenticated: false });
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) return res.json({ authenticated: false });

  const admin = await queryOne('SELECT id, login, superAdmin FROM admins WHERE id = ?', [decoded.id]);
  if (!admin) return res.json({ authenticated: false });
  res.json({ authenticated: true, admin: { ...admin, superAdmin: !!admin.superAdmin } });
});

router.get('/', requireSuperAdmin, async (req, res) => {
  const admins = await queryAll('SELECT id, login, superAdmin, createdAt FROM admins ORDER BY id');
  res.json(admins);
});

router.get('/:id', requireSuperAdmin, async (req, res) => {
  const admin = await queryOne('SELECT id, login, superAdmin, createdAt FROM admins WHERE id = ?', [req.params.id]);
  if (!admin) return res.status(404).json({ error: 'Not found' });
  res.json(admin);
});

router.post('/', requireSuperAdmin, async (req, res) => {
  const { login, password, superAdmin } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Login and password required' });
  const existing = await queryOne('SELECT id FROM admins WHERE login = ?', [login]);
  if (existing) return res.status(400).json({ error: 'Login already exists' });
  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = await runSql('INSERT INTO admins (login, password, superAdmin) VALUES (?, ?, ?)', [login, hashedPassword, superAdmin ? 1 : 0]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { login, password, superAdmin } = req.body;
  const admin = await queryOne('SELECT * FROM admins WHERE id = ?', [id]);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });

  if (login && login !== admin.login) {
    const existing = await queryOne('SELECT id FROM admins WHERE login = ?', [login]);
    if (existing) return res.status(400).json({ error: 'Login already exists' });
  }

  let query = 'UPDATE admins SET login = COALESCE(?, login)';
  const params = [login || null];

  if (password) {
    query += ', password = ?';
    params.push(bcrypt.hashSync(password, 10));
  }
  if (superAdmin !== undefined) {
    query += ', superAdmin = ?';
    params.push(superAdmin ? 1 : 0);
  }
  query += ' WHERE id = ?';
  params.push(id);

  await runSql(query, params);
  res.json({ success: true });
});

router.delete('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const result = await runSql('DELETE FROM admins WHERE id = ?', [id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Admin not found' });
  res.json({ success: true });
});

module.exports = router;
