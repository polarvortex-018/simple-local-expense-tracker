import {
  initDatabaseEngine,
  execQuery,
  execRun,
  generateUUID,
  listVaults,
  createNewVault,
  switchActiveVault,
  deleteVault as removeVault,
  exportActiveDatabaseBlob,
  importDatabaseBlob
} from './db/local_sqlite.js';

let isEngineInitialized = false;

async function ensureDB() {
  if (!isEngineInitialized) {
    await initDatabaseEngine();
    isEngineInitialized = true;
  }
}

export const api = {
  async init() {
    await ensureDB();
  },

  // ----------------------------------------------------
  // TRANSACTIONS
  // ----------------------------------------------------
  async getTransactions(params = {}) {
    await ensureDB();
    
    let sql = `
      SELECT 
        t.id, t.amount, t.transaction_type, t.description, t.date,
        t.account_id, t.bucket_id, t.category_id, t.created_at, t.updated_at,
        a.name as account_name,
        c.name as category_name, c.color as category_color,
        b.name as bucket_name, b.icon as bucket_icon, b.color as bucket_color
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN savings_buckets b ON t.bucket_id = b.id
      WHERE 1=1
    `;
    const sqlParams = [];

    if (params.search) {
      sql += ` AND (t.description LIKE ? OR a.name LIKE ? OR c.name LIKE ? OR b.name LIKE ?)`;
      const term = `%${params.search}%`;
      sqlParams.push(term, term, term, term);
    }

    if (params.account_id) {
      sql += ` AND t.account_id = ?`;
      sqlParams.push(params.account_id);
    }

    if (params.bucket_id) {
      sql += ` AND t.bucket_id = ?`;
      sqlParams.push(params.bucket_id);
    }

    if (params.category_id) {
      const catIds = Array.isArray(params.category_id) ? params.category_id : [params.category_id];
      if (catIds.length > 0) {
        const placeholders = catIds.map(() => '?').join(',');
        sql += ` AND t.category_id IN (${placeholders})`;
        sqlParams.push(...catIds);
      }
    }

    if (params.transaction_type) {
      sql += ` AND t.transaction_type = ?`;
      sqlParams.push(params.transaction_type);
    }

    if (params.start_date) {
      sql += ` AND t.date >= ?`;
      sqlParams.push(params.start_date);
    }

    if (params.end_date) {
      sql += ` AND t.date <= ?`;
      sqlParams.push(params.end_date);
    }

    sql += ` ORDER BY t.date DESC, t.created_at DESC`;

    if (params.limit) {
      const limit = parseInt(params.limit);
      const skip = parseInt(params.skip || 0);
      sql += ` LIMIT ? OFFSET ?`;
      sqlParams.push(limit, skip);
    }

    const rows = execQuery(sql, sqlParams);
    return rows.map(r => ({
      id: r.id,
      amount: r.amount,
      transaction_type: r.transaction_type,
      description: r.description,
      date: r.date,
      account_id: r.account_id,
      bucket_id: r.bucket_id,
      category_id: r.category_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      account: r.account_name ? { id: r.account_id, name: r.account_name } : null,
      category: r.category_name ? { id: r.category_id, name: r.category_name, color: r.category_color } : null,
      bucket: r.bucket_name ? { id: r.bucket_id, name: r.bucket_name, icon: r.bucket_icon, color: r.bucket_color } : null
    }));
  },

  async getTransactionSummary(params = {}) {
    await ensureDB();
    const txs = await this.getTransactions(params);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotalsMap = {};

    txs.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.transaction_type === 'income') {
        totalIncome += amt;
      } else if (t.transaction_type === 'expense') {
        totalExpense += amt;
        const catName = t.category?.name || 'Uncategorized';
        const catColor = t.category?.color || '#64748b';
        if (!categoryTotalsMap[catName]) {
          categoryTotalsMap[catName] = { name: catName, color: catColor, total: 0 };
        }
        categoryTotalsMap[catName].total += amt;
      }
    });

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      net_savings: totalIncome - totalExpense,
      categories_breakdown: Object.values(categoryTotalsMap).sort((a, b) => b.total - a.total)
    };
  },

  async createTransaction(payload) {
    await ensureDB();
    const id = generateUUID();
    const now = new Date().toISOString();
    const amount = Number(payload.amount);
    const type = payload.transaction_type;

    if (!amount || amount <= 0) throw new Error("Amount must be a positive number.");
    if (!payload.account_id) throw new Error("Account is required.");

    // Update Account Balance
    const accRows = execQuery('SELECT * FROM accounts WHERE id = ?', [payload.account_id]);
    if (!accRows.length) throw new Error("Target account not found.");
    const currentAccBalance = Number(accRows[0].balance) || 0;
    const newAccBalance = type === 'expense' ? currentAccBalance - amount : currentAccBalance + amount;
    execRun('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', [newAccBalance, now, payload.account_id]);

    // Update Savings Bucket Allocation (if bucket_id specified)
    if (payload.bucket_id) {
      const bucketRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [payload.bucket_id]);
      if (bucketRows.length) {
        const currentBucketAlloc = Number(bucketRows[0].allocated_balance) || 0;
        const newBucketAlloc = type === 'expense' ? currentBucketAlloc - amount : currentBucketAlloc + amount;
        execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [newBucketAlloc, now, payload.bucket_id]);
      }
    }

    // Insert Transaction Record
    execRun(
      `INSERT INTO transactions (id, amount, transaction_type, description, date, account_id, bucket_id, category_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, amount, type, payload.description || null, payload.date, payload.account_id, payload.bucket_id || null, payload.category_id || null, now, now]
    );

    const created = await this.getTransactions({ limit: 1 });
    return created[0];
  },

  async updateTransaction(id, payload) {
    await ensureDB();
    const existingRows = execQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existingRows.length) throw new Error("Transaction not found.");
    const oldTx = existingRows[0];

    // Revert Old Transaction Impact
    const oldAmount = Number(oldTx.amount);
    const oldType = oldTx.transaction_type;
    const oldAccRows = execQuery('SELECT * FROM accounts WHERE id = ?', [oldTx.account_id]);
    if (oldAccRows.length) {
      const bal = Number(oldAccRows[0].balance);
      const revertedBal = oldType === 'expense' ? bal + oldAmount : bal - oldAmount;
      execRun('UPDATE accounts SET balance = ? WHERE id = ?', [revertedBal, oldTx.account_id]);
    }
    if (oldTx.bucket_id) {
      const oldBucketRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [oldTx.bucket_id]);
      if (oldBucketRows.length) {
        const alloc = Number(oldBucketRows[0].allocated_balance);
        const revertedAlloc = oldType === 'expense' ? alloc + oldAmount : alloc - oldAmount;
        execRun('UPDATE savings_buckets SET allocated_balance = ? WHERE id = ?', [revertedAlloc, oldTx.bucket_id]);
      }
    }

    // Apply New Transaction Impact
    const now = new Date().toISOString();
    const newAmount = Number(payload.amount);
    const newType = payload.transaction_type;

    const newAccRows = execQuery('SELECT * FROM accounts WHERE id = ?', [payload.account_id]);
    if (newAccRows.length) {
      const bal = Number(newAccRows[0].balance);
      const appliedBal = newType === 'expense' ? bal - newAmount : bal + newAmount;
      execRun('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', [appliedBal, now, payload.account_id]);
    }
    if (payload.bucket_id) {
      const newBucketRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [payload.bucket_id]);
      if (newBucketRows.length) {
        const alloc = Number(newBucketRows[0].allocated_balance);
        const appliedAlloc = newType === 'expense' ? alloc - newAmount : alloc + newAmount;
        execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [appliedAlloc, now, payload.bucket_id]);
      }
    }

    execRun(
      `UPDATE transactions 
       SET amount = ?, transaction_type = ?, description = ?, date = ?, account_id = ?, bucket_id = ?, category_id = ?, updated_at = ?
       WHERE id = ?`,
      [newAmount, newType, payload.description || null, payload.date, payload.account_id, payload.bucket_id || null, payload.category_id || null, now, id]
    );

    return { id, ...payload };
  },

  async deleteTransaction(id) {
    await ensureDB();
    const existingRows = execQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existingRows.length) return null;
    const oldTx = existingRows[0];

    // Revert Account & Bucket impact
    const oldAmount = Number(oldTx.amount);
    const oldType = oldTx.transaction_type;
    const oldAccRows = execQuery('SELECT * FROM accounts WHERE id = ?', [oldTx.account_id]);
    if (oldAccRows.length) {
      const bal = Number(oldAccRows[0].balance);
      const revertedBal = oldType === 'expense' ? bal + oldAmount : bal - oldAmount;
      execRun('UPDATE accounts SET balance = ? WHERE id = ?', [revertedBal, oldTx.account_id]);
    }
    if (oldTx.bucket_id) {
      const oldBucketRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [oldTx.bucket_id]);
      if (oldBucketRows.length) {
        const alloc = Number(oldBucketRows[0].allocated_balance);
        const revertedAlloc = oldType === 'expense' ? alloc + oldAmount : alloc - oldAmount;
        execRun('UPDATE savings_buckets SET allocated_balance = ? WHERE id = ?', [revertedAlloc, oldTx.bucket_id]);
      }
    }

    execRun('DELETE FROM transactions WHERE id = ?', [id]);
    return { status: "deleted" };
  },

  // ----------------------------------------------------
  // ACCOUNTS
  // ----------------------------------------------------
  async getAccounts() {
    await ensureDB();
    return execQuery('SELECT * FROM accounts ORDER BY created_at ASC');
  },

  async createAccount(payload) {
    await ensureDB();
    const id = generateUUID();
    const now = new Date().toISOString();
    execRun(
      'INSERT INTO accounts (id, name, type, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, payload.name.trim(), payload.type, payload.balance || 0.0, now, now]
    );
    const rows = execQuery('SELECT * FROM accounts WHERE id = ?', [id]);
    return rows[0];
  },

  async updateAccount(id, payload) {
    await ensureDB();
    const now = new Date().toISOString();
    execRun(
      'UPDATE accounts SET name = ?, type = ?, updated_at = ? WHERE id = ?',
      [payload.name.trim(), payload.type, now, id]
    );
    const rows = execQuery('SELECT * FROM accounts WHERE id = ?', [id]);
    return rows[0];
  },

  async deleteAccount(id) {
    await ensureDB();
    execRun('DELETE FROM accounts WHERE id = ?', [id]);
    return { status: "deleted" };
  },

  // ----------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------
  async getCategories() {
    await ensureDB();
    return execQuery('SELECT * FROM categories ORDER BY name ASC');
  },

  async createCategory(payload) {
    await ensureDB();
    const id = generateUUID();
    const now = new Date().toISOString();
    execRun(
      'INSERT INTO categories (id, name, color, icon, is_quick_select, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, payload.name.trim(), payload.color || '#6366f1', payload.icon || '🏷️', payload.is_quick_select ? 1 : 0, now, now]
    );
    const rows = execQuery('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
  },

  async updateCategory(id, payload) {
    await ensureDB();
    const now = new Date().toISOString();
    execRun(
      'UPDATE categories SET name = ?, color = ?, icon = ?, is_quick_select = ?, updated_at = ? WHERE id = ?',
      [payload.name.trim(), payload.color || '#6366f1', payload.icon || '🏷️', payload.is_quick_select ? 1 : 0, now, id]
    );
    const rows = execQuery('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
  },

  async deleteCategory(id) {
    await ensureDB();
    execRun('DELETE FROM categories WHERE id = ?', [id]);
    return { status: "deleted" };
  },

  // ----------------------------------------------------
  // SAVINGS BUCKETS
  // ----------------------------------------------------
  async getBuckets(includeArchived = false) {
    await ensureDB();
    if (includeArchived) {
      return execQuery('SELECT * FROM savings_buckets ORDER BY is_archived ASC, sort_order ASC, created_at ASC');
    }
    return execQuery('SELECT * FROM savings_buckets WHERE is_archived = 0 ORDER BY sort_order ASC, created_at ASC');
  },

  async updateBucketSortOrder(bucketIds) {
    await ensureDB();
    const now = new Date().toISOString();
    bucketIds.forEach((id, idx) => {
      execRun('UPDATE savings_buckets SET sort_order = ?, updated_at = ? WHERE id = ?', [idx, now, id]);
    });
    return this.getBuckets(true);
  },

  async createBucket(payload) {
    await ensureDB();
    const id = generateUUID();
    const now = new Date().toISOString();
    execRun(
      'INSERT INTO savings_buckets (id, name, allocated_balance, target_amount, icon, color, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, payload.name.trim(), payload.allocated_balance || 0.0, payload.target_amount || null, payload.icon || '🪣', payload.color || '#6366f1', 0, now, now]
    );
    const rows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [id]);
    return rows[0];
  },

  async updateBucket(id, payload) {
    await ensureDB();
    const now = new Date().toISOString();
    execRun(
      'UPDATE savings_buckets SET name = ?, icon = ?, color = ?, is_archived = ?, updated_at = ? WHERE id = ?',
      [payload.name.trim(), payload.icon || '🪣', payload.color || '#6366f1', payload.is_archived ? 1 : 0, now, id]
    );
    const rows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [id]);
    return rows[0];
  },

  async deleteBucket(id) {
    await ensureDB();
    execRun('UPDATE savings_buckets SET is_archived = 1 WHERE id = ?', [id]);
    return { status: "archived" };
  },

  async transferBucket(payload) {
    await ensureDB();
    const { from_bucket_id, to_bucket_id, amount } = payload;
    const transferAmt = Number(amount);
    if (!transferAmt || transferAmt <= 0) throw new Error("Transfer amount must be positive.");

    const fromRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [from_bucket_id]);
    const toRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [to_bucket_id]);
    if (!fromRows.length || !toRows.length) throw new Error("Source or destination bucket not found.");

    const fromAlloc = Number(fromRows[0].allocated_balance) || 0;
    const toAlloc = Number(toRows[0].allocated_balance) || 0;

    const now = new Date().toISOString();
    execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [fromAlloc - transferAmt, now, from_bucket_id]);
    execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [toAlloc + transferAmt, now, to_bucket_id]);

    return { status: "transferred" };
  },

  // ----------------------------------------------------
  // DEBTS
  // ----------------------------------------------------
  async getDebts() {
    await ensureDB();
    return execQuery(`
      SELECT d.*, a.name as account_name
      FROM debts d
      LEFT JOIN accounts a ON d.account_id = a.id
      ORDER BY d.created_at DESC
    `);
  },

  async createDebt(payload) {
    await ensureDB();
    const id = generateUUID();
    const now = new Date().toISOString();
    execRun(
      'INSERT INTO debts (id, person_name, amount, debt_type, description, due_date, is_settled, account_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, payload.person_name.trim(), Number(payload.amount), payload.debt_type, payload.description || null, payload.due_date || null, 0, payload.account_id || null, now, now]
    );
    const rows = execQuery('SELECT * FROM debts WHERE id = ?', [id]);
    return rows[0];
  },

  async settleDebt(id, payload = {}) {
    await ensureDB();
    const now = new Date().toISOString();
    execRun('UPDATE debts SET is_settled = 1, updated_at = ? WHERE id = ?', [now, id]);
    const rows = execQuery('SELECT * FROM debts WHERE id = ?', [id]);
    return rows[0];
  },

  async deleteDebt(id) {
    await ensureDB();
    execRun('DELETE FROM debts WHERE id = ?', [id]);
    return { status: "deleted" };
  },

  // ----------------------------------------------------
  // VAULTS MANAGEMENT (ON-PHONE)
  // ----------------------------------------------------
  async getVaults() {
    await ensureDB();
    return listVaults();
  },

  async createVault(name) {
    await ensureDB();
    const filename = createNewVault(name);
    return { active_vault: filename, vaults: listVaults() };
  },

  async switchVault(filename) {
    await ensureDB();
    switchActiveVault(filename);
    return { active_vault: filename, vaults: listVaults() };
  },

  async importVault(file) {
    await ensureDB();
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const filename = importDatabaseBlob(file.name, uint8Array);
    return { active_vault: filename, vaults: listVaults() };
  },

  async deleteVault(filename) {
    await ensureDB();
    removeVault(filename);
    return { vaults: listVaults() };
  },

  // ----------------------------------------------------
  // BACKUP & EXPORT (ON-PHONE)
  // ----------------------------------------------------
  exportDatabaseUrl() {
    // Generate Blob URL dynamically for 1-click download on phone
    const binary = exportActiveDatabaseBlob();
    if (!binary) return '#';
    const blob = new Blob([binary], { type: 'application/x-sqlite3' });
    return URL.createObjectURL(blob);
  },

  async createBackup() {
    await ensureDB();
    const binary = exportActiveDatabaseBlob();
    if (!binary) throw new Error("Could not export database.");
    const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const backupFilename = `backup_finance_${dateStr}.db`;
    importDatabaseBlob(backupFilename, binary);
    return { backup_filename: backupFilename, message: "Backup snapshot saved locally." };
  },

  async getBackups() {
    await ensureDB();
    const vaults = listVaults();
    return vaults.filter(v => v.filename.startsWith('backup_'));
  },

  async restoreBackup(filename) {
    await ensureDB();
    switchActiveVault(filename);
    return { active_vault: filename, message: "Database restored from backup." };
  }
};
