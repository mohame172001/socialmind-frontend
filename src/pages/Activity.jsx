import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Filter, Clock } from 'lucide-react';
import { api } from '../lib/api';

const STATUS_COLORS = {
  sent: 'badge-green', failed: 'badge-red', pending: 'badge-yellow', skipped: 'badge-blue'
};

export default function Activity() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const LIMIT = 25;

  const load = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: off };
      if (status) params.status = status;
      const data = await api.getActivity(params);
      setItems(data.items);
      setTotal(data.total);
      setOffset(off);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(0); }, [load]);

  const formatTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleString();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Activity Log</h1>
          <p className="text-text-muted text-sm mt-0.5">{total.toLocaleString()} total events</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            <select className="input py-1.5 text-sm w-auto" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
          <button onClick={() => load(0)} className="btn-secondary flex items-center gap-2 text-sm py-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-text-muted font-medium px-4 py-3">Time</th>
                <th className="text-left text-text-muted font-medium px-4 py-3">Platform</th>
                <th className="text-left text-text-muted font-medium px-4 py-3">User</th>
                <th className="text-left text-text-muted font-medium px-4 py-3">Comment</th>
                <th className="text-left text-text-muted font-medium px-4 py-3">Action</th>
                <th className="text-left text-text-muted font-medium px-4 py-3">Response</th>
                <th className="text-left text-text-muted font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-8 text-text-muted">
                  <div className="w-5 h-5 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-text-muted">
                  <Clock size={28} className="mx-auto mb-2 opacity-30" />
                  No activity found
                </td></tr>
              )}
              {!loading && items.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-bg-tertiary/50 transition-colors">
                  <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{formatTime(item.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${item.platform === 'instagram' ? 'text-pink-400' : 'text-cyan-400'}`}>
                      {item.platform === 'instagram' ? 'Instagram' : 'TikTok'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-primary">@{item.commenter_username || '—'}</td>
                  <td className="px-4 py-3 text-text-muted max-w-xs">
                    <span className="truncate block" title={item.comment_text}>{item.comment_text || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-blue capitalize text-xs">{item.action_taken?.replace(/_/g, ' ') || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted max-w-xs">
                    <span className="truncate block text-xs" title={item.response_text}>{item.response_text || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_COLORS[item.status] || 'badge-blue'}>{item.status}</span>
                    {item.error_message && (
                      <div className="text-red-400 text-xs mt-0.5 truncate max-w-[120px]" title={item.error_message}>{item.error_message}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-text-muted text-sm">
              {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button disabled={offset === 0} onClick={() => load(offset - LIMIT)} className="btn-secondary text-sm py-1.5 disabled:opacity-40">← Prev</button>
              <button disabled={offset + LIMIT >= total} onClick={() => load(offset + LIMIT)} className="btn-secondary text-sm py-1.5 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
