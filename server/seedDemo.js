import crypto from 'node:crypto';
import { db, recalculateAccountBalance } from './db.js';
import { hashPassword } from './auth.js';
import { checkTransactionAnomaly } from './ml.js';

export function seedDemoDataForUser(userId) {
  // Check if user already has transactions
  const existing = db.prepare('SELECT count(*) as count FROM transactions WHERE user_id = ?').get(userId);
  if (existing && existing.count > 0) return;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth(); // 0-indexed

  // Helper for dates in current or past month
  const makeDate = (monthsAgo, day) => {
    const d = new Date(currentYear, currentMonthNum - monthsAgo, Math.min(day, 28));
    return d.toISOString().substring(0, 10);
  };

  const currentMonthStr = now.toISOString().substring(0, 7);
  const prevMonthDate = new Date(currentYear, currentMonthNum - 1, 1);
  const prevMonthStr = prevMonthDate.toISOString().substring(0, 7);

  // 1. Create Default Accounts
  const accSavingsId = `acc_sav_${crypto.randomUUID().substring(0, 8)}`;
  const accCheckingId = `acc_chk_${crypto.randomUUID().substring(0, 8)}`;
  const accCreditId = `acc_crd_${crypto.randomUUID().substring(0, 8)}`;
  const accWalletId = `acc_wal_${crypto.randomUUID().substring(0, 8)}`;

  const insertAcc = db.prepare(`
    INSERT INTO accounts (id, user_id, name, type, opening_balance, current_balance, currency, account_number, color, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?)
  `);

  const createdTime = new Date().toISOString();
  insertAcc.run(accSavingsId, userId, 'HDFC Salary Account', 'savings', 85000, 85000, '•••• 4821', '#10B981', 'Primary salary and reserve funds', createdTime);
  insertAcc.run(accCheckingId, userId, 'ICICI Daily Checking', 'checking', 22500, 22500, '•••• 9104', '#38BDF8', 'Utility bills and rent', createdTime);
  insertAcc.run(accCreditId, userId, 'Axis Bank Magnus Credit Card', 'credit_card', 0, 0, '•••• 3319', '#8B5CF6', 'Online shopping, flights and dining points', createdTime);
  insertAcc.run(accWalletId, userId, 'Paytm & Cash Wallet', 'digital_wallet', 4200, 4200, 'Digital UPI', '#F59E0B', 'Coffee, local cabs and street vendors', createdTime);

  // 2. Insert Realistic Transactions across Current and Previous Month
  const insertTx = db.prepare(`
    INSERT INTO transactions (id, user_id, account_id, category_id, type, amount, date, title, description, merchant, payment_method, tags, is_recurring, anomaly_flag, anomaly_score, anomaly_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleTransactions = [
    // Previous Month Incomes
    { acc: accSavingsId, cat: 'cat_salary', type: 'income', amt: 95000, date: makeDate(1, 1), title: 'Monthly Salary Credit', desc: 'TechCorp Solutions monthly payroll', merchant: 'TechCorp Solutions', pay: 'NetBanking' },
    { acc: accSavingsId, cat: 'cat_investments', type: 'income', amt: 6400, date: makeDate(1, 14), title: 'Mutual Fund Dividend', desc: 'Parag Parikh Flexi Cap dividend payout', merchant: 'Groww Mutual Funds', pay: 'Direct Deposit' },
    { acc: accSavingsId, cat: 'cat_freelance', type: 'income', amt: 22000, date: makeDate(1, 20), title: 'Fintech UI Consultation', desc: 'Freelance design sprint milestone 2', merchant: 'Starlight Labs', pay: 'UPI' },

    // Previous Month Expenses
    { acc: accCheckingId, cat: 'cat_rent', type: 'expense', amt: 26000, date: makeDate(1, 2), title: 'Apartment Monthly Rent', desc: 'Indiranagar 2BHK flat rent', merchant: 'Landlord Transfer', pay: 'NetBanking', rec: 1 },
    { acc: accCheckingId, cat: 'cat_utilities', type: 'expense', amt: 2800, date: makeDate(1, 5), title: 'Electricity & Water Bill', desc: 'BESCOM power bill payment', merchant: 'BESCOM', pay: 'UPI', rec: 1 },
    { acc: accSavingsId, cat: 'cat_groceries', type: 'expense', amt: 4200, date: makeDate(1, 6), title: 'Weekly Organic Groceries', desc: 'Weekly staples and vegetables', merchant: 'Nature Basket', pay: 'UPI' },
    { acc: accCreditId, cat: 'cat_food', type: 'expense', amt: 1850, date: makeDate(1, 8), title: 'Dinner with Team', desc: 'Toit Brewpub team dinner', merchant: 'Toit Bangalore', pay: 'Card' },
    { acc: accWalletId, cat: 'cat_transport', type: 'expense', amt: 620, date: makeDate(1, 10), title: 'Uber Premier Ride', desc: 'Commute to office park', merchant: 'Uber India', pay: 'UPI' },
    { acc: accCreditId, cat: 'cat_subscriptions', type: 'expense', amt: 1199, date: makeDate(1, 12), title: 'Netflix Premium & Spotify', desc: '4K Multi-screen streaming', merchant: 'Netflix', pay: 'Card', rec: 1 },
    { acc: accSavingsId, cat: 'cat_groceries', type: 'expense', amt: 3900, date: makeDate(1, 16), title: 'Supermarket Restock', desc: 'Pantry restocking', merchant: 'Blinkit', pay: 'UPI' },
    { acc: accCreditId, cat: 'cat_shopping', type: 'expense', amt: 5400, date: makeDate(1, 18), title: 'Running Shoes & Apparel', desc: 'Nike Pegasus 40 runners', merchant: 'Nike Store', pay: 'Card' },
    { acc: accCreditId, cat: 'cat_entertainment', type: 'expense', amt: 1200, date: makeDate(1, 22), title: 'IMAX Movie Tickets', desc: 'Weekend sci-fi screening', merchant: 'PVR Cinemas', pay: 'UPI' },
    { acc: accCheckingId, cat: 'cat_emi', type: 'expense', amt: 8500, date: makeDate(1, 25), title: 'Gadget Loan EMI', desc: 'HDFC Consumer Durable EMI', merchant: 'HDFC Bank', pay: 'NetBanking', rec: 1 },

    // Current Month Incomes
    { acc: accSavingsId, cat: 'cat_salary', type: 'income', amt: 95000, date: makeDate(0, 1), title: 'Monthly Salary Credit', desc: 'TechCorp Solutions monthly payroll', merchant: 'TechCorp Solutions', pay: 'NetBanking' },
    { acc: accSavingsId, cat: 'cat_freelance', type: 'income', amt: 18500, date: makeDate(0, 12), title: 'API Integration Client Work', desc: 'Payment for Stripe webhook integration', merchant: 'Nexus Fintech', pay: 'UPI' },

    // Current Month Expenses
    { acc: accCheckingId, cat: 'cat_rent', type: 'expense', amt: 26000, date: makeDate(0, 2), title: 'Apartment Monthly Rent', desc: 'Indiranagar 2BHK flat rent', merchant: 'Landlord Transfer', pay: 'NetBanking', rec: 1 },
    { acc: accCheckingId, cat: 'cat_utilities', type: 'expense', amt: 2950, date: makeDate(0, 4), title: 'Fiber Broadband & Power', desc: 'Airtel Xstream broadband bill', merchant: 'Airtel India', pay: 'UPI', rec: 1 },
    { acc: accSavingsId, cat: 'cat_groceries', type: 'expense', amt: 5200, date: makeDate(0, 5), title: 'Whole Foods & Provisions', desc: 'Monthly kitchen supplies and fruits', merchant: 'BigBasket Instant', pay: 'UPI' },
    { acc: accCreditId, cat: 'cat_food', type: 'expense', amt: 2150, date: makeDate(0, 7), title: 'Weekend Brunch with Friends', desc: 'Artisan Cafe sourdough brunch', merchant: 'Blue Tokai Coffee', pay: 'Card' },
    { acc: accWalletId, cat: 'cat_transport', type: 'expense', amt: 850, date: makeDate(0, 9), title: 'Airport Taxi Transfer', desc: 'Cab ride to Kempegowda Airport', merchant: 'Ola Cabs', pay: 'UPI' },
    { acc: accCreditId, cat: 'cat_subscriptions', type: 'expense', amt: 1199, date: makeDate(0, 11), title: 'Digital Cloud & Subscriptions', desc: 'GitHub Copilot & iCloud storage', merchant: 'Apple Services', pay: 'Card', rec: 1 },
    { acc: accSavingsId, cat: 'cat_groceries', type: 'expense', amt: 4600, date: makeDate(0, 15), title: 'Mid-Month Grocery Order', desc: 'Fresh dairy, vegetables, dry fruits', merchant: 'Zepto', pay: 'UPI' },
    { acc: accCreditId, cat: 'cat_healthcare', type: 'expense', amt: 1450, date: makeDate(0, 18), title: 'Annual Dental Checkup', desc: 'Routine cleaning and dental check', merchant: 'Clove Dental', pay: 'UPI' },
    { acc: accCheckingId, cat: 'cat_emi', type: 'expense', amt: 8500, date: makeDate(0, 24), title: 'Gadget Loan EMI', desc: 'Monthly installment', merchant: 'HDFC Bank', pay: 'NetBanking', rec: 1 },
    // Anomaly expense for ML demonstration
    { acc: accCreditId, cat: 'cat_shopping', type: 'expense', amt: 34999, date: makeDate(0, 21), title: 'Bose QuietComfort Ultra Headphones', desc: 'Noise cancelling headphones for travel', merchant: 'Reliance Digital', pay: 'Card', anomaly: true, anomalyReason: 'Unusual: ₹34,999 is 4.1x higher than your average shopping transaction.' }
  ];

  for (const t of sampleTransactions) {
    const txId = `tx_${crypto.randomUUID().substring(0, 10)}`;
    const anomalyFlag = t.anomaly ? 1 : 0;
    const anomalyScore = t.anomaly ? 88 : 0;
    const anomalyReason = t.anomalyReason || null;
    insertTx.run(
      txId, userId, t.acc, t.cat, t.type, t.amt, t.date, t.title,
      t.desc, t.merchant, t.pay, JSON.stringify(['personal', t.cat.replace('cat_', '')]),
      t.rec ? 1 : 0, anomalyFlag, anomalyScore, anomalyReason, createdTime
    );
  }

  // Recalculate balances
  recalculateAccountBalance(accSavingsId);
  recalculateAccountBalance(accCheckingId);
  recalculateAccountBalance(accCreditId);
  recalculateAccountBalance(accWalletId);

  // 3. Budgets for Current and Prev Month
  const insertBudget = db.prepare(`
    INSERT OR REPLACE INTO budgets (id, user_id, category_id, period_month, limit_amount, alert_threshold_pct, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const budgetsConfig = [
    { cat: 'cat_rent', limit: 28000, thresh: 95 },
    { cat: 'cat_groceries', limit: 12000, thresh: 80 },
    { cat: 'cat_food', limit: 8000, thresh: 80 },
    { cat: 'cat_transport', limit: 4000, thresh: 75 },
    { cat: 'cat_shopping', limit: 15000, thresh: 80 },
    { cat: 'cat_utilities', limit: 5000, thresh: 85 },
    { cat: 'cat_entertainment', limit: 4000, thresh: 80 },
  ];

  for (const b of budgetsConfig) {
    insertBudget.run(`bgt_${b.cat}_${currentMonthStr}`, userId, b.cat, currentMonthStr, b.limit, b.thresh, createdTime);
    insertBudget.run(`bgt_${b.cat}_${prevMonthStr}`, userId, b.cat, prevMonthStr, b.limit, b.thresh, createdTime);
  }

  // 4. Savings Goals
  const insertGoal = db.prepare(`
    INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, target_date, category, color, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertGoalContrib = db.prepare(`
    INSERT INTO savings_contributions (id, goal_id, user_id, amount, date, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const goal1Id = `goal_${crypto.randomUUID().substring(0, 8)}`;
  const goal2Id = `goal_${crypto.randomUUID().substring(0, 8)}`;
  const goal3Id = `goal_${crypto.randomUUID().substring(0, 8)}`;

  insertGoal.run(goal1Id, userId, '6-Month Emergency Fund', 300000, 185000, `${currentYear + 1}-06-30`, 'Emergency', '#10B981', 'Living expenses reserve for 6 months safety net', createdTime);
  insertGoal.run(goal2Id, userId, 'MacBook Pro M4 Max', 249000, 160000, `${currentYear}-12-25`, 'Tech', '#8B5CF6', 'Upgrading workstation for AI development and design', createdTime);
  insertGoal.run(goal3Id, userId, 'Japan Sakura Spring Trip', 200000, 75000, `${currentYear + 1}-04-15`, 'Travel', '#38BDF8', 'Flights, ryokan stays and bullet train passes in Tokyo & Kyoto', createdTime);

  insertGoalContrib.run(crypto.randomUUID(), goal1Id, userId, 25000, makeDate(1, 15), 'Monthly emergency allocation', createdTime);
  insertGoalContrib.run(crypto.randomUUID(), goal1Id, userId, 25000, makeDate(0, 15), 'Monthly emergency allocation', createdTime);
  insertGoalContrib.run(crypto.randomUUID(), goal2Id, userId, 30000, makeDate(0, 18), 'Tech upgrade savings', createdTime);

  // 5. Recurring Transactions
  const insertRec = db.prepare(`
    INSERT INTO recurring_transactions (id, user_id, account_id, category_id, title, amount, type, frequency, start_date, end_date, next_due_date, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  insertRec.run(`rec_${crypto.randomUUID().substring(0, 8)}`, userId, accCheckingId, 'cat_rent', 'Indiranagar 2BHK Rent', 26000, 'expense', 'monthly', `${currentYear}-01-02`, null, makeDate(0, 2), createdTime);
  insertRec.run(`rec_${crypto.randomUUID().substring(0, 8)}`, userId, accCreditId, 'cat_subscriptions', 'Netflix Premium & Spotify Family', 1199, 'expense', 'monthly', `${currentYear}-01-12`, null, makeDate(0, 12), createdTime);
  insertRec.run(`rec_${crypto.randomUUID().substring(0, 8)}`, userId, accSavingsId, 'cat_salary', 'TechCorp Monthly Salary', 95000, 'income', 'monthly', `${currentYear}-01-01`, null, makeDate(0, 1), createdTime);
  insertRec.run(`rec_${crypto.randomUUID().substring(0, 8)}`, userId, accCheckingId, 'cat_emi', 'Consumer Electronics EMI', 8500, 'expense', 'monthly', `${currentYear}-01-24`, `${currentYear + 1}-06-24`, makeDate(0, 24), createdTime);

  // 6. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, severity, is_read, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(crypto.randomUUID(), userId, 'anomaly', 'Unusual Spending Detected', 'Reliance Digital purchase of ₹34,999 is 4.1x higher than typical shopping expenses.', 'warning', 0, '/transactions', createdTime);
  insertNotif.run(crypto.randomUUID(), userId, 'budget_alert', 'Budget Alert: Shopping', 'You have utilized 233% of your ₹15,000 monthly shopping budget due to tech purchase.', 'danger', 0, '/budgets', createdTime);
  insertNotif.run(crypto.randomUUID(), userId, 'goal_milestone', 'Savings Milestone Reached!', 'MacBook Pro M4 Max goal has crossed 64% progress (₹1,60,000 saved).', 'success', 0, '/savings-goals', createdTime);
  insertNotif.run(crypto.randomUUID(), userId, 'bill_due', 'Upcoming Payment Reminder', 'Consumer Electronics EMI of ₹8,500 is due in 3 days.', 'info', 1, '/recurring', createdTime);
}
