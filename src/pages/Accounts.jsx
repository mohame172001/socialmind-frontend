import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight, Link, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

function OAuthBanner() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('oauth_success');
  const error = params.get('oauth_error');

  useEffect(() => {
    if (success || error) {
      // Clean URL
      window.history.replaceState({}, '', '/accounts');
    }
  }, []);

  if (success) return (
    <div className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl">
      <CheckCircle size={18} />
      <span>Successfully connected {success} Instagram account{success > 1 ? 's' : ''}!</span>
    </div>
  );

  if (error) return (
    <div className="flex items-start gap-3 bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
      <div>
        <div className="font-medium">Connection failed</div>
        <div className="text-sm mt-0.5">{decodeURIComponent(error)}</div>
      </div>
    </div>
  );

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
      // OAuth not configured — show manual form with clear message
      setForm({ ...EMPTY_FORM, platform: 'instagram' });
      setEditId(null);
      setShowManual(true);
      return;
    }
    // OAuth is ready — redirect to Meta login
    window.location.href = `${BACKEND_URL}/api/oauth/instagram/connect`;
  };

  const connectTikTok = () => {
    if (!settings.tiktok_client_key || settings.tiktok_client_key === '') {
      alert('Please configure your TikTok Client Key in Settings first.');
      window.location.href = '/settings';
      return;
    }
    window.location.href = `${BACKEND_URL}/api/oauth/tiktok/connect`;
  };

  const save = async () => {
    setError(''); setLoading(true);
    try {
      if (editId) await api.updateAccount(editId, form);
      else await api.createAccount(form);
      setShowManual(false); setEditId(null); setForm(EMPTY_FORM); load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this account and all its rules?')) return;
    await api.deleteAccount(id); load();
  };

  const toggle = async (account) => {
    await api.updateAccount(account.id, { is_active: account.is_active ? 0 : 1 }); load();
  };

  const startEdit = (acc) => {
    setForm({ platform: acc.platform, account_id: acc.account_id, username: acc.username, access_token: '', page_id: acc.page_id || '' });
    setEditId(acc.id); setShowManual(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Accounts</h1>
          <p className="text-text-muted text-sm mt-0.5">Connect your Instagram & TikTok accounts</p>
        </div>
      </div>

      <OAuthBanner />

      {/* One-click connect buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Instagram */}
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
                {oauthReady ? '✅ One-click via Meta OAuth' : '⚙️ Manual setup (set Meta App ID in Settings for OAuth)'}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-text-muted">
            {oauthReady
              ? 'Requires: Instagram Business/Creator account linked to a Facebook Page'
              : <>⚠️ META_APP_ID not configured. <a href="/settings" className="text-accent-blue underline">Go to Settings</a> or set ENV var.</>
            }
          </div>
        </button>

        {/* TikTok */}
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

      {/* Manual add toggle */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <button
          onClick={() => { setShowManual(!showManual); setEditId(null); setForm(EMPTY_FORM); }}
          className="text-text-muted text-xs hover:text-text-secondary flex items-center gap-1.5"
        >
          <Plus size={13} /> ربط يدوي بدون Meta App
        </button>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Manual form */}
      {showManual && (
        <div className="card border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary text-sm">{editId ? 'تعديل حساب' : 'ربط حساب يدوياً'}</h2>
            <button onClick={() => { setShowManual(false); setError(''); }} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
          </div>

          {/* Instagram Guide */}
          {form.platform === 'instagram' && !editId && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2 text-sm">
              <div className="font-medium text-blue-300">كيف تجيب بيانات Instagram؟</div>
              <ol className="text-text-muted space-y-1 list-decimal list-inside text-xs leading-relaxed">
                <li>افتح <strong className="text-text-secondary">developers.facebook.com</strong> وسجّل دخول</li>
                <li>اختار تطبيقك → <strong className="text-text-secondary">Tools → Graph API Explorer</strong></li>
                <li>من "User or Page" اختار <strong className="text-text-secondary">Page Access Token</strong></li>
                <li>اختار الـ Page المربوطة بالإنستجرام</li>
                <li>في الـ Query اكتب: <code className="bg-bg-tertiary px-1 rounded">/me?fields=instagram_business_account</code></li>
                <li>انسخ الـ <strong className="text-text-secondary">instagram_business_account id</strong> → Account ID</li>
                <li>انسخ الـ <strong className="text-text-secondary">Access Token</strong> من الأعلى</li>
              </ol>
            </div>
          )}

          {error && <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Platform</label>
              <select className="input" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
            <div>
              <label className="label">اسم المستخدم</label>
              <input className="input" placeholder="@username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="label">Account ID {form.platform === 'instagram' ? '(Instagram Business ID)' : '(Open ID)'}</label>
              <input className="input" placeholder="123456789" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} />
            </div>
            {form.platform === 'instagram' && (
              <div>
                <label className="label">Page ID (اختياري)</label>
                <input className="input" placeholder="Facebook Page ID" value={form.page_id} onChange={e => setForm({ ...form, page_id: e.target.value })} />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label">Access Token</label>
              <input className="input font-mono text-sm" type="password" placeholder="EAAxxxxxxx..." value={form.access_token} onChange={e => setForm({ ...form, access_token: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowManual(false); setError(''); }} className="btn-secondary text-sm">إلغاء</button>
            <button onClick={save} disabled={loading} className="btn-primary text-sm flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
              {editId ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </div>
      )}

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-text-muted text-sm">No accounts connected yet. Click a button above to get started.</div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-text-secondary text-sm font-medium">{accounts.length} Connected Account{accounts.length !== 1 ? 's' : ''}</h2>
          {accounts.map(acc => (
            <div key={acc.id} className={`card flex items-center gap-4 ${!acc.is_active ? 'opacity-60' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${acc.platform === 'instagram' ? 'bg-pink-500/20 text-pink-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                {acc.platform === 'instagram' ? 'IG' : 'TK'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-text-primary">@{acc.username}</span>
                  <span className={acc.is_active ? 'badge-green' : 'badge-red'}>{acc.is_active ? 'Active' : 'Paused'}</span>
                  <span className="badge-blue capitalize">{acc.platform}</span>
                </div>
                <div className="text-text-muted text-xs mt-0.5 font-mono">ID: {acc.account_id}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggle(acc)} className="text-text-muted hover:text-accent-green p-1.5">
                  {acc.is_active ? <ToggleRight size={22} className="text-accent-green" /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => startEdit(acc)} className="text-text-muted hover:text-accent-blue p-1.5 rounded-lg hover:bg-bg-tertiary">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => del(acc.id)} className="text-text-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
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
