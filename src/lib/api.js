const isBrowser = typeof window !== 'undefined';
const isLocalHost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

function trimTrailingSlash(value) {
  return value?.replace(/\/$/, '') || '';
}

function normalizeApiBaseUrl(value) {
  const trimmed = trimTrailingSlash(value);
  if (!trimmed) return '/api';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');

function getMisconfiguredFrontendMessage(path, responseUrl) {
  if (!isBrowser || isLocalHost || API_BASE_URL !== '/api') return null;
  if (!responseUrl?.startsWith(window.location.origin)) return null;
  return `Frontend is calling its own /api route instead of the backend for ${path}. Set VITE_API_URL to your backend /api URL and redeploy the frontend.`;
}

async function request(method, path, body = null) {
  const requestUrl = `${API_BASE_URL}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(requestUrl, opts);
  } catch (networkErr) {
    throw new Error('Network error: cannot reach backend. Check your connection.');
  }

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      throw new Error(`Invalid JSON from server (status ${res.status})`);
    }
  } else {
    throw new Error(
      res.ok
        ? `Unexpected non-JSON response from ${method} ${path}`
        : `${res.status} ${res.statusText || 'Error'}: ${method} ${path}`
    );
  }

  if (!res.ok) {
    throw new Error(
      getMisconfiguredFrontendMessage(path, res.url) ||
      data.error ||
      data.message ||
      `Request failed (${res.status})`
    );
  }

  return data;
}

export const api = {
  getAccounts: () => request('GET', '/accounts'),
  createAccount: (data) => request('POST', '/accounts', data),
  updateAccount: (id, data) => request('PUT', `/accounts/${id}`, data),
  deleteAccount: (id) => request('DELETE', `/accounts/${id}`),
  getAccountStats: (id) => request('GET', `/accounts/${id}/stats`),
  getAccountMedia: (id) => request('GET', `/accounts/${id}/media`),

  getRules: (accountId) => request('GET', `/rules${accountId ? `?account_id=${accountId}` : ''}`),
  createRule: (data) => request('POST', '/rules', data),
  updateRule: (id, data) => request('PUT', `/rules/${id}`, data),
  deleteRule: (id) => request('DELETE', `/rules/${id}`),

  getActivity: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/activity${qs ? '?' + qs : ''}`);
  },
  getDashboardStats: () => request('GET', '/activity/stats'),
  getQueue: () => request('GET', '/activity/queue'),

  getSettings: () => request('GET', '/settings'),
  getConfigStatus: () => request('GET', '/settings/status'),
  updateSettings: (data) => request('PUT', '/settings', data),
  testAI: () => request('GET', '/settings/test-ai'),

  getWebhooks: () => {
    return fetch(`${BACKEND_URL}/webhooks`).then(r => r.json()).catch(() => null);
  },
};
