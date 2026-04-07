import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Instagram, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../lib/api';

const EMPTY_FORM = { platform: 'instagram', account_id: '', username: '', access_token: '', page_id: '', token_expiry: '' };

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api.getAccounts().then(setAccounts).catch(console.error);
  useEffect(() => { load(); }, []);

  const save = async () => {
    setError('');
    setLoading(true);
    try {
      if (editId) {
        await api.updateAccount(editId, form);
      } else {
        await api.createAccount(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      setError(e.message);
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

  const startEdit = (acc) => {
    setForm({ platform: acc.platform, account_id: acc.account_id, username: acc.username, access_token: '', page_id: acc.page_id || '', token_expiry: acc.token_expiry || '' });
    setEditId(acc.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Accounts</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage Instagram & TikTok accounts</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Account
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border-accent-blue/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">{editId ? 'Edit Account' : 'Add New Account'}</h2>
            <button onClick={() => { setShowForm(false); setError(''); }} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
          </div>

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
              <label className="label">Username</label>
              <input className="input" placeholder="@username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="label">Account ID / User ID</label>
              <input className="input" placeholder="123456789" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} />
            </div>
            {form.platform === 'instagram' && (
              <div>
                <label className="label">Page ID (for DMs)</label>
                <input className="input" placeholder="Facebook Page ID" value={form.page_id} onChange={e => setForm({ ...form, page_id: e.target.value })} />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label">Access Token</label>
              <input className="input font-mono text-sm" placeholder="EAAxxxxxxx..." value={form.access_token} onChange={e => setForm({ ...form, access_token: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowForm(false); setError(''); }} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
              {editId ? 'Update' : 'Add Account'}
            </button>
          </div>
        </div>
      )}

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
            <Instagram size={28} className="text-text-muted" />
          </div>
          <p className="text-text-primary font-medium">No accounts connected</p>
          <p className="text-text-muted text-sm mt-1">Add your first Instagram or TikTok account to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className={`card flex items-center gap-4 ${!acc.is_active ? 'opacity-60' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${acc.platform === 'instagram' ? 'bg-pink-500/20 text-pink-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                {acc.platform === 'instagram' ? 'IG' : 'TK'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">@{acc.username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${acc.is_active ? 'badge-green' : 'badge-red'}`}>
                    {acc.is_active ? 'Active' : 'Paused'}
                  </span>
                  <span className="badge-blue capitalize">{acc.platform}</span>
                </div>
                <div className="text-text-muted text-xs mt-0.5 font-mono">ID: {acc.account_id}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggle(acc)} className="text-text-muted hover:text-accent-blue transition-colors" title="Toggle">
                  {acc.is_active ? <ToggleRight size={22} className="text-accent-green" /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => startEdit(acc)} className="text-text-muted hover:text-accent-blue transition-colors p-1.5 rounded-lg hover:bg-bg-tertiary">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => del(acc.id)} className="text-text-muted hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
