import express from 'express';
import crypto from 'node:crypto';
import { db, recalculateAccountBalance } from '../db.js';
import { hashPassword, verifyPassword, generateToken, requireAuth } from '../auth.js';
import { predictCategory, forecastSpending, checkTransactionAnomaly } from '../ml.js';
import { askGeminiAssistant, buildUserFinancialSummary } from '../ai.js';
import { seedDemoDataForUser } from '../seedDemo.js';

export const apiRouter = express.Router();

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT
// ==========================================

// Register
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { email, password, full_name, currency = 'INR' } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userId = crypto.randomUUID();
    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at)
      VALUES (?, ?, ?, ?, ?, 'user', ?)
    `).run(userId, normalizedEmail, hash, salt, full_name.trim(), now);

    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';

    db.prepare(`
      INSERT INTO user_profiles (user_id, currency, currency_symbol, monthly_income_target, monthly_savings_target, theme_preference)
      VALUES (?, ?, ?, 75000, 20000, 'dark')
    `).run(userId, currency, currencySymbol);

    // Create primary accounts
    const acc1Id = `acc_${crypto.randomUUID().substring(0, 8)}`;
    const acc2Id = `acc_${crypto.randomUUID().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, opening_balance, current_balance, currency, color, description, created_at)
      VALUES (?, ?, 'Primary Savings Account', 'savings', 0, 0, ?, '#10B981', 'Main savings account', ?),
             (?, ?, 'Daily Cash & Wallet', 'cash', 0, 0, ?, '#38BDF8', 'Day-to-day pocket money & digital wallet', ?)
    `).run(acc1Id, userId, currency, now, acc2Id, userId, currency, now);

    const userObj = { id: userId, email: normalizedEmail, full_name: full_name.trim() };
    const token = generateToken(userObj);

    return res.status(201).json({
      message: 'Account successfully created!',
      token,
      user: {
        id: userId,
        email: normalizedEmail,
        full_name: full_name.trim(),
        currency,
        currency_symbol: currencySymbol
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

// Login
apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(user.id) || {
      currency: 'INR',
      currency_symbol: '₹',
      theme_preference: 'dark'
    };

    const token = generateToken(user);

    return res.json({
      message: 'Signed in successfully!',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        currency: profile.currency,
        currency_symbol: profile.currency_symbol,
        monthly_income_target: profile.monthly_income_target,
        monthly_savings_target: profile.monthly_savings_target,
        theme_preference: profile.theme_preference
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

// Instant Demo Login: Sets up a rich fintech profile with accounts, transactions, budgets, ML anomalies
apiRouter.post('/auth/demo', (req, res) => {
  try {
    const demoEmail = 'demo@finsight.ai';
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(demoEmail);

    if (!user) {
      const userId = 'demo_user_finsight_01';
      const { hash, salt } = hashPassword('demo123456');
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at)
        VALUES (?, ?, ?, ?, 'Alex Rivera', 'user', ?)
      `).run(userId, demoEmail, hash, salt, now);

      db.prepare(`
        INSERT INTO user_profiles (user_id, currency, currency_symbol, monthly_income_target, monthly_savings_target, theme_preference)
        VALUES (?, 'INR', '₹', 120000, 35000, 'dark')
      `).run(userId);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    // Seed realistic transactions, budgets, savings goals, recurring rules
    seedDemoDataForUser(user.id);

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(user.id);
    const token = generateToken(user);

    return res.json({
      message: 'Demo session active!',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        currency: profile.currency || 'INR',
        currency_symbol: profile.currency_symbol || '₹',
        theme_preference: profile.theme_preference || 'dark'
      }
    });
  } catch (err) {
    console.error('Demo setup error:', err);
    return res.status(500).json({ error: 'Failed to initialize demo workspace.' });
  }
});

// Current User Profile
apiRouter.get('/auth/me', requireAuth, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
      currency: req.userProfile.currency,
      currency_symbol: req.userProfile.currency_symbol,
      monthly_income_target: req.userProfile.monthly_income_target,
      monthly_savings_target: req.userProfile.monthly_savings_target,
      theme_preference: req.userProfile.theme_preference
    }
  });
});

// Update Profile & Preferences
apiRouter.put('/auth/profile', requireAuth, (req, res) => {
  try {
    const { full_name, currency, monthly_income_target, monthly_savings_target, theme_preference } = req.body;

    if (full_name) {
      db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(full_name.trim(), req.user.id);
    }

    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';

    db.prepare(`
      UPDATE user_profiles
      SET currency = COALESCE(?, currency),
          currency_symbol = COALESCE(?, currency_symbol),
          monthly_income_target = COALESCE(?, monthly_income_target),
          monthly_savings_target = COALESCE(?, monthly_savings_target),
          theme_preference = COALESCE(?, theme_preference)
      WHERE user_id = ?
    `).run(currency, currencySymbol, monthly_income_target, monthly_savings_target, theme_preference, req.user.id);

    return res.json({ message: 'Profile updated successfully!' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Forgot Password Flow
apiRouter.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  // In production, an email with a secure signed reset token is dispatched
  return res.json({ message: 'If this email exists in our system, a password reset link has been dispatched.' });
});

// Password Reset Flow
apiRouter.post('/auth/reset-password', (req, res) => {
  const { email, new_password } = req.body;
  if (!email || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Valid email and password (minimum 6 characters) required.' });
  }
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email.' });
  }
  const { hash, salt } = hashPassword(new_password);
  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, user.id);
  return res.json({ message: 'Password has been successfully updated. You may now sign in.' });
});

// ==========================================
// 2. ACCOUNTS
// ==========================================

apiRouter.get('/accounts', requireAuth, (req, res) => {
  const accounts = db.prepare(`
    SELECT * FROM accounts
    WHERE user_id = ?
    ORDER BY created_at ASC
  `).all(req.user.id);

  // Re-verify balances
  accounts.forEach(acc => {
    acc.current_balance = recalculateAccountBalance(acc.id);
  });

  return res.json({ accounts });
});

apiRouter.post('/accounts', requireAuth, (req, res) => {
  try {
    const { name, type, opening_balance = 0, currency = 'INR', account_number, color = '#10B981', description } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Account name and type are required.' });
    }

    const id = `acc_${crypto.randomUUID().substring(0, 10)}`;
    const now = new Date().toISOString();
    const openingBal = parseFloat(opening_balance) || 0;

    db.prepare(`
      INSERT INTO accounts (id, user_id, name, type, opening_balance, current_balance, currency, account_number, color, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, name.trim(), type, openingBal, openingBal, currency, account_number || '', color, description || '', now);

    return res.status(201).json({ message: 'Account created successfully!', accountId: id });
  } catch (err) {
    console.error('Error creating account:', err);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

apiRouter.put('/accounts/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color, description } = req.body;

    const account = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!account) return res.status(404).json({ error: 'Account not found.' });

    db.prepare(`
      UPDATE accounts
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          color = COALESCE(?, color),
          description = COALESCE(?, description)
      WHERE id = ? AND user_id = ?
    `).run(name, type, color, description, id, req.user.id);

    return res.json({ message: 'Account updated successfully!' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update account.' });
  }
});

apiRouter.delete('/accounts/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const account = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!account) return res.status(404).json({ error: 'Account not found.' });

    // Check count of transactions
    const txCount = db.prepare('SELECT count(*) as count FROM transactions WHERE account_id = ?').get(id);
    if (txCount && txCount.count > 0) {
      return res.status(400).json({ error: `Cannot delete account with ${txCount.count} existing transactions. Delete or reassign transactions first.` });
    }

    db.prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?').run(id, req.user.id);
    return res.json({ message: 'Account deleted successfully!' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// ==========================================
// 3. CATEGORIES
// ==========================================

apiRouter.get('/categories', requireAuth, (req, res) => {
  const categories = db.prepare(`
    SELECT * FROM categories
    WHERE user_id IS NULL OR user_id = ?
    ORDER BY is_system DESC, name ASC
  `).all(req.user.id);

  return res.json({ categories });
});

apiRouter.post('/categories', requireAuth, (req, res) => {
  try {
    const { name, type = 'expense', icon = 'Tag', color = '#10B981' } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const id = `cat_custom_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO categories (id, user_id, name, type, icon, color, is_system, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, req.user.id, name.trim(), type, icon, color, now);

    return res.status(201).json({ message: 'Custom category created!', categoryId: id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
});

// ==========================================
// 4. TRANSACTIONS & CSV
// ==========================================

// Get Transactions (with filters & pagination)
apiRouter.get('/transactions', requireAuth, (req, res) => {
  try {
    const {
      search = '',
      category_id,
      account_id,
      type,
      start_date,
      end_date,
      page = 1,
      limit = 20,
      sort_by = 'date',
      sort_dir = 'DESC'
    } = req.query;

    let whereClause = 'WHERE t.user_id = ?';
    const params = [req.user.id];

    if (search) {
      whereClause += ' AND (t.title LIKE ? OR t.merchant LIKE ? OR t.description LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    if (category_id) {
      whereClause += ' AND t.category_id = ?';
      params.push(category_id);
    }

    if (account_id) {
      whereClause += ' AND t.account_id = ?';
      params.push(account_id);
    }

    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }

    if (start_date) {
      whereClause += ' AND t.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND t.date <= ?';
      params.push(end_date);
    }

    // Total matching count
    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM transactions t ${whereClause}`).get(...params);
    const total = totalRow.count;

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    const allowedSort = ['date', 'amount', 'title'];
    const col = allowedSort.includes(sort_by) ? `t.${sort_by}` : 't.date';
    const dir = sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const transactions = db.prepare(`
      SELECT
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        a.name as account_name,
        a.color as account_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      ${whereClause}
      ORDER BY ${col} ${dir}, t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    return res.json({
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return res.status(500).json({ error: 'Failed to load transactions.' });
  }
});

// Create Transaction (with automated ML anomaly evaluation & budget alerts)
apiRouter.post('/transactions', requireAuth, (req, res) => {
  try {
    const {
      account_id,
      category_id,
      type = 'expense',
      amount,
      date,
      title,
      description = '',
      merchant = '',
      payment_method = 'UPI',
      tags = []
    } = req.body;

    if (!account_id || !title || amount === undefined || !date) {
      return res.status(400).json({ error: 'Please provide account, title, amount, and date.' });
    }

    const amt = Math.abs(parseFloat(amount));
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Transaction amount must be a positive number.' });
    }

    // Verify account ownership
    const account = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(account_id, req.user.id);
    if (!account) return res.status(400).json({ error: 'Selected account does not exist or belong to you.' });

    // Category auto-prediction if not provided
    let catId = category_id;
    if (!catId) {
      const pred = predictCategory(req.user.id, title, merchant, description);
      catId = pred.categoryId;
    }

    // Anomaly Detection
    let isAnomaly = 0;
    let anomalyScore = 0;
    let anomalyReason = null;

    if (type === 'expense') {
      const anomalyCheck = checkTransactionAnomaly(req.user.id, catId, amt);
      if (anomalyCheck.isAnomaly) {
        isAnomaly = 1;
        anomalyScore = anomalyCheck.score;
        anomalyReason = anomalyCheck.reason;

        // Create alert notification
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, severity, created_at)
          VALUES (?, ?, 'anomaly', 'Unusual Spending Detected', ?, 'warning', ?)
        `).run(crypto.randomUUID(), req.user.id, anomalyReason, new Date().toISOString());
      }
    }

    const txId = `tx_${crypto.randomUUID().substring(0, 10)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO transactions (
        id, user_id, account_id, category_id, type, amount, date,
        title, description, merchant, payment_method, tags,
        is_recurring, anomaly_flag, anomaly_score, anomaly_reason, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    `).run(
      txId, req.user.id, account_id, catId, type, amt, date,
      title.trim(), description.trim(), merchant.trim(), payment_method,
      JSON.stringify(Array.isArray(tags) ? tags : []),
      isAnomaly, anomalyScore, anomalyReason, now
    );

    // Recompute balance
    const updatedBalance = recalculateAccountBalance(account_id);

    // Check budget alert
    if (type === 'expense') {
      const monthStr = date.substring(0, 7);
      const budget = db.prepare('SELECT * FROM budgets WHERE user_id = ? AND category_id = ? AND period_month = ?').get(req.user.id, catId, monthStr);
      if (budget) {
        const spentRow = db.prepare(`
          SELECT SUM(amount) as spent FROM transactions
          WHERE user_id = ? AND category_id = ? AND substr(date, 1, 7) = ? AND type = 'expense'
        `).get(req.user.id, catId, monthStr);
        const totalSpent = spentRow.spent || 0;
        const pctUsed = (totalSpent / budget.limit_amount) * 100;

        if (pctUsed >= 100) {
          const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(catId);
          db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, severity, created_at)
            VALUES (?, ?, 'budget_alert', 'Budget Exceeded', ?, 'danger', ?)
          `).run(crypto.randomUUID(), req.user.id, `You have exceeded your ${cat ? cat.name : 'category'} monthly budget limit (${pctUsed.toFixed(0)}% consumed).`, now);
        }
      }
    }

    return res.status(201).json({
      message: 'Transaction saved successfully!',
      transactionId: txId,
      updatedBalance,
      anomaly: isAnomaly ? { score: anomalyScore, reason: anomalyReason } : null
    });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return res.status(500).json({ error: 'Failed to record transaction.' });
  }
});

// Update Transaction
apiRouter.put('/transactions/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { account_id, category_id, type, amount, date, title, description, merchant, payment_method, tags } = req.body;

    const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Transaction not found.' });

    const amt = amount !== undefined ? Math.abs(parseFloat(amount)) : existing.amount;

    db.prepare(`
      UPDATE transactions
      SET account_id = COALESCE(?, account_id),
          category_id = COALESCE(?, category_id),
          type = COALESCE(?, type),
          amount = ?,
          date = COALESCE(?, date),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          merchant = COALESCE(?, merchant),
          payment_method = COALESCE(?, payment_method),
          tags = COALESCE(?, tags)
      WHERE id = ? AND user_id = ?
    `).run(
      account_id, category_id, type, amt, date, title, description, merchant, payment_method,
      tags ? JSON.stringify(tags) : null, id, req.user.id
    );

    recalculateAccountBalance(existing.account_id);
    if (account_id && account_id !== existing.account_id) {
      recalculateAccountBalance(account_id);
    }

    return res.json({ message: 'Transaction updated successfully!' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update transaction.' });
  }
});

// Delete Transaction
apiRouter.delete('/transactions/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT account_id FROM transactions WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Transaction not found.' });

    db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, req.user.id);
    recalculateAccountBalance(existing.account_id);

    return res.json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

// CSV Export
apiRouter.get('/transactions/export-csv', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT t.date, t.title, t.type, t.amount, c.name as category, a.name as account,
             t.merchant, t.payment_method, t.description
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC
    `).all(req.user.id);

    const headers = ['Date', 'Title', 'Type', 'Amount', 'Category', 'Account', 'Merchant', 'Payment Method', 'Description'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const line = [
        `"${r.date}"`,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${r.type}"`,
        r.amount,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        `"${(r.account || '').replace(/"/g, '""')}"`,
        `"${(r.merchant || '').replace(/"/g, '""')}"`,
        `"${(r.payment_method || '').replace(/"/g, '""')}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`
      ];
      csvLines.push(line.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="finsight_transactions.csv"');
    return res.send(csvLines.join('\n'));
  } catch (err) {
    return res.status(500).json({ error: 'CSV export failed.' });
  }
});

// CSV Import Preview & Column Validation
apiRouter.post('/transactions/import-csv/preview', requireAuth, (req, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ error: 'No CSV content provided.' });
    }

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or missing headers.' });
    }

    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];
    let duplicates = 0;
    let invalidCount = 0;

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV token parser handling quotes
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length < 2) continue;

      const record = {};
      rawHeaders.forEach((h, idx) => {
        record[h.toLowerCase()] = values[idx] || '';
      });

      const title = record.title || record.description || record.payee || record.merchant || `Transaction #${i}`;
      const amountStr = (record.amount || record.debit || record.credit || '0').replace(/[^0-9.-]/g, '');
      const amount = Math.abs(parseFloat(amountStr));
      const date = record.date || new Date().toISOString().substring(0, 10);
      const isCredit = Boolean(record.credit || record.type?.toLowerCase() === 'income');
      const type = isCredit ? 'income' : 'expense';

      if (isNaN(amount) || amount <= 0) {
        invalidCount++;
        continue;
      }

      // Check duplicates against existing transactions
      const existing = db.prepare(`
        SELECT id FROM transactions
        WHERE user_id = ? AND date = ? AND title = ? AND amount = ?
      `).get(req.user.id, date, title, amount);

      const isDuplicate = Boolean(existing);
      if (isDuplicate) duplicates++;

      // Automated ML Category prediction
      const predicted = predictCategory(req.user.id, title, record.merchant || '', record.description || '');

      rows.push({
        rowId: i,
        title,
        amount,
        date,
        type,
        merchant: record.merchant || '',
        category: predicted.categoryName,
        categoryId: predicted.categoryId,
        categoryConfidence: Math.round(predicted.confidence * 100),
        isDuplicate
      });
    }

    return res.json({
      headers: rawHeaders,
      totalRows: lines.length - 1,
      validRows: rows.length,
      invalidRows: invalidCount,
      duplicateCount: duplicates,
      preview: rows.slice(0, 15),
      allRows: rows
    });
  } catch (err) {
    console.error('CSV preview error:', err);
    return res.status(500).json({ error: 'Failed to parse CSV file.' });
  }
});

// CSV Import Confirm / Commit
apiRouter.post('/transactions/import-csv/confirm', requireAuth, (req, res) => {
  try {
    const { rows, account_id, skipDuplicates = true } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No transaction rows provided to import.' });
    }

    // Default account fallback
    let targetAccId = account_id;
    if (!targetAccId) {
      const defaultAcc = db.prepare('SELECT id FROM accounts WHERE user_id = ? LIMIT 1').get(req.user.id);
      if (!defaultAcc) return res.status(400).json({ error: 'Please create an account first.' });
      targetAccId = defaultAcc.id;
    }

    const insertTx = db.prepare(`
      INSERT INTO transactions (
        id, user_id, account_id, category_id, type, amount, date,
        title, description, merchant, payment_method, tags,
        is_recurring, anomaly_flag, anomaly_score, anomaly_reason, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Imported', '["csv_import"]', 0, 0, 0, NULL, ?)
    `);

    let importedCount = 0;
    let skippedCount = 0;
    const now = new Date().toISOString();

    for (const row of rows) {
      if (skipDuplicates && row.isDuplicate) {
        skippedCount++;
        continue;
      }

      const txId = `tx_${crypto.randomUUID().substring(0, 10)}`;
      insertTx.run(
        txId,
        req.user.id,
        targetAccId,
        row.categoryId || 'cat_other_exp',
        row.type || 'expense',
        row.amount,
        row.date,
        row.title,
        'Imported via CSV',
        row.merchant || '',
        now
      );
      importedCount++;
    }

    recalculateAccountBalance(targetAccId);

    // Record imported file log
    db.prepare(`
      INSERT INTO imported_files (id, user_id, filename, total_rows, imported_rows, duplicates_skipped, created_at)
      VALUES (?, ?, 'User CSV Upload', ?, ?, ?, ?)
    `).run(crypto.randomUUID(), req.user.id, rows.length, importedCount, skippedCount, now);

    return res.json({
      message: `Successfully imported ${importedCount} transactions!`,
      importedCount,
      skippedCount
    });
  } catch (err) {
    console.error('CSV confirm error:', err);
    return res.status(500).json({ error: 'Failed to complete transaction import.' });
  }
});

// ==========================================
// 5. BUDGET MANAGEMENT
// ==========================================

apiRouter.get('/budgets', requireAuth, (req, res) => {
  try {
    const { month } = req.query;
    const currentMonth = month || new Date().toISOString().substring(0, 7);

    // Calculate previous month string
    const [y, m] = currentMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonthStr = prevDate.toISOString().substring(0, 7);

    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.period_month = ?
      ORDER BY b.limit_amount DESC
    `).all(req.user.id, currentMonth);

    // Compute actual spending for each budget in current month and previous month
    const result = budgets.map(b => {
      const currentSpentRow = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM transactions
        WHERE user_id = ? AND category_id = ? AND substr(date, 1, 7) = ? AND type = 'expense'
      `).get(req.user.id, b.category_id, currentMonth);

      const prevSpentRow = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM transactions
        WHERE user_id = ? AND category_id = ? AND substr(date, 1, 7) = ? AND type = 'expense'
      `).get(req.user.id, b.category_id, prevMonthStr);

      const spent = currentSpentRow.spent;
      const prevSpent = prevSpentRow.spent;
      const remaining = Math.max(0, b.limit_amount - spent);
      const percentageUsed = b.limit_amount > 0 ? Math.round((spent / b.limit_amount) * 100) : 0;

      let status = 'normal';
      if (percentageUsed >= 100) status = 'exceeded';
      else if (percentageUsed >= b.alert_threshold_pct) status = 'warning';

      return {
        ...b,
        spent,
        remaining,
        percentageUsed,
        previousMonthSpent: prevSpent,
        status
      };
    });

    const totalBudget = result.reduce((acc, b) => acc + b.limit_amount, 0);
    const totalSpent = result.reduce((acc, b) => acc + b.spent, 0);

    return res.json({
      period_month: currentMonth,
      totalBudget,
      totalSpent,
      totalRemaining: Math.max(0, totalBudget - totalSpent),
      overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      budgets: result
    });
  } catch (err) {
    console.error('Budgets error:', err);
    return res.status(500).json({ error: 'Failed to load budgets.' });
  }
});

apiRouter.post('/budgets', requireAuth, (req, res) => {
  try {
    const { category_id, period_month, limit_amount, alert_threshold_pct = 80 } = req.body;
    if (!category_id || !limit_amount) {
      return res.status(400).json({ error: 'Category and budget limit are required.' });
    }

    const monthStr = period_month || new Date().toISOString().substring(0, 7);
    const limit = Math.abs(parseFloat(limit_amount));
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND period_month = ?').get(req.user.id, category_id, monthStr);
    const budgetId = existing ? existing.id : `bgt_${crypto.randomUUID().substring(0, 8)}`;

    db.prepare(`
      INSERT OR REPLACE INTO budgets (id, user_id, category_id, period_month, limit_amount, alert_threshold_pct, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(budgetId, req.user.id, category_id, monthStr, limit, alert_threshold_pct, now);

    return res.json({ message: 'Budget limit set successfully!', budgetId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save budget.' });
  }
});

apiRouter.delete('/budgets/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, req.user.id);
    return res.json({ message: 'Budget deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete budget.' });
  }
});

// ==========================================
// 6. SAVINGS GOALS
// ==========================================

apiRouter.get('/savings-goals', requireAuth, (req, res) => {
  try {
    const goals = db.prepare(`
      SELECT * FROM savings_goals
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    const now = new Date();
    const enriched = goals.map(g => {
      const targetDate = new Date(g.target_date);
      const monthsRemaining = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24 * 30.5)));
      const remainingAmount = Math.max(0, g.target_amount - g.current_amount);
      const monthlyNeeded = Math.round(remainingAmount / monthsRemaining);
      const progressPct = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;

      return {
        ...g,
        remainingAmount,
        progressPct,
        monthsRemaining,
        monthlyNeeded
      };
    });

    return res.json({ goals: enriched });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load savings goals.' });
  }
});

apiRouter.post('/savings-goals', requireAuth, (req, res) => {
  try {
    const { name, target_amount, current_amount = 0, target_date, category = 'General', color = '#10B981', description = '' } = req.body;
    if (!name || !target_amount || !target_date) {
      return res.status(400).json({ error: 'Goal name, target amount, and target date are required.' });
    }

    const id = `goal_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, target_date, category, color, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, name.trim(), parseFloat(target_amount), parseFloat(current_amount) || 0, target_date, category, color, description, now);

    return res.status(201).json({ message: 'Savings goal created!', goalId: id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create goal.' });
  }
});

apiRouter.post('/savings-goals/:id/contribute', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes = '' } = req.body;
    const addAmt = parseFloat(amount);
    if (isNaN(addAmt) || addAmt <= 0) return res.status(400).json({ error: 'Invalid contribution amount.' });

    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });

    const newCurrent = goal.current_amount + addAmt;
    db.prepare('UPDATE savings_goals SET current_amount = ? WHERE id = ?').run(newCurrent, id);

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO savings_contributions (id, goal_id, user_id, amount, date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, req.user.id, addAmt, now.substring(0, 10), notes, now);

    // Check if goal reached
    if (newCurrent >= goal.target_amount) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, severity, created_at)
        VALUES (?, ?, 'goal_milestone', 'Goal Completed!', ?, 'success', ?)
      `).run(crypto.randomUUID(), req.user.id, `Congratulations! You have achieved your goal '${goal.name}' (${goal.target_amount})!`, now);
    }

    return res.json({ message: 'Contribution added successfully!', current_amount: newCurrent });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to contribute to goal.' });
  }
});

apiRouter.delete('/savings-goals/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM savings_goals WHERE id = ? AND user_id = ?').run(id, req.user.id);
    return res.json({ message: 'Goal removed.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete goal.' });
  }
});

// ==========================================
// 7. RECURRING TRANSACTIONS
// ==========================================

apiRouter.get('/recurring', requireAuth, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
      FROM recurring_transactions r
      JOIN categories c ON r.category_id = c.id
      JOIN accounts a ON r.account_id = a.id
      WHERE r.user_id = ?
      ORDER BY r.next_due_date ASC
    `).all(req.user.id);

    return res.json({ recurring: items });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load recurring transactions.' });
  }
});

apiRouter.post('/recurring', requireAuth, (req, res) => {
  try {
    const { account_id, category_id, title, amount, type = 'expense', frequency = 'monthly', start_date, end_date } = req.body;
    if (!account_id || !category_id || !title || !amount || !start_date) {
      return res.status(400).json({ error: 'Account, category, title, amount, and start date are required.' });
    }

    const id = `rec_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO recurring_transactions (
        id, user_id, account_id, category_id, title, amount, type, frequency, start_date, end_date, next_due_date, is_active, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, req.user.id, account_id, category_id, title.trim(), parseFloat(amount), type, frequency, start_date, end_date || null, start_date, now);

    return res.status(201).json({ message: 'Recurring transaction scheduled!', recurringId: id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create recurring transaction.' });
  }
});

apiRouter.put('/recurring/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    db.prepare('UPDATE recurring_transactions SET is_active = ? WHERE id = ? AND user_id = ?').run(is_active ? 1 : 0, id, req.user.id);
    return res.json({ message: 'Recurring status updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update recurring transaction.' });
  }
});

apiRouter.delete('/recurring/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?').run(id, req.user.id);
    return res.json({ message: 'Recurring schedule removed.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete recurring rule.' });
  }
});

// Process Due Recurring Transactions (Idempotent)
apiRouter.post('/recurring/process', requireAuth, (req, res) => {
  try {
    const today = new Date().toISOString().substring(0, 10);
    const dueRules = db.prepare(`
      SELECT * FROM recurring_transactions
      WHERE user_id = ? AND is_active = 1 AND next_due_date <= ?
    `).all(req.user.id, today);

    let processed = 0;
    const insertTx = db.prepare(`
      INSERT INTO transactions (id, user_id, account_id, category_id, type, amount, date, title, description, is_recurring, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Generated from recurring schedule', 1, ?)
    `);

    for (const rule of dueRules) {
      // Check if already executed for this date
      const alreadyRun = db.prepare(`
        SELECT id FROM transactions
        WHERE user_id = ? AND account_id = ? AND date = ? AND title = ? AND is_recurring = 1
      `).get(req.user.id, rule.account_id, rule.next_due_date, rule.title);

      if (!alreadyRun) {
        insertTx.run(
          `tx_${crypto.randomUUID().substring(0, 10)}`,
          req.user.id,
          rule.account_id,
          rule.category_id,
          rule.type,
          rule.amount,
          rule.next_due_date,
          rule.title,
          new Date().toISOString()
        );
        recalculateAccountBalance(rule.account_id);
        processed++;
      }

      // Advance next_due_date
      const currentDue = new Date(rule.next_due_date);
      if (rule.frequency === 'daily') currentDue.setDate(currentDue.getDate() + 1);
      else if (rule.frequency === 'weekly') currentDue.setDate(currentDue.getDate() + 7);
      else if (rule.frequency === 'monthly') currentDue.setMonth(currentDue.getMonth() + 1);
      else if (rule.frequency === 'yearly') currentDue.setFullYear(currentDue.getFullYear() + 1);

      db.prepare(`
        UPDATE recurring_transactions
        SET next_due_date = ?, last_executed = ?
        WHERE id = ?
      `).run(currentDue.toISOString().substring(0, 10), today, rule.id);
    }

    return res.json({ message: `Processed ${processed} scheduled payments!`, processed });
  } catch (err) {
    return res.status(500).json({ error: 'Recurring processing failed.' });
  }
});

// ==========================================
// 8. DASHBOARD & ANALYTICS
// ==========================================

apiRouter.get('/analytics/dashboard', requireAuth, (req, res) => {
  try {
    const { range = 'month' } = req.query; // week, month, 3months, year
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);

    // Compute previous month string
    const [y, m] = currentMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonthStr = prevDate.toISOString().substring(0, 7);

    // Current Accounts total
    const accounts = db.prepare('SELECT current_balance FROM accounts WHERE user_id = ?').all(req.user.id);
    const totalBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

    // Current Month Income & Expense
    const currentStats = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      WHERE user_id = ? AND substr(date, 1, 7) = ?
    `).get(req.user.id, currentMonth);

    // Previous Month Income & Expense
    const prevStats = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      WHERE user_id = ? AND substr(date, 1, 7) = ?
    `).get(req.user.id, prevMonthStr);

    const income = currentStats.income;
    const expense = currentStats.expense;
    const monthlySavings = income - expense;
    const savingsRate = income > 0 ? Math.round((monthlySavings / income) * 100) : 0;

    const prevIncome = prevStats.income;
    const prevExpense = prevStats.expense;

    const incomeChangePct = prevIncome > 0 ? Math.round(((income - prevIncome) / prevIncome) * 100) : 0;
    const expenseChangePct = prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : 0;

    // Budget utilization
    const budgetSummary = db.prepare(`
      SELECT
        COALESCE(SUM(limit_amount), 0) as total_limit
      FROM budgets
      WHERE user_id = ? AND period_month = ?
    `).get(req.user.id, currentMonth);
    const totalBudgetLimit = budgetSummary.total_limit;
    const budgetUtilizationPct = totalBudgetLimit > 0 ? Math.min(150, Math.round((expense / totalBudgetLimit) * 100)) : 0;

    // Monthly Bar Chart: Last 6 Months (Income vs Expense)
    const monthlyHistory = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toISOString().substring(0, 7);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      const row = db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as inc,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as exp
        FROM transactions
        WHERE user_id = ? AND substr(date, 1, 7) = ?
      `).get(req.user.id, mStr);

      monthlyHistory.push({
        month: monthName,
        period: mStr,
        income: row.inc,
        expense: row.exp,
        savings: row.inc - row.exp
      });
    }

    // Expense Breakdown: Donut Chart
    const categoryBreakdown = db.prepare(`
      SELECT
        c.id, c.name, c.color, c.icon,
        SUM(t.amount) as value,
        COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND substr(t.date, 1, 7) = ?
      GROUP BY c.id
      ORDER BY value DESC
    `).all(req.user.id, currentMonth);

    // Spending Trends (Daily cumulative this month)
    const dailyExpenses = db.prepare(`
      SELECT date, SUM(amount) as daily_amount
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND substr(date, 1, 7) = ?
      GROUP BY date
      ORDER BY date ASC
    `).all(req.user.id, currentMonth);

    let cumulative = 0;
    const spendingTrend = dailyExpenses.map(d => {
      cumulative += d.daily_amount;
      return {
        date: d.date.substring(8, 10), // day of month
        fullDate: d.date,
        daily: d.daily_amount,
        cumulative
      };
    });

    // Recent Transactions
    const recentTransactions = db.prepare(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 6
    `).all(req.user.id);

    return res.json({
      summaryCards: {
        totalBalance,
        income,
        expense,
        monthlySavings,
        savingsRate,
        budgetUtilizationPct,
        totalBudgetLimit,
        incomeChangePct,
        expenseChangePct
      },
      charts: {
        monthlyHistory,
        categoryBreakdown,
        spendingTrend
      },
      recentTransactions
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    return res.status(500).json({ error: 'Failed to generate dashboard analytics.' });
  }
});

// Advanced Analytics Deep Dive
apiRouter.get('/analytics/deep-dive', requireAuth, (req, res) => {
  try {
    // Day of week spending distribution
    const allExpenses = db.prepare(`
      SELECT date, amount FROM transactions
      WHERE user_id = ? AND type = 'expense'
    `).all(req.user.id);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayTotals = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const dayCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    for (const exp of allExpenses) {
      const dayName = days[new Date(exp.date).getDay()];
      dayTotals[dayName] += exp.amount;
      dayCounts[dayName] += 1;
    }

    const dayOfWeekData = days.map(d => ({
      day: d,
      total: dayTotals[d],
      avg: dayCounts[d] > 0 ? Math.round(dayTotals[d] / dayCounts[d]) : 0,
      count: dayCounts[d]
    }));

    // Top merchants
    const topMerchants = db.prepare(`
      SELECT merchant, SUM(amount) as total_spent, COUNT(id) as visit_count
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND merchant IS NOT NULL AND merchant != ''
      GROUP BY merchant
      ORDER BY total_spent DESC
      LIMIT 8
    `).all(req.user.id);

    // Account-wise spending
    const accountDistribution = db.prepare(`
      SELECT a.name, a.color, SUM(t.amount) as total
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ? AND t.type = 'expense'
      GROUP BY a.id
      ORDER BY total DESC
    `).all(req.user.id);

    return res.json({
      dayOfWeekData,
      topMerchants,
      accountDistribution
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate deep dive analytics.' });
  }
});

// ==========================================
// 9. MACHINE LEARNING APIS
// ==========================================

// Predict Category
apiRouter.post('/ml/categorize', requireAuth, (req, res) => {
  const { title, merchant, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Transaction title is required.' });

  const prediction = predictCategory(req.user.id, title, merchant, description);
  return res.json(prediction);
});

// Spending Forecast
apiRouter.get('/ml/forecast', requireAuth, (req, res) => {
  const forecast = forecastSpending(req.user.id);
  return res.json(forecast);
});

// Anomaly List
apiRouter.get('/ml/anomalies', requireAuth, (req, res) => {
  const anomalies = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    JOIN accounts a ON t.account_id = a.id
    WHERE t.user_id = ? AND t.anomaly_flag = 1
    ORDER BY t.date DESC
  `).all(req.user.id);

  return res.json({ anomalies, count: anomalies.length });
});

// ==========================================
// 10. GEMINI-POWERED AI ASSISTANT
// ==========================================

apiRouter.get('/ai/summary', requireAuth, (req, res) => {
  const summary = buildUserFinancialSummary(req.user.id);
  return res.json(summary);
});

apiRouter.post('/ai/chat', requireAuth, async (req, res) => {
  try {
    const { message, conversation_id } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    let convId = conversation_id;
    const now = new Date().toISOString();

    if (!convId) {
      convId = `conv_${crypto.randomUUID().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO ai_conversations (id, user_id, title, created_at)
        VALUES (?, ?, ?, ?)
      `).run(convId, req.user.id, message.substring(0, 40) + '...', now);
    }

    // Save user message
    db.prepare(`
      INSERT INTO ai_messages (id, conversation_id, user_id, role, content, created_at)
      VALUES (?, ?, ?, 'user', ?, ?)
    `).run(crypto.randomUUID(), convId, req.user.id, message, now);

    // Retrieve previous messages for context
    const history = db.prepare(`
      SELECT role, content FROM ai_messages
      WHERE conversation_id = ? AND user_id = ?
      ORDER BY created_at ASC
      LIMIT 10
    `).all(convId, req.user.id);

    // Ask assistant with injected financial grounding
    const answer = await askGeminiAssistant(req.user.id, message, history);

    // Save assistant message
    const assistantMsgId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO ai_messages (id, conversation_id, user_id, role, content, created_at)
      VALUES (?, ?, ?, 'assistant', ?, ?)
    `).run(assistantMsgId, convId, req.user.id, answer, new Date().toISOString());

    return res.json({
      conversation_id: convId,
      message: answer
    });
  } catch (err) {
    console.error('AI Chat Error:', err);
    return res.status(500).json({ error: 'Failed to process financial AI query.' });
  }
});

apiRouter.get('/ai/messages', requireAuth, (req, res) => {
  const { conversation_id } = req.query;
  if (!conversation_id) {
    // Return last 20 messages for user
    const messages = db.prepare(`
      SELECT * FROM ai_messages
      WHERE user_id = ?
      ORDER BY created_at ASC
      LIMIT 30
    `).all(req.user.id);
    return res.json({ messages });
  }

  const messages = db.prepare(`
    SELECT * FROM ai_messages
    WHERE conversation_id = ? AND user_id = ?
    ORDER BY created_at ASC
  `).all(conversation_id, req.user.id);

  return res.json({ messages });
});

// ==========================================
// 11. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', requireAuth, (req, res) => {
  const list = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `).all(req.user.id);

  const unreadCount = db.prepare('SELECT count(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;

  return res.json({ notifications: list, unreadCount });
});

apiRouter.put('/notifications/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ success: true });
});

apiRouter.put('/notifications/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  return res.json({ success: true });
});

apiRouter.delete('/notifications/clear', requireAuth, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
  return res.json({ success: true });
});

// ==========================================
// 12. REPORTS
// ==========================================

apiRouter.get('/reports/summary', requireAuth, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const today = new Date().toISOString().substring(0, 10);
    const startDate = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
    const endDate = end_date || today;

    // Totals
    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(*) as total_transactions
      FROM transactions
      WHERE user_id = ? AND date >= ? AND date <= ?
    `).get(req.user.id, startDate, endDate);

    // Category breakdown
    const categories = db.prepare(`
      SELECT c.name, c.color, SUM(t.amount) as amount, COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY amount DESC
    `).all(req.user.id, startDate, endDate);

    // Account breakdown
    const accounts = db.prepare(`
      SELECT a.name, a.type, SUM(t.amount) as amount
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY a.id
      ORDER BY amount DESC
    `).all(req.user.id, startDate, endDate);

    return res.json({
      startDate,
      endDate,
      totalIncome: totals.total_income,
      totalExpense: totals.total_expense,
      netSavings: totals.total_income - totals.total_expense,
      savingsRate: totals.total_income > 0 ? Math.round(((totals.total_income - totals.total_expense) / totals.total_income) * 100) : 0,
      totalTransactions: totals.total_transactions,
      categoryBreakdown: categories,
      accountBreakdown: accounts
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate financial report.' });
  }
});
