import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight, Link, AlertCircle, CheckCircle } from 'lucide-react';
import { api, BACKEND_URL } from '../lib/api';

function OAuthBanner() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('oauth_success');
  const error = params.get('oauth_error');

  useEffect(() => {
    if (success || error) {
      window.history.replaceState({}, '', '/accounts');
    }
  }, []);

  if (success) {
    return (
      <div className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl">
        <CheckCircle size={18} />
        <span>Successfully connected {success} Instagram account{success > 1 ? 's' : ''}.</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-medium">Connection failed</div>
          <div className="text-sm mt-0.5">{decodeURIComponent(error)}</div>
        </div>
      </div>
    );
  }

  return null;
}

const EMPTY_FORM = { platform: 'instagram', account_id: '', username: '', access_token: '', page_id: '' };

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showManual, setShowManual] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [configStatus, setConfigStatus] = useState(null);

  const load = () => api.getAccounts().then(setAccounts).catch(console.error);

  useEffect(() => {
    load();
    api.getSettings().then(setSettings).catch(console.error);
    api.getConfigStatus().then(setConfigStatus).catch(console.error);
  }, []);

  const oauthReady = configStatus?.oauth_ready;

  const connectInstagram = () => {
    if (!oauthReady) {
      window.location.href = '/settings';
      return;
    }

    window.location.href = `${BACKEND_URL}/api/oauth/instagram/connect`;
  };

  const connectTikTok = () => {
    if (!settings.tiktok_client_key || settings.tiktok_client_key === '') {
      window.location.href = '/settings';
      return;
    }
    window.location.href = `${BACKEND_URL}/api/oauth/tiktok/connect`;
  };

  const save = async () => {
    setError('');
    setLoading(true);
    try {
      if (editId) await api.updateAccount(editId, form);
      else await api.createAccount(form);
      setShowManual(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this account and all its rules?')) return;
    await api.deleteAccount(id);
    load();
  };

  const toggle = async (account) => {
    await api.updateAccount(account.id, { is_active: account.is_active ? 0 : 1 });
    load();
  };

  const startEdit = (account) => {
    setForm({
      platform: account.platform,
      account_id: account.account_id,
      username: account.username,
      access_token: '',
      page_id: account.page_id || ''
    });
    setEditId(account.id);
    setShowManual(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Accounts</h1>
          <p className="text-text-muted text-sm mt-0.5">Connect your Instagram and TikTok accounts.</p>
        </div>
      </div>

      <OAuthBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={connectInstagram}
          className="card border-pink-500/30 hover:border-pink-500/60 hover:bg-pink-500/5 transition-all duration-200 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/25">
              <span className="text-white font-bold text-lg">IG</span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-text-primary flex items-center gap-2">
                Connect Instagram
                <Link size={14} className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-text-muted text-xs mt-0.5">
                {oauthReady ? 'One-click via Instagram Login' : 'Needs one-time admin setup'}
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-text-muted">
            {oauthReady
              ? 'SocialMind uses the saved app credentials automatically. You do not need to re-enter Meta App ID or Secret here.'
              : <>Instagram Login is not ready yet. Open <a href="/settings" className="text-accent-blue underline">Settings</a> to view integration status.</>
            }
          </div>
        </button>

        <button
          onClick={connectTikTok}
          className="card border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/5 transition-all duration-200 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/25">
              <span className="text-white font-bold text-lg">TK</span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-text-primary flex items-center gap-2">
                Connect TikTok
                <Link size={14} className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-text-muted text-xs mt-0.5">One-click via TikTok OAuth</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-text-muted">
            Requires: TikTok for Business account
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <button
          onClick={() => { setShowManual(!showManual); setEditId(null); setForm(EMPTY_FORM); }}
          className="text-text-muted text-xs hover:text-text-secondary flex items-center gap-1.5"
        >
          <Plus size={13} /> Manual account entry (advanced)
        </button>
        <div className="flex-1 h-px bg-border" />
      </div>

      {showManual && (
        <div className="card border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary text-sm">{editId ? 'Edit account' : 'Add account manually'}</h2>
            <button onClick={() => { setShowManual(false); setError(''); }} className="text-text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          </div>

          {form.platform === 'instagram' && !editId && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2 text-sm">
              <div className="font-medium text-blue-300">Legacy manual setup</div>
              <ol className="text-text-muted space-y-1 list-decimal list-inside text-xs leading-relaxed">
                <li>Open developers.facebook.com and sign in.</li>
                <li>Use Graph API Explorer with an Instagram-capable token.</li>
                <li>Find the Instagram business account ID for the account you want to add.</li>
                <li>Paste the Instagram account ID and access token below.</li>
              </ol>
            </div>
          )}

          {error && <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Platform</label>
              <select className="input" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>

            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="@username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>

            <div>
              <label className="label">Account ID {form.platform === 'instagram' ? '(Instagram Business ID)' : '(Open ID)'}</label>
              <input className="input" placeholder="123456789" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} />
            </div>

            {form.platform === 'instagram' && (
              <div>
                <label className="label">Page ID (optional)</label>
                <input className="input" placeholder="Facebook Page ID" value={form.page_id} onChange={(e) => setForm({ ...form, page_id: e.target.value })} />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="label">Access Token</label>
              <input className="input font-mono text-sm" type="password" placeholder="Paste access token..." value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowManual(false); setError(''); }} className="btn-secondary text-sm">Cancel</button>
            <button onClick={save} disabled={loading} className="btn-primary text-sm flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
              {editId ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-text-muted text-sm">No accounts connected yet. Click a button above to get started.</div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-text-secondary text-sm font-medium">{accounts.length} Connected Account{accounts.length !== 1 ? 's' : ''}</h2>
          {accounts.map((account) => (
            <div key={account.id} className={`card flex items-center gap-4 ${!account.is_active ? 'opacity-60' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${account.platform === 'instagram' ? 'bg-pink-500/20 text-pink-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                {account.platform === 'instagram' ? 'IG' : 'TK'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-text-primary">@{account.username}</span>
                  <span className={account.is_active ? 'badge-green' : 'badge-red'}>{account.is_active ? 'Active' : 'Paused'}</span>
                  <span className="badge-blue capitalize">{account.platform}</span>
                </div>
                <div className="text-text-muted text-xs mt-0.5 font-mono">ID: {account.account_id}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggle(account)} className="text-text-muted hover:text-accent-green p-1.5">
                  {account.is_active ? <ToggleRight size={22} className="text-accent-green" /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => startEdit(account)} className="text-text-muted hover:text-accent-blue p-1.5 rounded-lg hover:bg-bg-tertiary">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => del(account.id)} className="text-text-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
