const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, opts);
  } catch (networkErr) {
    throw new Error('Network error — cannot reach backend. Check your connection.');
  }

  // Parse response — handle non-JSON gracefully
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      throw new Error(`Invalid JSON from server (status ${res.status})`);
    }
  } else {
    // Non-JSON response (HTML from SPA fallback, plain text, etc.)
    const text = await res.text().catch(() => '');
    throw new Error(
      res.ok
        ? `Unexpected non-JSON response from ${method} ${path}`
        : `${res.status} ${res.statusText || 'Error'} — ${method} ${path}`
    );
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }

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
  getConfigStatus: () => request('GET', '/settings/status'),
  updateSettings: (data) => request('PUT', '/settings', data),
  testAI: () => request('GET', '/settings/test-ai'),

  // Webhooks info (endpoint is at /webhooks, outside /api/)
  getWebhooks: () => {
    const backendRoot = BASE_URL.replace(/\/api$/, '');
    return fetch(`${backendRoot}/webhooks`).then(r => r.json()).catch(() => null);
  },
};
