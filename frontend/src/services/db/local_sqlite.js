import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { CREATE_TABLES_SQL, DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS, DEFAULT_BUCKET } from './schema.js';

let SQL = null;
let db = null;
let activeVaultFilename = 'finance.db';
let vaults = [];
let persistChain = Promise.resolve();

const IDB_NAME = 'cash_buddy_secure_store';
const IDB_VERSION = 1;
const LEGACY_INDEX_KEY = 'finance_vaults_index';
const LEGACY_DATA_PREFIX = 'finance_vault_db_';

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Browser storage request failed.'));
  });
}

function openStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const store = request.result;
      if (!store.objectStoreNames.contains('vaults')) store.createObjectStore('vaults', { keyPath: 'filename' });
      if (!store.objectStoreNames.contains('backups')) store.createObjectStore('backups', { keyPath: 'filename' });
      if (!store.objectStoreNames.contains('settings')) store.createObjectStore('settings', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open secure browser storage.'));
  });
}

async function storeRequest(storeName, mode, action) {
  const database = await openStore();
  try {
    const tx = database.transaction(storeName, mode);
    const result = await requestResult(action(tx.objectStore(storeName)));
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Browser storage transaction failed.'));
      tx.onabort = () => reject(tx.error || new Error('Browser storage transaction was aborted.'));
    });
    return result;
  } finally {
    database.close();
  }
}

const getRecord = (store, key) => storeRequest(store, 'readonly', s => s.get(key));
const putRecord = (store, value) => storeRequest(store, 'readwrite', s => s.put(value));
const deleteRecord = (store, key) => storeRequest(store, 'readwrite', s => s.delete(key));
const allRecords = store => storeRequest(store, 'readonly', s => s.getAll());

async function getEncryptionKey() {
  const saved = await getRecord('settings', 'device_encryption_key');
  if (saved?.value) return saved.value;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await putRecord('settings', { key: 'device_encryption_key', value: key });
  return key;
}

async function encryptBytes(bytes) {
  if (!globalThis.crypto?.subtle) {
    return { version: 1, algorithm: 'PLAINTEXT-INSECURE', bytes: new Uint8Array(bytes) };
  }
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
  return { version: 1, algorithm: 'AES-GCM', iv, ciphertext };
}

async function derivePortableKey(passphrase, salt, iterations = 310000) {
  if (!passphrase || passphrase.length < 8) throw new Error('Backup passphrase must be at least 8 characters.');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function decryptBytes(record) {
  if (record.bytes) return new Uint8Array(record.bytes);
  if (record.encrypted?.algorithm === 'PLAINTEXT-INSECURE' && record.encrypted.bytes) {
    return new Uint8Array(record.encrypted.bytes);
  }
  if (!record.encrypted?.ciphertext) throw new Error('Vault data is missing.');
  const key = await getEncryptionKey();
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(record.encrypted.iv) },
    key,
    record.encrypted.ciphertext
  );
  return new Uint8Array(plain);
}

export function generateUUID() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  });
}

function normalizeFilename(name) {
  const base = String(name || '').replace(/\.(db|sqlite)$/i, '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  if (!base) throw new Error('Vault name must contain a letter or number.');
  return `${base}.db`;
}

function validateDatabaseBytes(bytes) {
  let candidate;
  try {
    candidate = new SQL.Database(bytes);
    const integrity = candidate.exec('PRAGMA integrity_check');
    if (integrity[0]?.values?.[0]?.[0] !== 'ok') throw new Error('SQLite integrity check failed.');
    const tables = candidate.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const names = new Set((tables[0]?.values || []).map(row => row[0]));
    for (const required of ['accounts', 'categories', 'savings_buckets', 'transactions', 'debts']) {
      if (!names.has(required)) throw new Error(`Required table '${required}' is missing.`);
    }
    return true;
  } catch (error) {
    throw new Error(`Invalid Cash Buddy database: ${error.message}`);
  } finally {
    candidate?.close();
  }
}

async function saveVaultBytes(filename, bytes, displayName) {
  const encrypted = await encryptBytes(bytes);
  const existing = await getRecord('vaults', filename);
  const record = {
    filename,
    name: displayName || existing?.name || filename.replace(/\.db$/i, ''),
    encrypted,
    size_bytes: bytes.byteLength,
    updated_at: Date.now()
  };
  await putRecord('vaults', record);
  const verified = await decryptBytes(await getRecord('vaults', filename));
  if (verified.byteLength !== bytes.byteLength) throw new Error('Saved vault verification failed.');
  return record;
}

async function migrateLegacyStorage() {
  if ((await allRecords('vaults')).length) return;
  let legacy = [];
  try { legacy = JSON.parse(localStorage.getItem(LEGACY_INDEX_KEY) || '[]'); } catch { legacy = []; }
  if (!legacy.length) legacy = [{ filename: 'finance.db', name: 'Personal', is_active: true }];
  for (const item of legacy) {
    const raw = localStorage.getItem(`${LEGACY_DATA_PREFIX}${item.filename}`);
    if (!raw) continue;
    const binary = atob(raw);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    try {
      new SQL.Database(bytes).close();
      await saveVaultBytes(item.filename, bytes, item.name);
    } catch (error) {
      console.warn(`Legacy vault '${item.filename}' was retained but could not be migrated:`, error);
    }
  }
  await putRecord('settings', { key: 'active_vault', value: legacy.find(v => v.is_active)?.filename || 'finance.db' });
}

async function refreshVaultIndex() {
  const active = (await getRecord('settings', 'active_vault'))?.value || activeVaultFilename;
  vaults = (await allRecords('vaults')).map(({ encrypted, ...item }) => ({ ...item, is_active: item.filename === active }));
}

export async function initDatabaseEngine() {
  if (!globalThis.indexedDB) throw new Error('This browser cannot provide offline database storage.');
  if (!SQL) SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
  await migrateLegacyStorage();
  await refreshVaultIndex();
  const savedActive = vaults.find(v => v.is_active)?.filename || vaults[0]?.filename || 'finance.db';
  await loadVault(savedActive);
}

export async function loadVault(filename) {
  if (db && activeVaultFilename !== filename) await persistCurrentDatabase();
  const record = await getRecord('vaults', filename);
  activeVaultFilename = filename;
  if (record) {
    const bytes = await decryptBytes(record);
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
  }
  runSchemaAndSeeds();
  await putRecord('settings', { key: 'active_vault', value: filename });
  await persistCurrentDatabase();
  await refreshVaultIndex();
}

function runSchemaAndSeeds() {
  db.run('PRAGMA foreign_keys = ON');
  db.run(CREATE_TABLES_SQL);
  db.run('CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  const migrations = [
    ['categories', 'is_quick_select', 'ALTER TABLE categories ADD COLUMN is_quick_select INTEGER NOT NULL DEFAULT 0'],
    ['categories', 'icon', "ALTER TABLE categories ADD COLUMN icon TEXT NULL DEFAULT '🏷️'"],
    ['savings_buckets', 'sort_order', 'ALTER TABLE savings_buckets ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0']
  ];
  for (const [table, column, sql] of migrations) {
    const columns = execQuery(`PRAGMA table_info(${table})`).map(row => row.name);
    if (!columns.includes(column)) db.run(sql);
  }
  db.run('CREATE INDEX IF NOT EXISTS ix_transactions_date ON transactions(date)');
  db.run('CREATE INDEX IF NOT EXISTS ix_transactions_type ON transactions(transaction_type)');
  db.run('CREATE INDEX IF NOT EXISTS ix_transactions_account ON transactions(account_id)');
  db.run('CREATE INDEX IF NOT EXISTS ix_transactions_category ON transactions(category_id)');
  db.run('CREATE INDEX IF NOT EXISTS ix_transactions_bucket ON transactions(bucket_id)');
  const now = new Date().toISOString();
  if (execQuery('SELECT COUNT(*) count FROM categories')[0]?.count === 0) {
    for (const cat of DEFAULT_CATEGORIES) db.run('INSERT INTO categories (id,name,color,icon,is_quick_select,created_at,updated_at) VALUES (?,?,?,?,?,?,?)', [generateUUID(), cat.name, cat.color, cat.icon || '🏷️', cat.is_quick_select || 0, now, now]);
  }
  if (execQuery('SELECT COUNT(*) count FROM accounts')[0]?.count === 0) {
    for (const account of DEFAULT_ACCOUNTS) db.run('INSERT INTO accounts (id,name,type,balance,created_at,updated_at) VALUES (?,?,?,?,?,?)', [generateUUID(), account.name, account.type, account.balance, now, now]);
  }
  if (execQuery('SELECT COUNT(*) count FROM savings_buckets')[0]?.count === 0) {
    db.run('INSERT INTO savings_buckets (id,name,allocated_balance,icon,color,is_archived,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)', [generateUUID(), DEFAULT_BUCKET.name, DEFAULT_BUCKET.allocated_balance, DEFAULT_BUCKET.icon, DEFAULT_BUCKET.color, DEFAULT_BUCKET.is_archived, now, now]);
  }
  db.run("INSERT OR REPLACE INTO app_metadata(key,value) VALUES ('schema_version','2')");
}

export function execQuery(sql, params = []) {
  if (!db) return [];
  const stmt = db.prepare(sql);
  try {
    if (params.length) stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    return results;
  } finally { stmt.free(); }
}

export function execRun(sql, params = [], persist = true) {
  if (!db) throw new Error('Database is not initialized.');
  db.run(sql, params);
  if (persist) queuePersistence();
}

function queuePersistence() {
  persistChain = persistChain.then(() => persistCurrentDatabase());
  persistChain.catch(error => globalThis.dispatchEvent?.(new CustomEvent('cashbuddy-storage-error', { detail: error.message })));
  return persistChain;
}

export async function persistCurrentDatabase() {
  if (!db) return;
  const bytes = db.export();
  await saveVaultBytes(activeVaultFilename, bytes);
  await refreshVaultIndex();
}

export async function runInTransaction(callback) {
  db.run('BEGIN IMMEDIATE');
  try {
    const result = await callback();
    db.run('COMMIT');
    await persistCurrentDatabase();
    return result;
  } catch (error) {
    try { db.run('ROLLBACK'); } catch { /* transaction was already closed */ }
    throw error;
  }
}

export const getActiveVaultName = () => activeVaultFilename;
export const listVaults = () => vaults.map(v => ({ ...v, is_active: v.filename === activeVaultFilename }));

export async function createNewVault(name) {
  const filename = normalizeFilename(name);
  if (await getRecord('vaults', filename)) throw new Error(`Vault '${filename}' already exists.`);
  await loadVault(filename);
  await saveVaultBytes(filename, db.export(), String(name).trim());
  await refreshVaultIndex();
  return filename;
}

export async function switchActiveVault(filename) {
  if (!(await getRecord('vaults', filename))) throw new Error(`Vault '${filename}' not found.`);
  await loadVault(filename);
  return filename;
}

export async function deleteVault(filename) {
  if (filename === activeVaultFilename) throw new Error('Cannot delete the currently active vault.');
  await deleteRecord('vaults', filename);
  await refreshVaultIndex();
  return true;
}

export function exportActiveDatabaseBlob() { return db?.export() || null; }

export async function exportDatabaseBlobByName(filename) {
  const record = await getRecord('vaults', filename);
  return record ? decryptBytes(record) : null;
}

export async function importDatabaseBlob(filename, uint8Array, passphrase = '') {
  if (uint8Array.byteLength > 100 * 1024 * 1024) throw new Error('Imported database exceeds the 100 MB safety limit.');
  if (/\.cbbak$/i.test(filename)) {
    let payload;
    try { payload = JSON.parse(new TextDecoder().decode(uint8Array)); } catch { throw new Error('Invalid encrypted backup file.'); }
    if (payload.format !== 'cashbuddy-encrypted-backup' || payload.version !== 1) throw new Error('Unsupported backup format.');
    const salt = new Uint8Array(payload.salt);
    const key = await derivePortableKey(passphrase, salt, payload.iterations);
    try {
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(payload.iv) }, key, new Uint8Array(payload.ciphertext));
      uint8Array = new Uint8Array(plain);
      filename = payload.source_vault || filename.replace(/\.cbbak$/i, '.db');
    } catch { throw new Error('Incorrect passphrase or damaged encrypted backup.'); }
  }
  validateDatabaseBytes(uint8Array);
  let cleanName = normalizeFilename(filename);
  if (await getRecord('vaults', cleanName)) cleanName = cleanName.replace(/\.db$/, `_${Date.now()}.db`);
  await saveVaultBytes(cleanName, uint8Array, cleanName.replace(/\.db$/, ''));
  await loadVault(cleanName);
  return cleanName;
}

export async function createBackupSnapshot() {
  const bytes = db.export();
  const stamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const filename = `backup_${activeVaultFilename.replace(/\.db$/, '')}_${stamp}.cbbak`;
  await putRecord('backups', { filename, source_vault: activeVaultFilename, encrypted: await encryptBytes(bytes), size_bytes: bytes.byteLength, created_at: Date.now() });
  return filename;
}

export async function listBackupSnapshots() {
  return (await allRecords('backups')).map(({ encrypted, ...item }) => item).sort((a, b) => b.created_at - a.created_at);
}

export async function restoreBackupSnapshot(filename) {
  const record = await getRecord('backups', filename);
  if (!record) throw new Error('Backup file not found.');
  const bytes = await decryptBytes(record);
  validateDatabaseBytes(bytes);
  await createBackupSnapshot();
  db.close();
  db = new SQL.Database(bytes);
  runSchemaAndSeeds();
  await persistCurrentDatabase();
  return activeVaultFilename;
}

export async function exportBackupBytes(filename, passphrase) {
  const record = await getRecord('backups', filename);
  if (!record) return null;
  const bytes = await decryptBytes(record);
  if (!globalThis.crypto?.subtle) return bytes;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 310000;
  const key = await derivePortableKey(passphrase, salt, iterations);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
  const payload = { format: 'cashbuddy-encrypted-backup', version: 1, source_vault: record.source_vault, created_at: record.created_at, kdf: 'PBKDF2-SHA-256', iterations, salt: Array.from(salt), iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
  return new TextEncoder().encode(JSON.stringify(payload));
}

export function checkDatabaseIntegrity() {
  return {
    integrity: execQuery('PRAGMA integrity_check')[0]?.integrity_check || 'unknown',
    foreign_key_violations: execQuery('PRAGMA foreign_key_check'),
    transaction_count: execQuery('SELECT COUNT(*) count FROM transactions')[0]?.count || 0,
    size_bytes: db?.export().byteLength || 0
  };
}
