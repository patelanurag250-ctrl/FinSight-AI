import crypto from 'node:crypto';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'finsight-secure-jwt-hmac-sha256-key-2026';

// Password hashing with salt using standard Node scrypt
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
}

// Generate secure signature-verified token
export function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.full_name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch (err) {
    return null;
  }
}

// Express Auth Middleware: Strict user isolation
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  const user = db.prepare('SELECT id, email, full_name, role, created_at FROM users WHERE id = ?').get(payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(user.id);

  req.user = user;
  req.userProfile = profile || {
    currency: 'INR',
    currency_symbol: '₹',
    monthly_income_target: 75000,
    monthly_savings_target: 20000,
    theme_preference: 'dark',
  };

  next();
}
