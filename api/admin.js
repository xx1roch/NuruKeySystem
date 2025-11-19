import { getAllKeys, deleteKey, updateKey } from '../lib/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const keys = getAllKeys();
    return res.json({ keys });
  }

  if (req.method === 'DELETE') {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key required' });
    }

    const success = deleteKey(key);
    return res.json({ success });
  }

  if (req.method === 'PUT') {
    const { key, updates } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key required' });
    }

    const success = updateKey(key, updates);
    return res.json({ success });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}