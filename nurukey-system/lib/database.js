import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'keys.json');

export function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ 
      keys: {}, 
      settings: {} 
    }));
    console.log('Database created at:', DB_PATH);
  }
}

export function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { keys: {}, settings: {} };
  }
}

export function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

export function addKey(key, keyData) {
  const db = readDB();
  db.keys[key] = {
    ...keyData,
    createdAt: new Date().toISOString()
  };
  writeDB(db);
  return true;
}

export function getKey(key) {
  const db = readDB();
  return db.keys[key];
}

export function getAllKeys() {
  const db = readDB();
  return db.keys;
}

export function updateKey(key, updates) {
  const db = readDB();
  if (db.keys[key]) {
    db.keys[key] = { ...db.keys[key], ...updates };
    writeDB(db);
    return true;
  }
  return false;
}

export function deleteKey(key) {
  const db = readDB();
  if (db.keys[key]) {
    delete db.keys[key];
    writeDB(db);
    return true;
  }
  return false;
}