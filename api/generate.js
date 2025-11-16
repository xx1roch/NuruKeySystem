import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET' });
  }

  const secret = process.env.NURU_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Server config error' });
  }

  // Timestamp по часам (8 hex chars)
  const ts = Math.floor(Date.now() / 3600000).toString(16).padStart(8, '0');
  // Random 20 hex (10 bytes)
  const rand = crypto.randomBytes(10).toString('hex').toUpperCase();
  // Payload
  const payload = ts + rand;
  // HMAC signature (8 hex)
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 8).toUpperCase();
  const key = `NURU-${payload}${hmac}`;  // NURU- + 36 chars

  res.json({ key });
}
