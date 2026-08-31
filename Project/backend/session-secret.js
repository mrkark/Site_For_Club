// Generates a cryptographically random session secret on first launch
// and persists it locally, instead of using a hardcoded key committed
// to source control (config.json's old "sessionSecret" value).
//
// The secret is stored outside git in backend/.session-secret (make sure
// this filename is listed in .gitignore). Every server restart reuses
// the same secret so existing login sessions/cookies stay valid; the
// file is only (re)created if missing.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SECRET_PATH = path.join(__dirname, '.session-secret');

function getSessionSecret() {
  // Allow overriding via environment variable in production deployments
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (fs.existsSync(SECRET_PATH)) {
    const existing = fs.readFileSync(SECRET_PATH, 'utf8').trim();
    if (existing) return existing;
  }

  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(SECRET_PATH, generated, { encoding: 'utf8', mode: 0o600 });
  console.log('Сгенерирован новый секретный ключ сессии: backend/.session-secret');
  return generated;
}

module.exports = { getSessionSecret };