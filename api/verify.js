import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST' });
  }

  let body;
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ valid: false });
  }

  const { key } = body;
  if (!key || typeof key !== 'string' || !key.startsWith('NURU-')) {
    return res.json({ valid: false });
  }

  const part = key.slice(5).toUpperCase();
  if (part.length !== 36 || !/^[0-9A-F]{36}$/.test(part)) {
    return res.json({ valid: false });
  }

  const ts = part.slice(0, 8);
  const rand = part.slice(8, 28);
  const receivedHmac = part.slice(28, 36);

  const payload = ts + rand;
  const secret = process.env.NURU_SECRET;
  const computedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 8).toUpperCase();

  if (computedHmac !== receivedHmac) {
    return res.json({ valid: false });
  }

  // Проверка времени: текущий час + предыдущий (2 часа жизни)
  const nowTs = Math.floor(Date.now() / 3600000).toString(16).padStart(8, '0');
  const nowNum = parseInt(nowTs, 16);
  const tsNum = parseInt(ts, 16);
  if (tsNum < nowNum - 1) {
    return res.json({ valid: false });
  }

  res.json({ valid: true });
}
