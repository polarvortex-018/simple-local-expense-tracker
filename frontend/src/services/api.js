import {
  initDatabaseEngine,
  execQuery,
  execRun,
  runInTransaction,
  generateUUID,
  listVaults,
  createNewVault,
  switchActiveVault,
  deleteVault as removeVault,
  renameVault,
  exportActiveDatabaseBlob,
  exportDatabaseBlobByName,
  importDatabaseBlob,
  createBackupSnapshot,
  listBackupSnapshots,
  restoreBackupSnapshot,
  exportBackupBytes,
  checkDatabaseIntegrity
} from './db/local_sqlite.js';

let isEngineInitialized = false;

async function ensureDB() {
  if (!isEngineInitialized) {
    await initDatabaseEngine();
    isEngineInitialized = true;
  }
}

function transactionMultiplier(type, adjustmentDirection) {
  if (type === 'expense') return -1;
  if (type === 'income') return 1;
  if (type === 'adjustment') return adjustmentDirection === 'subtract' ? -1 : 1;
  throw new Error('Invalid transaction type.');
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
        t.id, t.amount, t.transaction_type, t.adjustment_direction, t.description, t.date,
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

    sql += ` ORDER BY t.date DESC, t.created_at DESC, t.id DESC`;

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
      adjustment_direction: r.adjustment_direction,
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
      total_count: txs.length,
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
    if (!['income', 'expense', 'adjustment'].includes(type)) throw new Error('Invalid transaction type.');
    if (type === 'adjustment' && !['add', 'subtract'].includes(payload.adjustment_direction)) throw new Error('Choose whether the adjustment adds or subtracts money.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date || '')) throw new Error('A valid transaction date is required.');
    if (!payload.account_id) throw new Error("Account is required.");

    return runInTransaction(async () => {
    // Update Account Balance
    const accRows = execQuery('SELECT * FROM accounts WHERE id = ?', [payload.account_id]);
    if (!accRows.length) throw new Error("Target account not found.");
    const currentAccBalance = Number(accRows[0].balance) || 0;
    const multiplier = transactionMultiplier(type, payload.adjustment_direction);
    const newAccBalance = currentAccBalance + (amount * multiplier);
    execRun('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', [newAccBalance, now, payload.account_id], false);

    // Update Savings Bucket Allocation (if bucket_id specified)
    if (payload.bucket_id) {
      const bucketRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [payload.bucket_id]);
      if (bucketRows.length) {
        const currentBucketAlloc = Number(bucketRows[0].allocated_balance) || 0;
        const newBucketAlloc = currentBucketAlloc + (amount * multiplier);
        execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [newBucketAlloc, now, payload.bucket_id], false);
      }
    }

    // Insert Transaction Record
    execRun(
      `INSERT INTO transactions (id, amount, transaction_type, adjustment_direction, description, date, account_id, bucket_id, category_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, amount, type, type === 'adjustment' ? payload.adjustment_direction : null, payload.description || null, payload.date, payload.account_id, payload.bucket_id || null, payload.category_id || null, now, now], false
    );

    const created = await this.getTransactions({ limit: 1 });
    return created[0];
    });
  },

  async updateTransaction(id, payload) {
    await ensureDB();
    const existingRows = execQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existingRows.length) throw new Error("Transaction not found.");
    const oldTx = existingRows[0];
    const newAmount = Number(payload.amount);
    if (!Number.isFinite(newAmount) || newAmount <= 0) throw new Error('Amount must be a positive number.');
    if (!['income', 'expense', 'adjustment'].includes(payload.transaction_type)) throw new Error('Invalid transaction type.');
    if (payload.transaction_type === 'adjustment' && !['add', 'subtract'].includes(payload.adjustment_direction)) throw new Error('Choose whether the adjustment adds or subtracts money.');
    if (!execQuery('SELECT id FROM accounts WHERE id = ?', [payload.account_id]).length) throw new Error('Target account not found.');
    return runInTransaction(async () => {

    // Revert Old Transaction Impact
    const oldAmount = Number(oldTx.amount);
    const oldType = oldTx.transaction_type;
    const oldAccRows = execQuery('SELECT * FROM accounts WHERE id = ?', [oldTx.account_id]);
    if (oldAccRows.length) {
      const bal = Number(oldAccRows[0].balance);
      const revertedBal = bal - (oldAmount * transactionMultiplier(oldType, oldTx.adjustment_direction));
      execRun('UPDATE accounts SET balance = ? WHERE id = ?', [revertedBal, oldTx.account_id], false);
    }
    if (oldTx.bucket_id) {
      const oldBucketRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [oldTx.bucket_id]);
      if (oldBucketRows.length) {
        const alloc = Number(oldBucketRows[0].allocated_balance);
        const revertedAlloc = alloc - (oldAmount * transactionMultiplier(oldType, oldTx.adjustment_direction));
        execRun('UPDATE savings_buckets SET allocated_balance = ? WHERE id = ?', [revertedAlloc, oldTx.bucket_id], false);
      }
    }

    // Apply New Transaction Impact
    const now = new Date().toISOString();
    const newType = payload.transaction_type;

    const newAccRows = execQuery('SELECT * FROM accounts WHERE id = ?', [payload.account_id]);
    if (newAccRows.length) {
      const bal = Number(newAccRows[0].balance);
      const appliedBal = bal + (newAmount * transactionMultiplier(newType, payload.adjustment_direction));
      execRun('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', [appliedBal, now, payload.account_id], false);
    }
    if (payload.bucket_id) {
      const newBucketRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [payload.bucket_id]);
      if (newBucketRows.length) {
        const alloc = Number(newBucketRows[0].allocated_balance);
        const appliedAlloc = alloc + (newAmount * transactionMultiplier(newType, payload.adjustment_direction));
        execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [appliedAlloc, now, payload.bucket_id], false);
      }
    }

    execRun(
      `UPDATE transactions 
       SET amount = ?, transaction_type = ?, adjustment_direction = ?, description = ?, date = ?, account_id = ?, bucket_id = ?, category_id = ?, updated_at = ?
       WHERE id = ?`,
      [newAmount, newType, newType === 'adjustment' ? payload.adjustment_direction : null, payload.description || null, payload.date, payload.account_id, payload.bucket_id || null, payload.category_id || null, now, id], false
    );

    return { id, ...payload };
    });
  },

  async deleteTransaction(id) {
    await ensureDB();
    const existingRows = execQuery('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existingRows.length) return null;
    const oldTx = existingRows[0];
    return runInTransaction(async () => {

    // Revert Account & Bucket impact
    const oldAmount = Number(oldTx.amount);
    const oldType = oldTx.transaction_type;
    const oldAccRows = execQuery('SELECT * FROM accounts WHERE id = ?', [oldTx.account_id]);
    if (oldAccRows.length) {
      const bal = Number(oldAccRows[0].balance);
      const revertedBal = bal - (oldAmount * transactionMultiplier(oldType, oldTx.adjustment_direction));
      execRun('UPDATE accounts SET balance = ? WHERE id = ?', [revertedBal, oldTx.account_id], false);
    }
    if (oldTx.bucket_id) {
      const oldBucketRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [oldTx.bucket_id]);
      if (oldBucketRows.length) {
        const alloc = Number(oldBucketRows[0].allocated_balance);
        const revertedAlloc = alloc - (oldAmount * transactionMultiplier(oldType, oldTx.adjustment_direction));
        execRun('UPDATE savings_buckets SET allocated_balance = ? WHERE id = ?', [revertedAlloc, oldTx.bucket_id], false);
      }
    }

    execRun('DELETE FROM transactions WHERE id = ?', [id], false);
    return { status: "deleted" };
    });
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
    if (!String(payload.name || '').trim()) throw new Error('Account name is required.');
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
    const usage = execQuery('SELECT COUNT(*) count FROM transactions WHERE account_id = ?', [id])[0]?.count || 0;
    if (usage > 0) throw new Error(`This account is used by ${usage} transaction(s) and cannot be deleted. Rename it or keep it for historical accuracy.`);
    execRun('DELETE FROM accounts WHERE id = ?', [id]);
    return { status: "deleted" };
  },

  // ----------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------
  async getCategories() {
    await ensureDB();
    return execQuery('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
  },

  async updateCategorySortOrder(categoryIds) {
    await ensureDB();
    const now = new Date().toISOString();
    categoryIds.forEach((id, idx) => {
      execRun('UPDATE categories SET sort_order = ?, updated_at = ? WHERE id = ?', [idx, now, id]);
    });
    return this.getCategories();
  },

  async createCategory(payload) {
    await ensureDB();
    if (!String(payload.name || '').trim()) throw new Error('Category name is required.');
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
    if (!String(payload.name || '').trim()) throw new Error('Bucket name is required.');
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
    const bucket = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [id])[0];
    if (!bucket) throw new Error('Savings bucket not found.');
    return runInTransaction(async () => {
      // Preserve ledger and debt history while removing the deleted purpose.
      execRun('UPDATE transactions SET bucket_id = NULL WHERE bucket_id = ?', [id], false);
      execRun('UPDATE debts SET bucket_id = NULL WHERE bucket_id = ?', [id], false);
      execRun('DELETE FROM savings_buckets WHERE id = ?', [id], false);
      return { status: 'deleted', removed_allocation: Number(bucket.allocated_balance) || 0 };
    });
  },

  async transferBucket(payload) {
    await ensureDB();
    const { from_bucket_id, to_bucket_id, amount } = payload;
    const transferAmt = Number(amount);
    if (!transferAmt || transferAmt <= 0) throw new Error("Transfer amount must be positive.");
    if (to_bucket_id && from_bucket_id === to_bucket_id) throw new Error('Source and destination buckets must be different.');

    const fromRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [from_bucket_id]);
    if (!fromRows.length) throw new Error("Source bucket not found.");
    const fromAlloc = Number(fromRows[0].allocated_balance) || 0;
    if (transferAmt > fromAlloc) throw new Error('Transfer amount exceeds the source bucket balance.');

    const now = new Date().toISOString();
    return runInTransaction(async () => {
      execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [fromAlloc - transferAmt, now, from_bucket_id], false);
      if (to_bucket_id) {
        // Transfer to another bucket
        const toRows = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [to_bucket_id]);
        if (!toRows.length) throw new Error("Destination bucket not found.");
        const toAlloc = Number(toRows[0].allocated_balance) || 0;
        execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [toAlloc + transferAmt, now, to_bucket_id], false);
      }
      // if to_bucket_id is null → money returns to unassigned pool (no bucket row to update)
      return { status: "transferred" };
    });
  },

  // ----------------------------------------------------
  // ACCOUNT-TO-ACCOUNT TRANSFER
  // ----------------------------------------------------
  async transferBetweenAccounts(payload) {
    await ensureDB();
    const { from_account_id, to_account_id, bucket_id, amount, description } = payload;
    const transferAmt = Number(amount);
    if (!transferAmt || transferAmt <= 0) throw new Error("Transfer amount must be positive.");
    if (from_account_id === to_account_id) throw new Error('Source and destination accounts must be different.');

    const fromAcc = execQuery('SELECT * FROM accounts WHERE id = ?', [from_account_id])[0];
    const toAcc = execQuery('SELECT * FROM accounts WHERE id = ?', [to_account_id])[0];
    if (!fromAcc || !toAcc) throw new Error("One or both accounts not found.");
    if (Number(fromAcc.balance) < transferAmt) throw new Error(`Insufficient balance in source account (₹${Number(fromAcc.balance).toFixed(2)} available).`);

    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const desc = description?.trim() || `Transfer: ${fromAcc.name} → ${toAcc.name}`;

    return runInTransaction(async () => {
      // Deduct from source account
      execRun('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', [Number(fromAcc.balance) - transferAmt, now, from_account_id], false);
      // Add to destination account
      execRun('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', [Number(toAcc.balance) + transferAmt, now, to_account_id], false);

      // Bucket impact — the money stays allocated to the same bucket, just moves accounts
      // We record two adjustment transactions for full ledger traceability
      const outId = generateUUID();
      const inId = generateUUID();
      execRun(
        `INSERT INTO transactions (id, amount, transaction_type, adjustment_direction, description, date, account_id, bucket_id, category_id, created_at, updated_at)
         VALUES (?, ?, 'adjustment', 'subtract', ?, ?, ?, ?, NULL, ?, ?)`,
        [outId, transferAmt, desc, today, from_account_id, bucket_id || null, now, now], false
      );
      execRun(
        `INSERT INTO transactions (id, amount, transaction_type, adjustment_direction, description, date, account_id, bucket_id, category_id, created_at, updated_at)
         VALUES (?, ?, 'adjustment', 'add', ?, ?, ?, ?, NULL, ?, ?)`,
        [inId, transferAmt, desc, today, to_account_id, bucket_id || null, now, now], false
      );

      // If a bucket was specified, the balance within the bucket doesn't change
      // (same money, just moved between accounts — net bucket impact is 0)
      // But we do need to cancel out the bucket allocation adjustment since both
      // adjustments would double-count. Keep allocation flat.
      if (bucket_id) {
        const bucket = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [bucket_id])[0];
        if (bucket) {
          // The two transactions cancel each other on bucket allocation (−amount + amount = 0)
          // So no UPDATE needed on savings_buckets. The transactions are just ledger records.
        }
      }

      return { status: 'transferred', from: fromAcc.name, to: toAcc.name, amount: transferAmt };
    });
  },

  // ----------------------------------------------------
  // ALLOCATION PRESETS
  // ----------------------------------------------------
  async getPresets() {
    await ensureDB();
    const presets = execQuery('SELECT * FROM allocation_presets ORDER BY updated_at DESC');
    return presets.map(p => ({
      ...p,
      rules: execQuery('SELECT * FROM allocation_preset_rules WHERE preset_id = ? ORDER BY rowid ASC', [p.id])
    }));
  },

  async createPreset(payload) {
    await ensureDB();
    if (!String(payload.name || '').trim()) throw new Error('Preset name is required.');
    if (!Array.isArray(payload.rules) || payload.rules.length === 0) throw new Error('At least one rule is required.');
    const id = generateUUID();
    const now = new Date().toISOString();
    return runInTransaction(async () => {
      execRun('INSERT INTO allocation_presets (id, name, mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [id, payload.name.trim(), payload.mode || 'percentage', now, now], false);
      for (const rule of payload.rules) {
        const val = Number(rule.value);
        if (!val || val <= 0) throw new Error('Each rule value must be a positive number.');
        execRun(
          'INSERT INTO allocation_preset_rules (id, preset_id, bucket_id, account_id, category_id, mode, value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [generateUUID(), id, rule.bucket_id || null, rule.account_id || null, rule.category_id || null, payload.mode || 'percentage', val, now], false
        );
      }
      const preset = execQuery('SELECT * FROM allocation_presets WHERE id = ?', [id])[0];
      return { ...preset, rules: execQuery('SELECT * FROM allocation_preset_rules WHERE preset_id = ?', [id]) };
    });
  },

  async updatePreset(id, payload) {
    await ensureDB();
    const now = new Date().toISOString();
    return runInTransaction(async () => {
      if (payload.name) execRun('UPDATE allocation_presets SET name = ?, mode = ?, updated_at = ? WHERE id = ?', [payload.name.trim(), payload.mode || 'percentage', now, id], false);
      if (Array.isArray(payload.rules)) {
        execRun('DELETE FROM allocation_preset_rules WHERE preset_id = ?', [id], false);
        for (const rule of payload.rules) {
          const val = Number(rule.value);
          if (!val || val <= 0) throw new Error('Each rule value must be a positive number.');
          execRun(
            'INSERT INTO allocation_preset_rules (id, preset_id, bucket_id, account_id, category_id, mode, value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [generateUUID(), id, rule.bucket_id || null, rule.account_id || null, rule.category_id || null, payload.mode || 'percentage', val, now], false
          );
        }
      }
      const preset = execQuery('SELECT * FROM allocation_presets WHERE id = ?', [id])[0];
      return { ...preset, rules: execQuery('SELECT * FROM allocation_preset_rules WHERE preset_id = ?', [id]) };
    });
  },

  async deletePreset(id) {
    await ensureDB();
    execRun('DELETE FROM allocation_presets WHERE id = ?', [id]);
    return { status: 'deleted' };
  },

  async applyPreset(id, payload) {
    await ensureDB();
    const { total_amount, source_account_id, source_bucket_id, description } = payload;
    
    const preset = execQuery('SELECT * FROM allocation_presets WHERE id = ?', [id])[0];
    if (!preset) throw new Error('Preset not found.');
    
    const actualSourceAccountId = (!source_bucket_id || source_bucket_id === '') ? 'acc_unassigned_pool' : source_account_id;
    const sourceAcc = execQuery('SELECT * FROM accounts WHERE id = ?', [actualSourceAccountId])[0];
    if (!sourceAcc) throw new Error('Source account not found.');

    const mode = preset.mode || 'percentage';
    const rules = execQuery('SELECT * FROM allocation_preset_rules WHERE preset_id = ?', [id]);
    if (!rules.length) throw new Error('This preset has no rules configured.');

    let total = 0;
    if (mode === 'percentage') {
      total = Number(total_amount);
      if (!total || total <= 0) throw new Error('Total amount must be positive.');
    } else {
      total = rules.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
    }

    if (sourceAcc.balance < total) {
      const srcName = sourceAcc.id === 'acc_unassigned_pool' ? 'Unassigned Cash Pool' : sourceAcc.name;
      throw new Error(`Allocation amount (₹${total.toFixed(2)}) exceeds ${srcName} balance (₹${sourceAcc.balance.toFixed(2)}).`);
    }

    // Check source bucket balance if drawing from a specific bucket
    let sourceBucket = null;
    if (source_bucket_id) {
      sourceBucket = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [source_bucket_id])[0];
      if (!sourceBucket) throw new Error('Source bucket not found.');
      if (sourceBucket.allocated_balance < total) {
        throw new Error(`Allocation amount (₹${total.toFixed(2)}) exceeds source bucket balance (₹${sourceBucket.allocated_balance.toFixed(2)}).`);
      }
    }

    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const desc = description?.trim() || `Salary allocation: ${preset.name}`;

    return runInTransaction(async () => {
      const distributions = [];

      // Deduct from source bucket if drawing from a specific bucket
      if (source_bucket_id) {
        execRun('UPDATE savings_buckets SET allocated_balance = allocated_balance - ?, updated_at = ? WHERE id = ?',
          [total, now, source_bucket_id], false);
      }

      for (const rule of rules) {
        if (!rule.account_id) throw new Error('Each rule must have an account destination.');
        const share = mode === 'percentage' ? (total * rule.value / 100) : rule.value;
        const rounded = Math.round(share * 100) / 100;
        if (rounded <= 0) continue;

        // 1. Allocate to target bucket (if any)
        if (rule.bucket_id) {
          execRun('UPDATE savings_buckets SET allocated_balance = allocated_balance + ?, updated_at = ? WHERE id = ?',
            [rounded, now, rule.bucket_id], false);
          distributions.push({ bucket_id: rule.bucket_id, amount: rounded });
        }

        // Skip if source and destination are identical
        if (rule.account_id === actualSourceAccountId && (rule.bucket_id || null) === (source_bucket_id || null)) {
          continue;
        }

        // 2. Physical transfer logic
        if (rule.account_id !== actualSourceAccountId) {
          // Deduct from source account
          execRun('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?', [rounded, now, actualSourceAccountId], false);
          // Add to target account
          execRun('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?', [rounded, now, rule.account_id], false);
        }

        // 3. Log matching debit/credit ledger adjustments
        const outId = generateUUID();
        const inId = generateUUID();
        
        // Deduct from source (allocated to source_bucket_id/unassigned)
        execRun(
          `INSERT INTO transactions (id, amount, transaction_type, adjustment_direction, description, date, account_id, bucket_id, category_id, created_at, updated_at)
           VALUES (?, ?, 'adjustment', 'subtract', ?, ?, ?, ?, ?, ?, ?)`,
          [outId, rounded, `${desc} (split out)`, today, actualSourceAccountId, source_bucket_id || null, rule.category_id || null, now, now],
          false
        );
        // Add to target (allocated to target bucket/unassigned)
        execRun(
          `INSERT INTO transactions (id, amount, transaction_type, adjustment_direction, description, date, account_id, bucket_id, category_id, created_at, updated_at)
           VALUES (?, ?, 'adjustment', 'add', ?, ?, ?, ?, ?, ?, ?)`,
          [inId, rounded, `${desc} (split in)`, today, rule.account_id, rule.bucket_id || null, rule.category_id || null, now, now],
          false
        );
      }

      return { status: 'applied', total, distributions };
    });
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
    `).map(debt => ({ ...debt, type: debt.debt_type }));
  },

  async createDebt(payload) {
    await ensureDB();
    if (!String(payload.person_name || '').trim()) throw new Error('Person name is required.');
    if (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) <= 0) throw new Error('Debt amount must be positive.');
    const debtType = payload.debt_type || payload.type;
    if (!['lent', 'borrowed'].includes(debtType)) throw new Error('Debt type must be lent or borrowed.');
    const account = execQuery('SELECT * FROM accounts WHERE id = ?', [payload.account_id])[0];
    if (!account) throw new Error('Please select a valid account.');
    const bucket = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [payload.bucket_id])[0];
    if (!bucket) throw new Error('Please select a valid savings bucket.');
    const id = generateUUID();
    const now = new Date().toISOString();
    const amount = Number(payload.amount);
    return runInTransaction(async () => {
      const nextBalance = debtType === 'lent' ? Number(account.balance) - amount : Number(account.balance) + amount;
      const nextAllocation = debtType === 'lent' ? Number(bucket.allocated_balance) - amount : Number(bucket.allocated_balance) + amount;
      execRun('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', [nextBalance, now, account.id], false);
      execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [nextAllocation, now, bucket.id], false);
      execRun(
        'INSERT INTO debts (id, person_name, amount, debt_type, description, due_date, is_settled, account_id, bucket_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, payload.person_name.trim(), amount, debtType, payload.description || null, payload.due_date || null, 0, account.id, bucket.id, now, now],
        false
      );
      const debt = execQuery('SELECT * FROM debts WHERE id = ?', [id])[0];
      return { ...debt, type: debt.debt_type };
    });
  },

  async allocateUnassigned(bucketId, amount) {
    await ensureDB();
    const allocation = Number(amount);
    if (!Number.isFinite(allocation) || allocation <= 0) throw new Error('Allocation amount must be positive.');
    const bucket = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [bucketId])[0];
    if (!bucket) throw new Error('Savings bucket not found.');
    const accountTotal = Number(execQuery('SELECT COALESCE(SUM(balance), 0) total FROM accounts')[0]?.total) || 0;
    const bucketTotal = Number(execQuery('SELECT COALESCE(SUM(allocated_balance), 0) total FROM savings_buckets')[0]?.total) || 0;
    const available = Math.round((accountTotal - bucketTotal) * 100) / 100;
    if (allocation > available) throw new Error(`Only ₹${available.toFixed(2)} is currently unassigned.`);
    return runInTransaction(async () => {
      execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [Number(bucket.allocated_balance) + allocation, new Date().toISOString(), bucketId], false);
      return { status: 'allocated', amount: allocation, bucket_id: bucketId };
    });
  },

  async settleDebt(id, payload = {}) {
    await ensureDB();
    const debt = execQuery('SELECT * FROM debts WHERE id = ?', [id])[0];
    if (!debt) throw new Error('Debt record not found.');
    if (debt.is_settled) throw new Error('This debt is already settled.');
    const accountId = typeof payload === 'string' ? payload : (payload.account_id || debt.account_id);
    const account = execQuery('SELECT * FROM accounts WHERE id = ?', [accountId])[0];
    if (!account) throw new Error('Please select a valid settlement account.');
    const now = new Date().toISOString();
    return runInTransaction(async () => {
      const amount = Number(debt.amount);
      const nextBalance = debt.debt_type === 'lent' ? Number(account.balance) + amount : Number(account.balance) - amount;
      execRun('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', [nextBalance, now, account.id], false);
      if (debt.bucket_id) {
        const bucket = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [debt.bucket_id])[0];
        if (bucket) {
          const nextAllocation = debt.debt_type === 'lent' ? Number(bucket.allocated_balance) + amount : Number(bucket.allocated_balance) - amount;
          execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [nextAllocation, now, bucket.id], false);
        }
      }
      execRun('UPDATE debts SET is_settled = 1, account_id = ?, updated_at = ? WHERE id = ?', [account.id, now, id], false);
      return { ...execQuery('SELECT * FROM debts WHERE id = ?', [id])[0], type: debt.debt_type };
    });
  },

  async deleteDebt(id) {
    await ensureDB();
    const debt = execQuery('SELECT * FROM debts WHERE id = ?', [id])[0];
    if (!debt) throw new Error('Debt record not found.');
    return runInTransaction(async () => {
      if (!debt.is_settled && debt.account_id) {
        const account = execQuery('SELECT * FROM accounts WHERE id = ?', [debt.account_id])[0];
        if (account) {
          const amount = Number(debt.amount);
          const restored = debt.debt_type === 'lent' ? Number(account.balance) + amount : Number(account.balance) - amount;
          execRun('UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?', [restored, new Date().toISOString(), account.id], false);
        }
      }
      if (!debt.is_settled && debt.bucket_id) {
        const bucket = execQuery('SELECT * FROM savings_buckets WHERE id = ?', [debt.bucket_id])[0];
        if (bucket) {
          const amount = Number(debt.amount);
          const restored = debt.debt_type === 'lent' ? Number(bucket.allocated_balance) + amount : Number(bucket.allocated_balance) - amount;
          execRun('UPDATE savings_buckets SET allocated_balance = ?, updated_at = ? WHERE id = ?', [restored, new Date().toISOString(), bucket.id], false);
        }
      }
      execRun('DELETE FROM debts WHERE id = ?', [id], false);
      return { status: "deleted" };
    });
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
    const filename = await createNewVault(name);
    return { active_vault: filename, vaults: listVaults() };
  },

  async switchVault(filename) {
    await ensureDB();
    await switchActiveVault(filename);
    return { active_vault: filename, vaults: listVaults() };
  },

  async importVault(file, passphrase = '') {
    await ensureDB();
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const filename = await importDatabaseBlob(file.name, uint8Array, passphrase);
    return { active_vault: filename, vaults: listVaults() };
  },

  async deleteVault(filename) {
    await ensureDB();
    await removeVault(filename);
    return { vaults: listVaults() };
  },

  async renameVault(filename, newName) {
    await ensureDB();
    await renameVault(filename, newName);
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
    const backupFilename = await createBackupSnapshot();
    return { backup_filename: backupFilename, message: "Backup snapshot saved locally." };
  },

  async getBackups() {
    await ensureDB();
    return listBackupSnapshots();
  },

  async restoreBackup(filename) {
    await ensureDB();
    const active = await restoreBackupSnapshot(filename);
    return { active_vault: active, message: "Database restored from backup." };
  },

  async getBackupDownloadUrl(filename) {
    const passphrase = prompt('Create a passphrase (at least 8 characters) for this portable encrypted backup:');
    if (passphrase === null) throw new Error('Backup export cancelled.');
    const binary = await exportBackupBytes(filename, passphrase || 'default_cashbuddy_pass');
    if (!binary) return '#';
    const blob = new Blob([binary], { type: 'application/x-sqlite3' });
    return URL.createObjectURL(blob);
  },

  async shareBackupFile(filename) {
    const passphrase = prompt('Create a passphrase (at least 8 characters) for this portable encrypted backup:');
    if (passphrase === null) throw new Error('Backup sharing cancelled.');
    const binary = await exportBackupBytes(filename, passphrase || 'default_cashbuddy_pass');
    if (!binary) throw new Error("Backup file not found");
    const blob = new Blob([binary], { type: 'application/x-sqlite3' });
    const file = new File([blob], filename, { type: 'application/x-sqlite3' });

    let sharedSuccess = false;
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Cash Buddy Backup (${filename})`,
          text: `Here is my Cash Buddy database backup file: ${filename}`,
          files: [file]
        });
        sharedSuccess = true;
      } catch (err) {
        if (err.name === 'AbortError') sharedSuccess = true;
      }
    }

    if (!sharedSuccess) {
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  },

  async shareVaultFile(filename) {
    await ensureDB();
    const binary = await exportDatabaseBlobByName(filename);
    if (!binary) throw new Error("Vault not found.");
    const blob = new Blob([binary], { type: 'application/x-sqlite3' });
    const file = new File([blob], filename, { type: 'application/x-sqlite3' });

    let sharedSuccess = false;
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Cash Buddy Vault (${filename})`,
          text: `Here is my Cash Buddy vault file: ${filename}`,
          files: [file]
        });
        sharedSuccess = true;
      } catch (err) {
        if (err.name === 'AbortError') sharedSuccess = true;
      }
    }

    if (!sharedSuccess) {
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  },

  async checkIntegrity() { await ensureDB(); return checkDatabaseIntegrity(); }
};
