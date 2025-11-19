import crypto from 'crypto';

// Временное хранилище (замени на базу данных)
const activeKeys = new Map();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action, key, hwid } = req.body;

    // Активация ключа
    if (action === 'activate') {
      if (!key || !hwid) {
        return res.json({ success: false, message: 'Missing key or HWID' });
      }

      // Генерация настоящего ключа на сервере
      if (key === 'generate') {
        const newKey = generateSecureKey();
        activeKeys.set(newKey, {
          hwid: hwid,
          activated: Date.now(),
          expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 дней
        });
        
        return res.json({ 
          success: true, 
          key: newKey,
          message: 'Key generated successfully'
        });
      }

      // Активация существующего ключа
      if (activeKeys.has(key)) {
        return res.json({ success: false, message: 'Key already activated' });
      }

      // Здесь должна быть проверка оплаты/валидности ключа
      activeKeys.set(key, {
        hwid: hwid,
        activated: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });

      return res.json({ success: true, message: 'Key activated' });
    }

    // Проверка ключа
    if (action === 'verify') {
      if (!key || !hwid) {
        return res.json({ valid: false });
      }

      const keyData = activeKeys.get(key);
      if (!keyData) {
        return res.json({ valid: false });
      }

      if (keyData.hwid !== hwid) {
        return res.json({ valid: false, message: 'HWID mismatch' });
      }

      if (Date.now() > keyData.expires) {
        return res.json({ valid: false, message: 'Key expired' });
      }

      return res.json({ valid: true, expires: keyData.expires });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function generateSecureKey() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = crypto.randomBytes(16).toString('hex');
  const secret = process.env.NURU_SECRET;
  
  const payload = timestamp + random;
  const hmac = crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  
  return `NURU-${timestamp}${random}${hmac}`;
}
