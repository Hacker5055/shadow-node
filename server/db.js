/**
 * SHADOW NODE // flat-file datastore
 * Atomic JSON persistence (no native deps -> runs anywhere).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'shadow-node.db.json');

const DEFAULT_DB = {
  meta: { version: 1, createdAt: new Date().toISOString(), seeded: false },
  targets: [],
  sessions: {}, // sessionId -> { unlockedFlags: [], themes: [], lang, theme, createdAt, logs: [] }
  ctf: [], // flag definitions
  audit: [], // ring buffer of node events
};

let db = null;
let writeQueue = Promise.resolve();

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDir();
  if (db) return db;
  if (fs.existsSync(DB_FILE)) {
    try {
      db = { ...structuredClone(DEFAULT_DB), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
    } catch (err) {
      console.error('[db] corrupt store, rebuilding:', err.message);
      db = structuredClone(DEFAULT_DB);
    }
  } else {
    db = structuredClone(DEFAULT_DB);
    save();
  }
  return db;
}

function save() {
  const snapshot = JSON.stringify(db, null, 2);
  writeQueue = writeQueue.then(
    () =>
      new Promise((resolve) => {
        const tmp = `${DB_FILE}.${process.pid}.tmp`;
        fs.writeFile(tmp, snapshot, (err) => {
          if (err) {
            console.error('[db] write failed', err.message);
            return resolve();
          }
          fs.rename(tmp, DB_FILE, (err2) => {
            if (err2) console.error('[db] rename failed', err2.message);
            resolve();
          });
        });
      })
  );
  return writeQueue;
}

const uid = (p = 'id') => `${p}_${crypto.randomBytes(5).toString('hex')}`;

function audit(entry) {
  const d = load();
  d.audit.unshift({ at: new Date().toISOString(), id: uid('evt'), ...entry });
  if (d.audit.length > 500) d.audit.length = 500;
  return entry;
}

function session(id) {
  const d = load();
  if (!id) id = uid('sess');
  if (!d.sessions[id]) {
    d.sessions[id] = {
      id,
      unlockedFlags: [],
      themes: ['toxic'],
      theme: 'toxic',
      lang: 'en',
      selected: null,
      createdAt: new Date().toISOString(),
      cmdCount: 0,
    };
    save();
  }
  return d.sessions[id];
}

function persist() {
  save();
}

module.exports = { load, save, persist, uid, audit, session, DB_FILE, DATA_DIR };
