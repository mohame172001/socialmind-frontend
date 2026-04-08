import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Zap, X, Check, ToggleLeft, ToggleRight, Image, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

const EMPTY = {
  account_id: '', name: '', trigger_type: 'any', keywords: '',
  action_type: 'reply_comment', comment_template: '', dm_template: '',
  target_media_id: ''
};

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const loadMedia = async (accountId) => {
    if (!accountId) { setMedia([]); return; }
    const acc = accounts.find(a => a.id === accountId);
    if (!acc || acc.platform !== 'instagram') { setMedia([]); return; }
    setMediaLoading(true);
    try {
      const posts = await api.getAccountMedia(accountId);
      setMedia(posts);
    } catch { setMedia([]); }
    finally { setMediaLoading(false); }
  };

  const load = async () => {
    const [r, a] = await Promise.all([api.getRules(), api.getAccounts()]);
    setRules(r); setAccounts(a);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        target_media_id: form.target_media_id || null
      };
      if (editId) await api.updateRule(editId, payload);
      else await api.createRule(payload);
      setShowForm(false); setEditId(null); setForm(EMPTY); load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this rule?')) return;
    await api.deleteRule(id); load();
  };

  const toggle = async (rule) => {
    await api.updateRule(rule.id, { is_active: rule.is_active ? 0 : 1 }); load();
  };

  const startEdit = (r) => {
    setForm({ account_id: r.account_id, name: r.name, trigger_type: r.trigger_type, keywords: Array.isArray(r.keywords) ? r.keywords.join(', ') : '', action_type: r.action_type, comment_template: r.comment_template || '', dm_template: r.dm_template || '', target_media_id: r.target_media_id || '' });
    setEditId(r.id); setShowForm(true);
    loadMedia(r.account_id);
  };

  const accountName = (id) => {
    const a = accounts.find(a => a.id === id);
    return a ? `${a.platform === 'instagram' ? 'IG' : 'TK'} @${a.username}` : id;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Rules</h1>
          <p className="text-text-muted text-sm mt-0.5">Configure automation rules per account</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Rule
        </button>
      </div>

      {showForm && (
        <div className="card border-accent-purple/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">{editId ? 'Edit Rule' : 'Create Rule'}</h2>
            <button onClick={() => { setShowForm(false); setError(''); }} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
          </div>
          {error && <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Account</label>
              <select className="input" value={form.account_id} onChange={e => { setForm({ ...form, account_id: e.target.value, target_media_id: '' }); loadMedia(e.target.value); }}>
                <option value="">Select account...</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.platform === 'instagram' ? 'Instagram' : 'TikTok'} @{a.username}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Rule Name</label>
              <input className="input" placeholder="e.g. Reply to all comments" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Trigger</label>
              <select className="input" value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}>
                <option value="any">Any comment</option>
                <option value="keyword">Keyword match</option>
              </select>
            </div>
            <div>
              <label className="label">Action</label>
              <select className="input" value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })}>
                <option value="reply_comment">Reply to comment</option>
                <option value="reply_dm">Send DM</option>
                <option value="both">Reply + Send DM</option>
              </select>
            </div>
            {/* Post Picker */}
            {form.account_id && accounts.find(a => a.id === form.account_id)?.platform === 'instagram' && (
              <div className="sm:col-span-2">
                <label className="label flex items-center gap-2">
                  <Image size={14} />
                  Target Post <span className="text-text-muted font-normal">(optional - leave empty for all posts)</span>
                </label>
                {mediaLoading ? (
                  <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                    <Loader2 size={16} className="animate-spin" /> Loading posts...
                  </div>
                ) : media.length === 0 ? (
                  <div className="text-text-muted text-sm py-2">No posts found or unable to fetch posts.</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
                    {/* All Posts option */}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, target_media_id: '' })}
                      className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs transition-all ${!form.target_media_id ? 'border-accent-purple bg-accent-purple/20 text-accent-purple' : 'border-border bg-bg-tertiary text-text-muted hover:border-text-muted'}`}
                    >
                      <Zap size={18} className="mb-1" />
                      All Posts
                    </button>
                    {media.map(post => (
                      <button
                        type="button"
                        key={post.id}
                        onClick={() => setForm({ ...form, target_media_id: post.id })}
                        className={`aspect-square rounded-lg border-2 overflow-hidden relative group transition-all ${form.target_media_id === post.id ? 'border-accent-purple ring-2 ring-accent-purple/40' : 'border-border hover:border-text-muted'}`}
                      >
                        <img
                          src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {form.target_media_id === post.id && (
                          <div className="absolute inset-0 bg-accent-purple/30 flex items-center justify-center">
                            <Check size={24} className="text-white drop-shadow-lg" />
                          </div>
                        )}
                        {post.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {post.caption.substring(0, 40)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.trigger_type === 'keyword' && (
              <div className="sm:col-span-2">
                <label className="label">Keywords (comma-separated)</label>
                <input className="input" placeholder="price, buy, how much, info" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} />
              </div>
            )}
            {['reply_comment', 'both'].includes(form.action_type) && (
              <div className="sm:col-span-2">
                <label className="label">Comment Reply Template <span className="text-text-muted font-normal">(leave blank for AI)</span></label>
                <textarea className="input" rows={2} placeholder="Thanks {{username}}! DM us for more info. Use {{comment}} to reference their comment." value={form.comment_template} onChange={e => setForm({ ...form, comment_template: e.target.value })} />
              </div>
            )}
            {['reply_dm', 'both'].includes(form.action_type) && (
              <div className="sm:col-span-2">
                <label className="label">DM Template <span className="text-text-muted font-normal">(leave blank for AI)</span></label>
                <textarea className="input" rows={2} placeholder="Hey {{username}}, thanks for your comment! Here's more info..." value={form.dm_template} onChange={e => setForm({ ...form, dm_template: e.target.value })} />
              </div>
            )}
          </div>

          <div className="text-xs text-text-muted">Variables: <code className="bg-bg-tertiary px-1 rounded">{'{{username}}'}</code> <code className="bg-bg-tertiary px-1 rounded">{'{{comment}}'}</code></div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowForm(false); setError(''); }} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
              {editId ? 'Update' : 'Create Rule'}
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
            <Zap size={28} className="text-text-muted" />
          </div>
          <p className="text-text-primary font-medium">No rules yet</p>
          <p className="text-text-muted text-sm mt-1">Create rules to automate comment replies and DMs</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className={`card ${!rule.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                  <Zap size={17} className="text-accent-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-text-primary">{rule.name}</span>
                    <span className={`text-xs ${rule.is_active ? 'badge-green' : 'badge-red'}`}>{rule.is_active ? 'Active' : 'Paused'}</span>
                    <span className="badge-blue">{rule.trigger_type === 'any' ? 'Any comment' : 'Keyword'}</span>
                    <span className="badge-blue capitalize">{rule.action_type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-text-muted text-xs mt-1">
                    {accountName(rule.account_id)}
                    {rule.target_media_id && <span className="ml-2 text-accent-purple">• Specific post</span>}
                    {!rule.target_media_id && <span className="ml-2">• All posts</span>}
                  </div>
                  {rule.trigger_type === 'keyword' && rule.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {rule.keywords.map(k => <span key={k} className="bg-bg-tertiary text-text-secondary text-xs px-2 py-0.5 rounded">{k}</span>)}
                    </div>
                  )}
                  {(rule.comment_template || rule.dm_template) && (
                    <div className="text-text-muted text-xs mt-1.5 italic truncate">
                      Template: "{rule.comment_template || rule.dm_template}"
                    </div>
                  )}
                  {!rule.comment_template && !rule.dm_template && (
                    <div className="text-accent-purple text-xs mt-1.5">✦ AI-generated replies</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggle(rule)} className="text-text-muted hover:text-accent-green transition-colors p-1.5">
                    {rule.is_active ? <ToggleRight size={20} className="text-accent-green" /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => startEdit(rule)} className="text-text-muted hover:text-accent-blue p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => del(rule.id)} className="text-text-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
