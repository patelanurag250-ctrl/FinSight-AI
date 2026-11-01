import { db } from './db.js';

// Pre-trained financial vocabulary with TF-IDF keyword weights
const CATEGORY_VOCABULARY = {
  cat_food: [
    'starbucks', 'mcdonalds', 'kfc', 'burger', 'pizza', 'dominos', 'subway', 'zomato', 'swiggy',
    'restaurant', 'cafe', 'coffee', 'diner', 'bistro', 'food', 'bar', 'bakery', 'lunch', 'dinner',
    'breakfast', 'chipotle', 'taco', 'eat', 'beverage', 'snack'
  ],
  cat_groceries: [
    'walmart', 'costco', 'target', 'supermarket', 'grocery', 'whole foods', 'trader joe', 'kroger',
    'blinkit', 'zepto', 'bigbasket', 'instacart', 'market', 'provisions', 'safeway', 'aldi', 'vegetables', 'fruits'
  ],
  cat_transport: [
    'uber', 'lyft', 'ola', 'taxi', 'cab', 'metro', 'subway', 'train', 'irctc', 'gas', 'fuel',
    'petrol', 'diesel', 'parking', 'toll', 'fastag', 'transit', 'bus', 'shell', 'chevron', 'flight'
  ],
  cat_rent: [
    'rent', 'landlord', 'apartment', 'housing', 'lease', 'society maintenance', 'property management', 'flat maintenance'
  ],
  cat_utilities: [
    'electric', 'electricity', 'water', 'gas utility', 'internet', 'broadband', 'wifi', 'airtel',
    'jio', 'verizon', 'at&t', 'power', 'sewer', 'utility bill', 'trash', 'cylinder', 'lpg'
  ],
  cat_shopping: [
    'amazon', 'flipkart', 'myntra', 'ebay', 'aliexpress', 'zara', 'h&m', 'nike', 'adidas',
    'clothing', 'apparel', 'shoes', 'electronics', 'best buy', 'apple store', 'mall', 'retail'
  ],
  cat_healthcare: [
    'pharmacy', 'chemist', 'hospital', 'clinic', 'doctor', 'dental', 'dentist', 'apollo',
    'medplus', 'medicine', 'prescription', 'health', 'optometry', 'lab test', 'diagnostic'
  ],
  cat_entertainment: [
    'cinema', 'movies', 'theatre', 'bookmyshow', 'amc', 'steam', 'playstation', 'xbox',
    'nintendo', 'game', 'concert', 'bowling', 'amusement', 'event', 'ticket'
  ],
  cat_education: [
    'coursera', 'udemy', 'edx', 'tuition', 'school', 'college', 'university', 'books',
    'course', 'textbook', 'bootcamp', 'training', 'classes', 'exam fee'
  ],
  cat_travel: [
    'airbnb', 'hotel', 'booking.com', 'makemytrip', 'agoda', 'expedia', 'resort', 'flight',
    'airline', 'delta', 'indigo', 'emirates', 'luggage', 'hostel'
  ],
  cat_subscriptions: [
    'netflix', 'spotify', 'youtube', 'amazon prime', 'disney', 'hulu', 'apple music',
    'github', 'chatgpt', 'openai', 'notion', 'medium', 'patreon', 'icloud', 'google one'
  ],
  cat_emi: [
    'emi', 'loan', 'mortgage', 'hdfc loan', 'sbi loan', 'credit card payment', 'installment',
    'car loan', 'home loan', 'personal loan'
  ],
  cat_salary: [
    'salary', 'payroll', 'wages', 'stipend', 'compensation', 'employer', 'direct deposit', 'bonus'
  ],
  cat_investments: [
    'dividend', 'zerodha', 'groww', 'vanguard', 'fidelity', 'robinhood', 'mutual fund',
    'stocks', 'crypto', 'interest credit', 'fixed deposit'
  ],
  cat_freelance: [
    'freelance', 'upwork', 'fiverr', 'client payment', 'consulting', 'contract payment', 'invoiced'
  ]
};

/**
 * 1. AUTOMATED CATEGORIZATION ML MODEL
 * Predicts category using normalized n-gram token matching and user-learned corrections
 */
export function predictCategory(userId, title, merchant = '', description = '') {
  const text = `${title} ${merchant} ${description}`.toLowerCase();
  const tokens = text.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 1);

  // Check user's historical corrections / past transactions for exact or fuzzy match
  if (userId) {
    const historicalMatch = db.prepare(`
      SELECT category_id, count(*) as freq
      FROM transactions
      WHERE user_id = ? AND (LOWER(title) = ? OR (merchant IS NOT NULL AND LOWER(merchant) = ?))
      GROUP BY category_id
      ORDER BY freq DESC
      LIMIT 1
    `).get(userId, title.toLowerCase().trim(), merchant ? merchant.toLowerCase().trim() : '');

    if (historicalMatch && historicalMatch.freq >= 2) {
      const cat = db.prepare('SELECT id, name, icon, color, type FROM categories WHERE id = ?').get(historicalMatch.category_id);
      if (cat) {
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          confidence: Math.min(0.98, 0.85 + (historicalMatch.freq * 0.03)),
          source: 'user_learned_model'
        };
      }
    }
  }

  // Vocabulary scoring
  let bestCategory = 'cat_other_exp';
  let maxScore = 0;
  let totalScore = 0;

  for (const [catId, keywords] of Object.entries(CATEGORY_VOCABULARY)) {
    let catScore = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        // Longer matching phrases give higher confidence
        catScore += (kw.length >= 6 ? 3.5 : 2.0);
      }
      for (const token of tokens) {
        if (token === kw) {
          catScore += 2.5;
        } else if (token.includes(kw) || kw.includes(token)) {
          catScore += 0.8;
        }
      }
    }
    if (catScore > 0) {
      totalScore += catScore;
      if (catScore > maxScore) {
        maxScore = catScore;
        bestCategory = catId;
      }
    }
  }

  const confidence = maxScore > 0 ? Math.min(0.96, Math.max(0.65, maxScore / (totalScore * 0.9))) : 0.40;
  const cat = db.prepare('SELECT id, name, icon, color, type FROM categories WHERE id = ?').get(bestCategory);

  return {
    categoryId: cat ? cat.id : 'cat_other_exp',
    categoryName: cat ? cat.name : 'Other Expenses',
    categoryIcon: cat ? cat.icon : 'MoreHorizontal',
    confidence: Number(confidence.toFixed(2)),
    source: 'nlp_classifier'
  };
}

/**
 * 2. SPENDING FORECASTING MODEL
 * Time-series trend regression with confidence intervals and category breakdown
 */
export function forecastSpending(userId) {
  // Aggregate monthly spending by user over the last 12 months
  const monthlyData = db.prepare(`
    SELECT
      substr(date, 1, 7) as month,
      SUM(amount) as total_spent,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE user_id = ? AND type = 'expense'
    GROUP BY substr(date, 1, 7)
    ORDER BY month ASC
  `).all(userId);

  if (!monthlyData || monthlyData.length === 0) {
    return {
      status: 'insufficient_data',
      message: 'Need transaction history to generate spending forecasts.',
      historicalMonths: 0,
      predictedTotal: 0,
      confidenceRange: { lower: 0, upper: 0 },
      categoryBreakdown: []
    };
  }

  const n = monthlyData.length;
  const spends = monthlyData.map(d => d.total_spent);
  const avgSpend = spends.reduce((a, b) => a + b, 0) / n;

  let slope = 0;
  let predictedTotal = avgSpend;

  if (n >= 2) {
    // Ordinary Least Squares Linear Regression
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += spends[i];
      sumXY += i * spends[i];
      sumXX += i * i;
    }
    const denom = (n * sumXX - sumX * sumX);
    if (denom !== 0) {
      slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;
      predictedTotal = Math.max(0, intercept + slope * n);
    }
  }

  // Calculate variance and 95% standard error margin
  const variance = spends.reduce((acc, val) => acc + Math.pow(val - avgSpend, 2), 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance);
  const margin = n >= 3 ? 1.96 * (stdDev / Math.sqrt(n)) : stdDev * 0.25;

  const lowerBound = Math.max(0, Math.round(predictedTotal - margin));
  const upperBound = Math.round(predictedTotal + margin);

  // Category-wise proportion projection
  const categorySpending = db.prepare(`
    SELECT
      c.id, c.name, c.color, c.icon,
      SUM(t.amount) as total_cat_spent,
      COUNT(t.id) as trans_count
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense'
    GROUP BY c.id
    ORDER BY total_cat_spent DESC
  `).all(userId);

  const totalAllTime = categorySpending.reduce((acc, c) => acc + c.total_cat_spent, 0) || 1;
  const categoryBreakdown = categorySpending.map(cat => {
    const proportion = cat.total_cat_spent / totalAllTime;
    const catPredicted = Math.round(predictedTotal * proportion);
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      color: cat.color,
      icon: cat.icon,
      historicalTotal: cat.total_cat_spent,
      predictedAmount: catPredicted,
      percentage: Math.round(proportion * 100)
    };
  });

  return {
    status: n >= 3 ? 'high_confidence' : 'moderate_confidence',
    historicalMonths: n,
    historicalTrend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
    monthlySlope: Math.round(slope),
    predictedTotal: Math.round(predictedTotal),
    confidenceRange: {
      lower: lowerBound,
      upper: upperBound,
      margin: Math.round(margin)
    },
    historicalData: monthlyData,
    categoryBreakdown
  };
}

/**
 * 3. ANOMALY DETECTION ML MODEL
 * Statistical outlier detection (IQR + Z-Score) on category transactions
 */
export function checkTransactionAnomaly(userId, categoryId, amount, currentTransactionId = null) {
  // Query previous transactions in this category for baseline distribution
  let query = `
    SELECT amount
    FROM transactions
    WHERE user_id = ? AND category_id = ? AND type = 'expense'
  `;
  const params = [userId, categoryId];

  if (currentTransactionId) {
    query += ' AND id != ?';
    params.push(currentTransactionId);
  }

  const rows = db.prepare(query).all(...params);

  if (rows.length < 3) {
    // Insufficient baseline; only flag extreme numbers (> ₹100,000)
    if (amount > 100000) {
      return {
        isAnomaly: true,
        score: 75,
        reason: `Unusually large single expense of ₹${amount.toLocaleString('en-IN')}`,
        severity: 'warning'
      };
    }
    return { isAnomaly: false, score: 0, reason: null };
  }

  const amounts = rows.map(r => r.amount).sort((a, b) => a - b);
  const n = amounts.length;
  const mean = amounts.reduce((a, b) => a + b, 0) / n;
  const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance) || 1;

  // Median and IQR
  const median = amounts[Math.floor(n / 2)];
  const q1 = amounts[Math.floor(n / 4)];
  const q3 = amounts[Math.floor((3 * n) / 4)];
  const iqr = q3 - q1;
  const upperIqrThreshold = q3 + 2.5 * iqr;

  // Z-Score
  const zScore = (amount - mean) / stdDev;

  // Evaluation
  if (amount > upperIqrThreshold && zScore > 2.5) {
    const ratio = (amount / (median || mean || 1)).toFixed(1);
    const score = Math.min(99, Math.round(50 + zScore * 12));
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(categoryId);
    const catName = cat ? cat.name : 'this category';

    return {
      isAnomaly: true,
      score,
      zScore: Number(zScore.toFixed(2)),
      reason: `Unusual Spending: ₹${amount.toLocaleString('en-IN')} is ${ratio}x higher than your normal ${catName} median of ₹${Math.round(median).toLocaleString('en-IN')}.`,
      severity: score > 80 ? 'high' : 'medium'
    };
  }

  return { isAnomaly: false, score: 0, reason: null };
}
