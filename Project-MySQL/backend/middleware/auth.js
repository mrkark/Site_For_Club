const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'karate-club-default-jwt-secret-replace-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function extractToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Токен отсутствует' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Недействительный или истекший токен' });
  }

  req.user = decoded;
  next();
}

function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || !req.user.superAdmin) {
      return res.status(403).json({ error: 'Требуются права супер-администратора' });
    }
    next();
  });
}

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  requireAuth,
  requireSuperAdmin
};
