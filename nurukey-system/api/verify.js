import crypto from 'crypto';
import { initDB, addKey, getKey, updateKey } from '../lib/database.js';

initDB();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { action, key, hwid, duration = 30 } = req.body;

    if (action === 'generate') {
      const adminKey = req.headers['x-admin-key'];
      if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const newKey = generateSecureKey();
      const expires = Date.now() + (duration * 24 * 60 * 60 * 1000);

      addKey(newKey, {
        hwid: null,
        activated: false,
        activatedAt: null,
        expires: expires,
        duration: duration,
        used: false
      });

      return res.json({ 
        success: true, 
        key: newKey,
        expires: new Date(expires).toISOString()
      });
    }

    if (action === 'activate') {
      if (!key || !hwid) {
        return res.json({ success: false, message: 'Missing key or HWID' });
      }

      const keyData = getKey(key);
      
      if (!keyData) {
        return res.json({ success: false, message: 'Invalid key' });
      }

      if (keyData.activated) {
        return res.json({ success: false, message: 'Key already activated' });
      }

      updateKey(key, {
        hwid: hwid,
        activated: true,
        activatedAt: new Date().toISOString(),
        used: true
      });

      return res.json({ 
        success: true, 
        message: 'Key activated successfully',
        expires: new Date(keyData.expires).toISOString()
      });
    }

    if (action === 'verify') {
      if (!key || !hwid) {
        return res.json({ valid: false, message: 'Missing data' });
      }

      const keyData = getKey(key);
      
      if (!keyData) {
        return res.json({ valid: false, message: 'Invalid key' });
      }

      if (!keyData.activated) {
        return res.json({ valid: false, message: 'Key not activated' });
      }

      if (keyData.hwid !== hwid) {
        return res.json({ valid: false, message: 'HWID mismatch' });
      }

      if (Date.now() > keyData.expires) {
        return res.json({ valid: false, message: 'Key expired' });
      }

      return res.json({ 
        valid: true, 
        expires: new Date(keyData.expires).toISOString(),
        activatedAt: keyData.activatedAt
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateSecureKey() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = crypto.randomBytes(14).toString('hex').toUpperCase();
  const secret = process.env.NURU_SECRET || 'default-secret-change-me';
  
  const payload = timestamp + random;
  const hmac = crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  
  return `NURU-${timestamp}${random}${hmac}`;
}