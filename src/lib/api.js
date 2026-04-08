const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Accounts
  getAccounts: () => request('GET', '/accounts'),
  createAccount: (data) => request('POST', '/accounts', data),
  updateAccount: (id, data) => request('PUT', `/accounts/${id}`, data),
  deleteAccount: (id) => request('DELETE', `/accounts/${id}`),
  getAccountStats: (id) => request('GET', `/accounts/${id}/stats`),
  getAccountMedia: (id) => request('GET', `/accounts/${id}/media`),

  // Rules
  getRules: (accountId) => request('GET', `/rules${accountId ? `?account_id=${accountId}` : ''}`),
  createRule: (data) => request('POST', '/rules', data),
  updateRule: (id, data) => request('PUT', `/rules/${id}`, data),
  deleteRule: (id) => request('DELETE', `/rules/${id}`),

  // Activity
  getActivity: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/activity${qs ? '?' + qs : ''}`);
  },
  getDashboardStats: () => request('GET', '/activity/stats'),
  getQueue: () => request('GET', '/activity/queue'),

  // Settings
  getSettings: () => request('GET', '/settings'),
  updateSettings: (data) => request('PUT', '/settings', data),
  testAI: () => request('GET', '/settings/test-ai'),

  // Webhooks info
  getWebhooks: () => fetch('/webhooks').then(r => r.json()),
};
