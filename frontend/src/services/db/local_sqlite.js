import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { CREATE_TABLES_SQL, DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS, DEFAULT_BUCKET } from './schema.js';

let SQL = null;
let db = null;
let activeVaultFilename = 'finance.db';

const VAULTS_INDEX_KEY = 'finance_vaults_index';
const VAULT_DATA_PREFIX = 'finance_vault_db_';

// Helper to generate UUIDs
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get list of saved vault metadata
export function getSavedVaultsList() {
  const raw = localStorage.getItem(VAULTS_INDEX_KEY);
  if (!raw) {
    return [{ filename: 'finance.db', name: 'Personal', is_active: true, size_bytes: 0, updated_at: Date.now() }];
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [{ filename: 'finance.db', name: 'Personal', is_active: true, size_bytes: 0, updated_at: Date.now() }];
  }
}

function saveVaultsList(vaults) {
  localStorage.setItem(VAULTS_INDEX_KEY, JSON.stringify(vaults));
}

// Save active database bytes to browser storage
export function persistCurrentDatabase() {
  if (!db) return;
  const binaryArray = db.export();
  const base64 = Uint8ArrayToBase64(binaryArray);
  try {
    localStorage.setItem(`${VAULT_DATA_PREFIX}${activeVaultFilename}`, base64);
    
    // Update vault index metadata
    const vaults = getSavedVaultsList();
    const target = vaults.find(v => v.filename === activeVaultFilename);
    if (target) {
      target.size_bytes = binaryArray.length;
      target.updated_at = Date.now();
    } else {
      vaults.push({
        filename: activeVaultFilename,
        name: activeVaultFilename.replace('.db', '').charAt(0).toUpperCase() + activeVaultFilename.replace('.db', '').slice(1),
        is_active: true,
        size_bytes: binaryArray.length,
        updated_at: Date.now()
      });
    }
    vaults.forEach(v => { v.is_active = (v.filename === activeVaultFilename); });
    saveVaultsList(vaults);
  } catch (e) {
    console.error("Error saving database to browser storage:", e);
  }
}

// Convert Uint8Array to Base64
function Uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function Base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Initialize SQL.js engine & load active vault using Vite WASM asset URL
export async function initDatabaseEngine() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl
    });
  }

  const vaults = getSavedVaultsList();
  const active = vaults.find(v => v.is_active) || vaults[0];
  activeVaultFilename = active ? active.filename : 'finance.db';

  loadVault(activeVaultFilename);
}

// Load a vault from browser storage or create fresh if missing
export function loadVault(filename) {
  if (db && activeVaultFilename !== filename) {
    persistCurrentDatabase();
  }

  activeVaultFilename = filename;
  const base64Data = localStorage.getItem(`${VAULT_DATA_PREFIX}${filename}`);

  if (base64Data) {
    try {
      const bytes = Base64ToUint8Array(base64Data);
      db = new SQL.Database(bytes);
    } catch (e) {
      console.error(`Error reading ${filename}, creating fresh:`, e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Ensure tables and seed baseline defaults
  runSchemaAndSeeds();
  persistCurrentDatabase();
}

// Run table creation and baseline default seeds
function runSchemaAndSeeds() {
  if (!db) return;
  db.run(CREATE_TABLES_SQL);

  const now = new Date().toISOString();

  // Seed Default Categories
  const catRes = execQuery('SELECT COUNT(*) as count FROM categories');
  if (catRes[0]?.count === 0) {
    DEFAULT_CATEGORIES.forEach(cat => {
      execRun(
        'INSERT INTO categories (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [generateUUID(), cat.name, cat.color, now, now]
      );
    });
  }

  // Seed Default Accounts
  const accRes = execQuery('SELECT COUNT(*) as count FROM accounts');
  if (accRes[0]?.count === 0) {
    DEFAULT_ACCOUNTS.forEach(acc => {
      execRun(
        'INSERT INTO accounts (id, name, type, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [generateUUID(), acc.name, acc.type, acc.balance, now, now]
      );
    });
  }

  // Seed Default Savings Bucket
  const bucketRes = execQuery('SELECT COUNT(*) as count FROM savings_buckets');
  if (bucketRes[0]?.count === 0) {
    execRun(
      'INSERT INTO savings_buckets (id, name, allocated_balance, icon, color, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [generateUUID(), DEFAULT_BUCKET.name, DEFAULT_BUCKET.allocated_balance, DEFAULT_BUCKET.icon, DEFAULT_BUCKET.color, DEFAULT_BUCKET.is_archived, now, now]
    );
  }
}

// Execute SELECT query returning array of plain objects
export function execQuery(sql, params = []) {
  if (!db) return [];
  try {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (e) {
    console.error("SQL ExecQuery Error:", e, sql, params);
    throw e;
  }
}

// Execute INSERT/UPDATE/DELETE query
export function execRun(sql, params = []) {
  if (!db) return;
  try {
    db.run(sql, params);
    persistCurrentDatabase();
  } catch (e) {
    console.error("SQL ExecRun Error:", e, sql, params);
    throw e;
  }
}

// Multi-Vault Management Methods
export function getActiveVaultName() {
  return activeVaultFilename;
}

export function listVaults() {
  const vaults = getSavedVaultsList();
  return vaults.map(v => ({
    filename: v.filename,
    name: v.name,
    size_bytes: v.size_bytes || 0,
    updated_at: v.updated_at || Date.now(),
    is_active: v.filename === activeVaultFilename
  }));
}

export function createNewVault(name) {
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${cleanName}.db`;
  const displayName = name.trim();

  const vaults = getSavedVaultsList();
  const existing = vaults.find(v => v.filename === filename);
  if (!existing) {
    vaults.push({
      filename,
      name: displayName,
      is_active: false,
      size_bytes: 0,
      updated_at: Date.now()
    });
    saveVaultsList(vaults);
  }

  loadVault(filename);
  return filename;
}

export function switchActiveVault(filename) {
  const vaults = getSavedVaultsList();
  const target = vaults.find(v => v.filename === filename);
  if (!target) throw new Error(`Vault '${filename}' not found.`);

  loadVault(filename);
  return filename;
}

export function deleteVault(filename) {
  if (filename === activeVaultFilename) {
    throw new Error("Cannot delete currently active vault.");
  }
  localStorage.removeItem(`${VAULT_DATA_PREFIX}${filename}`);
  let vaults = getSavedVaultsList();
  vaults = vaults.filter(v => v.filename !== filename);
  saveVaultsList(vaults);
  return true;
}

// Export database Uint8Array binary for 1-click download on phone
export function exportActiveDatabaseBlob() {
  if (!db) return null;
  return db.export();
}

// Import external .db Uint8Array binary on phone
export function importDatabaseBlob(filename, uint8Array) {
  const cleanName = filename.toLowerCase().endsWith('.db') ? filename : `${filename}.db`;
  const base64 = Uint8ArrayToBase64(uint8Array);
  localStorage.setItem(`${VAULT_DATA_PREFIX}${cleanName}`, base64);

  const vaults = getSavedVaultsList();
  const existing = vaults.find(v => v.filename === cleanName);
  if (!existing) {
    vaults.push({
      filename: cleanName,
      name: cleanName.replace('.db', '').charAt(0).toUpperCase() + cleanName.replace('.db', '').slice(1),
      is_active: false,
      size_bytes: uint8Array.length,
      updated_at: Date.now()
    });
    saveVaultsList(vaults);
  }

  loadVault(cleanName);
  return cleanName;
}
