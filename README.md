# FinSight AI — Understand Your Money. Control Your Future.

FinSight AI is a production-ready personal finance management and spending analytics platform engineered with financial rigor, machine learning forecasting, and contextual Google Gemini intelligence.

---

## 🌟 Key Features

1. **Intelligent Financial Dashboard:**
   - Real-time aggregation of Total Balance, Inflows, Outflows, Net Savings, and Savings Rate.
   - Interactive Recharts: 6-Month Income vs Expense Bar Chart, Category Expense Donut Chart, and Cumulative Spending Trajectory Area Chart.
   - Intelligent Budget Guardrails with warning badges at 50%, 75%, 85%, and 100% capacity.

2. **Machine Learning Engines:**
   - **Automated Categorization (NLP):** TF-IDF keyword classification engine that auto-detects and maps payees/merchants (e.g. Swiggy, Uber, Whole Foods, Netflix) with confidence scores.
   - **Time-Series Spending Forecasting:** Ordinary Least Squares (OLS) regression projecting next month's total expenditure with 95% statistical confidence intervals (upper/lower bounds).
   - **Statistical Anomaly Detection:** Real-time Interquartile Range (IQR) and Z-score outlier detection highlighting unusual single charges.

3. **Gemini AI Financial Advisor:**
   - Secure server-side Google Gemini 2.5 Flash integration via `@google/genai`.
   - Context injection: Grounded in your authentic portfolio state, active budgets, anomalies, and goals.
   - Suggested prompts for fast insights ("Where did I spend the most?", "How can I save ₹10,000 extra?").

4. **Multi-Account & Currency Support:**
   - Manage Savings Accounts, Checking Accounts, Credit Cards, Cash, and Digital Wallets.
   - Native support for Indian Rupee (`₹ INR`), US Dollar (`$ USD`), Euro (`€ EUR`), and British Pound (`£ GBP`).

5. **Bank Statement CSV Ingestion:**
   - Drag-and-drop CSV importer with column mapping, duplicate detection, and automated ML category assignment.

6. **Savings Goals & Recurring Schedules:**
   - Multi-goal tracking with monthly required contribution calculations.
   - Automated recurring transaction scheduler with idempotency checks.

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env` based on `.env.example`:
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

### 3. Start the Full-Stack Dev Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000` serving both the React SPA and the REST API (`/api/*`).

### 4. Run Automated Unit Tests
```bash
npx --yes tsx --test server/tests/finance.test.ts
```

---

## 🐳 Docker Deployment

To launch with Docker Compose:
```bash
docker compose up -d
```

---

## 🔒 Security Architecture
- Password hashing using standard `scrypt` with cryptographic salt.
- JWT-style HMAC-SHA256 signature verification.
- Tenant isolation enforced on every SQL query via foreign key constraints.
- Sensitive financial metrics and Gemini API keys are never exposed on client-side bundles.
