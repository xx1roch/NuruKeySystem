// api/admin.js
import { getAllKeys, deleteKey, updateKey } from '../lib/database.js';

export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Проверка админ-ключа
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const keys = getAllKeys();
      return res.json({ keys });
    } catch (error) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({ error: 'Key required' });
      }

      const success = deleteKey(key);
      return res.json({ success });
    } catch (error) {
      return res.status(500).json({ error: 'Delete error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { key, updates } = req.body;
      if (!key) {
        return res.status(400).json({ error: 'Key required' });
      }

      const success = updateKey(key, updates);
      return res.json({ success });
    } catch (error) {
      return res.status(500).json({ error: 'Update error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
