import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'finsight.db');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high reliability and multi-tenant performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize all relational tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      currency TEXT DEFAULT 'INR',
      currency_symbol TEXT DEFAULT '₹',
      monthly_income_target REAL DEFAULT 75000,
      monthly_savings_target REAL DEFAULT 20000,
      theme_preference TEXT DEFAULT 'dark',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- savings, checking, credit_card, cash, investment, digital_wallet
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      account_number TEXT,
      color TEXT DEFAULT '#10B981',
      description TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT, -- NULL for default system categories
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- income, expense
      icon TEXT DEFAULT 'Tag',
      color TEXT DEFAULT '#10B981',
      is_system INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      type TEXT NOT NULL, -- income, expense, transfer
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      merchant TEXT,
      payment_method TEXT DEFAULT 'UPI', -- UPI, Card, NetBanking, Cash, Transfer
      tags TEXT, -- JSON array of strings
      is_recurring INTEGER DEFAULT 0,
      anomaly_flag INTEGER DEFAULT 0,
      anomaly_score REAL DEFAULT 0,
      anomaly_reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      period_month TEXT NOT NULL, -- YYYY-MM
      limit_amount REAL NOT NULL,
      alert_threshold_pct REAL DEFAULT 80,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      UNIQUE(user_id, category_id, period_month)
    );

    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      target_date TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      color TEXT DEFAULT '#38BDF8',
      description TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS savings_contributions (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      frequency TEXT NOT NULL, -- daily, weekly, monthly, yearly
      start_date TEXT NOT NULL,
      end_date TEXT,
      next_due_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      last_executed TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- budget_alert, anomaly, bill_due, goal_milestone, insight
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'info', -- info, warning, danger, success
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL, -- user, assistant
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS imported_files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      total_rows INTEGER NOT NULL,
      imported_rows INTEGER NOT NULL,
      duplicates_skipped INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, period_month);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);

  seedSystemCategories();
}

// Seed universal categories if not present
function seedSystemCategories() {
  const countRow = db.prepare('SELECT count(*) as count FROM categories WHERE is_system = 1').get();
  if (countRow.count > 0) return;

  const systemCategories = [
    // Income
    { id: 'cat_salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10B981' },
    { id: 'cat_freelance', name: 'Freelancing', type: 'income', icon: 'Laptop', color: '#06B6D4' },
    { id: 'cat_investments', name: 'Investments', type: 'income', icon: 'TrendingUp', color: '#8B5CF6' },
    { id: 'cat_business', name: 'Business', type: 'income', icon: 'Building', color: '#EC4899' },
    { id: 'cat_other_income', name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#38BDF8' },
    // Expenses
    { id: 'cat_food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#F59E0B' },
    { id: 'cat_groceries', name: 'Groceries', type: 'expense', icon: 'ShoppingCart', color: '#10B981' },
    { id: 'cat_transport', name: 'Transportation', type: 'expense', icon: 'Car', color: '#3B82F6' },
    { id: 'cat_rent', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#EF4444' },
    { id: 'cat_utilities', name: 'Utilities & Bills', type: 'expense', icon: 'Zap', color: '#F97316' },
    { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
    { id: 'cat_healthcare', name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#14B8A6' },
    { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8B5CF6' },
    { id: 'cat_education', name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#6366F1' },
    { id: 'cat_travel', name: 'Travel', type: 'expense', icon: 'Plane', color: '#0EA5E9' },
    { id: 'cat_subscriptions', name: 'Subscriptions', type: 'expense', icon: 'Repeat', color: '#A855F7' },
    { id: 'cat_emi', name: 'EMI & Loans', type: 'expense', icon: 'CreditCard', color: '#E11D48' },
    { id: 'cat_other_exp', name: 'Other Expenses', type: 'expense', icon: 'MoreHorizontal', color: '#64748B' },
  ];

  const insert = db.prepare(`
    INSERT INTO categories (id, user_id, name, type, icon, color, is_system, created_at)
    VALUES (?, NULL, ?, ?, ?, ?, 1, ?)
  `);

  const now = new Date().toISOString();
  for (const cat of systemCategories) {
    insert.run(cat.id, cat.name, cat.type, cat.icon, cat.color, now);
  }
}

// Recompute and update current account balance
export function recalculateAccountBalance(accountId) {
  const account = db.prepare('SELECT opening_balance FROM accounts WHERE id = ?').get(accountId);
  if (!account) return 0;

  const transSummary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_in,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_out
    FROM transactions
    WHERE account_id = ?
  `).get(accountId);

  const newBalance = account.opening_balance + transSummary.total_in - transSummary.total_out;
  db.prepare('UPDATE accounts SET current_balance = ? WHERE id = ?').run(newBalance, accountId);
  return newBalance;
}
