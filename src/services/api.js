const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('finsight_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('finsight_token', token);
  } else {
    localStorage.removeItem('finsight_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      // Clear token if expired
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent('finsight_auth_expired'));
    }
    const error = new Error(data.error || 'An error occurred while communicating with the server.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  demoLogin: () => apiRequest('/auth/demo', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (body) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  forgotPassword: (body) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // Accounts
  getAccounts: () => apiRequest('/accounts'),
  createAccount: (body) => apiRequest('/accounts', { method: 'POST', body: JSON.stringify(body) }),
  updateAccount: (id, body) => apiRequest(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: (id) => apiRequest(`/accounts/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => apiRequest('/categories'),
  createCategory: (body) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(body) }),

  // Transactions
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/transactions${query ? `?${query}` : ''}`);
  },
  createTransaction: (body) => apiRequest('/transactions', { method: 'POST', body: JSON.stringify(body) }),
  updateTransaction: (id, body) => apiRequest(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTransaction: (id) => apiRequest(`/transactions/${id}`, { method: 'DELETE' }),
  previewCsv: (csvContent) => apiRequest('/transactions/import-csv/preview', { method: 'POST', body: JSON.stringify({ csvContent }) }),
  confirmCsv: (body) => apiRequest('/transactions/import-csv/confirm', { method: 'POST', body: JSON.stringify(body) }),

  // Budgets
  getBudgets: (month) => apiRequest(`/budgets${month ? `?month=${month}` : ''}`),
  saveBudget: (body) => apiRequest('/budgets', { method: 'POST', body: JSON.stringify(body) }),
  deleteBudget: (id) => apiRequest(`/budgets/${id}`, { method: 'DELETE' }),

  // Savings Goals
  getSavingsGoals: () => apiRequest('/savings-goals'),
  createSavingsGoal: (body) => apiRequest('/savings-goals', { method: 'POST', body: JSON.stringify(body) }),
  contributeToGoal: (id, body) => apiRequest(`/savings-goals/${id}/contribute`, { method: 'POST', body: JSON.stringify(body) }),
  deleteSavingsGoal: (id) => apiRequest(`/savings-goals/${id}`, { method: 'DELETE' }),

  // Recurring
  getRecurring: () => apiRequest('/recurring'),
  createRecurring: (body) => apiRequest('/recurring', { method: 'POST', body: JSON.stringify(body) }),
  updateRecurring: (id, body) => apiRequest(`/recurring/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRecurring: (id) => apiRequest(`/recurring/${id}`, { method: 'DELETE' }),
  processRecurring: () => apiRequest('/recurring/process', { method: 'POST' }),

  // Analytics & ML
  getDashboardAnalytics: (range = 'month') => apiRequest(`/analytics/dashboard?range=${range}`),
  getDeepDiveAnalytics: () => apiRequest('/analytics/deep-dive'),
  predictCategory: (body) => apiRequest('/ml/categorize', { method: 'POST', body: JSON.stringify(body) }),
  getForecast: () => apiRequest('/ml/forecast'),
  getAnomalies: () => apiRequest('/ml/anomalies'),

  // AI Assistant
  getAiSummary: () => apiRequest('/ai/summary'),
  sendAiChat: (body) => apiRequest('/ai/chat', { method: 'POST', body: JSON.stringify(body) }),
  getAiMessages: (conversationId) => apiRequest(`/ai/messages${conversationId ? `?conversation_id=${conversationId}` : ''}`),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  clearNotifications: () => apiRequest('/notifications/clear', { method: 'DELETE' }),

  // Reports
  getReportSummary: (startDate, endDate) => apiRequest(`/reports/summary?start_date=${startDate || ''}&end_date=${endDate || ''}`),
};
