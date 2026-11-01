import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';
import { forecastSpending } from './ml.js';

let geminiClient = null;
function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI();
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err.message);
    }
  }
  return geminiClient;
}

/**
 * Gather strictly isolated financial context for the authenticated user
 */
export function buildUserFinancialSummary(userId) {
  // Current month YYYY-MM
  const currentMonth = new Date().toISOString().substring(0, 7);

  // Accounts summary
  const accounts = db.prepare(`
    SELECT name, type, current_balance, currency
    FROM accounts
    WHERE user_id = ?
  `).all(userId);

  const totalBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

  // Monthly income & expense
  const monthlyStats = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
      COUNT(*) as total_transactions
    FROM transactions
    WHERE user_id = ? AND substr(date, 1, 7) = ?
  `).get(userId, currentMonth);

  // Top spending categories this month
  const topCategories = db.prepare(`
    SELECT c.name, SUM(t.amount) as amount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense' AND substr(t.date, 1, 7) = ?
    GROUP BY c.id
    ORDER BY amount DESC
    LIMIT 5
  `).all(userId, currentMonth);

  // Budgets at risk
  const budgetAlerts = db.prepare(`
    SELECT c.name, b.limit_amount,
           COALESCE(SUM(t.amount), 0) as spent
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    LEFT JOIN transactions t ON t.category_id = b.category_id
      AND t.user_id = b.user_id
      AND substr(t.date, 1, 7) = b.period_month
      AND t.type = 'expense'
    WHERE b.user_id = ? AND b.period_month = ?
    GROUP BY b.id
    HAVING spent >= (b.limit_amount * 0.75)
  `).all(userId, currentMonth);

  // Recent anomalies
  const anomalies = db.prepare(`
    SELECT title, amount, date, anomaly_reason
    FROM transactions
    WHERE user_id = ? AND anomaly_flag = 1
    ORDER BY date DESC
    LIMIT 3
  `).all(userId);

  // Forecast data
  const forecast = forecastSpending(userId);

  return {
    currentMonth,
    totalBalance,
    income: monthlyStats ? monthlyStats.income : 0,
    expense: monthlyStats ? monthlyStats.expense : 0,
    netSavings: (monthlyStats ? monthlyStats.income : 0) - (monthlyStats ? monthlyStats.expense : 0),
    topCategories,
    budgetAlerts,
    anomalies,
    forecast: {
      predictedTotal: forecast.predictedTotal,
      historicalTrend: forecast.historicalTrend
    }
  };
}

/**
 * Intelligent deterministic fallback when Gemini API key is missing or quota is exceeded
 */
function generateHeuristicResponse(userMessage, summary) {
  const q = userMessage.toLowerCase();
  const currency = '₹';

  if (q.includes('spend the most') || q.includes('top category') || q.includes('biggest expense')) {
    if (summary.topCategories.length === 0) {
      return `For **${summary.currentMonth}**, you have no recorded expenses yet. Once you add transactions, I will analyze your largest spending areas.`;
    }
    const top = summary.topCategories[0];
    return `Your biggest spending category this month is **${top.name}** at **${currency}${top.amount.toLocaleString('en-IN')}**.\n\n` +
      `Here is the full breakdown of your top expenses:\n` +
      summary.topCategories.map(c => `• **${c.name}**: ${currency}${c.amount.toLocaleString('en-IN')}`).join('\n') +
      `\n\n💡 *Tip: Consider setting a monthly budget for ${top.name} in the Budgets section to keep spending predictable.*`;
  }

  if (q.includes('save') || q.includes('savings') || q.includes('saved')) {
    const savingsRate = summary.income > 0 ? Math.round((summary.netSavings / summary.income) * 100) : 0;
    return `### Monthly Savings Analysis (${summary.currentMonth})\n\n` +
      `• **Total Income:** ${currency}${summary.income.toLocaleString('en-IN')}\n` +
      `• **Total Expenses:** ${currency}${summary.expense.toLocaleString('en-IN')}\n` +
      `• **Net Savings:** ${currency}${summary.netSavings.toLocaleString('en-IN')}\n` +
      `• **Savings Rate:** **${savingsRate}%**\n\n` +
      (savingsRate >= 20
        ? `🎉 Great work! You are maintaining a healthy ${savingsRate}% savings rate, exceeding the standard 20% rule of thumb.`
        : `⚠️ Your savings rate is currently ${savingsRate}%. Target at least 20% by curbing discretionary spending in your top categories.`);
  }

  if (q.includes('predict') || q.includes('next month') || q.includes('forecast')) {
    return `### AI Spending Forecast for Next Month\n\n` +
      `Based on your spending velocity and time-series model:\n` +
      `• **Projected Spending:** **${currency}${summary.forecast.predictedTotal.toLocaleString('en-IN')}**\n` +
      `• **Historical Trend:** ${summary.forecast.historicalTrend.toUpperCase()}\n\n` +
      `If your income remains around ${currency}${summary.income.toLocaleString('en-IN')}, you are on track to save approximately **${currency}${Math.max(0, summary.income - summary.forecast.predictedTotal).toLocaleString('en-IN')}** next month.`;
  }

  if (q.includes('unusual') || q.includes('anomaly') || q.includes('alert')) {
    if (summary.anomalies.length === 0) {
      return `✅ **No unusual spending detected!** All your recent transactions are aligned with your typical spending baseline.`;
    }
    return `⚠️ **Unusual Transactions Detected:**\n\n` +
      summary.anomalies.map(a => `• **${a.title}** (${currency}${a.amount.toLocaleString('en-IN')} on ${a.date}): ${a.anomaly_reason || 'Deviates significantly from standard category median.'}`).join('\n\n') +
      `\n\nYou can review these flagged items directly on your Transactions page.`;
  }

  // General comprehensive financial overview
  return `### Financial Intelligence Summary for ${summary.currentMonth}\n\n` +
    `• **Total Portfolio Balance:** ${currency}${summary.totalBalance.toLocaleString('en-IN')}\n` +
    `• **Month-to-Date Inflow:** ${currency}${summary.income.toLocaleString('en-IN')}\n` +
    `• **Month-to-Date Outflow:** ${currency}${summary.expense.toLocaleString('en-IN')}\n` +
    `• **Current Savings:** ${currency}${summary.netSavings.toLocaleString('en-IN')}\n\n` +
    (summary.budgetAlerts.length > 0
      ? `⚠️ **Budget Watch:** You have consumed over 75% of your limit in: ${summary.budgetAlerts.map(b => `${b.name} (${currency}${b.spent}/${currency}${b.limit_amount})`).join(', ')}.\n\n`
      : `✅ All active category budgets are within safe thresholds.\n\n`) +
    `Feel free to ask me questions like:\n` +
    `• *"Where did I spend the most this month?"*\n` +
    `• *"How much can I potentially save next month?"*\n` +
    `• *"What are my biggest recurring expenses?"*`;
}

/**
 * Chat with Gemini with injected user financial context
 */
export async function askGeminiAssistant(userId, userMessage, conversationHistory = []) {
  const summary = buildUserFinancialSummary(userId);
  const client = getGeminiClient();

  if (!client) {
    return generateHeuristicResponse(userMessage, summary);
  }

  try {
    const systemPrompt = `You are FinSight AI, a premier personal finance intelligence assistant.
You provide clear, empowering, mathematically precise financial insights based strictly on the user's authentic financial data.
DO NOT fabricate numbers or transactions not in the user's summary.
DO NOT provide illegal investment guarantees or registered legal financial advice.
Format your answer with clean markdown, bullet points, and highlight key metrics. Default currency is Indian Rupees (₹) unless user specifies otherwise.

User's Real-time Financial Context:
${JSON.stringify(summary, null, 2)}
`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        temperature: 0.3,
        maxOutputTokens: 900
      }
    });

    return response.text || generateHeuristicResponse(userMessage, summary);
  } catch (err) {
    console.error('Gemini API call failed, using heuristic fallback:', err.message);
    return generateHeuristicResponse(userMessage, summary);
  }
}
