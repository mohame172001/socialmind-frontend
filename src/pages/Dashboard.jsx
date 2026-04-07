import React, { useEffect, useState } from 'react';
import { Users, Zap, CheckCircle, Clock, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-text-muted text-sm">{label}</div>
        <div className="text-2xl font-bold text-text-primary mt-0.5">{value ?? '—'}</div>
        {sub && <div className="text-text-muted text-xs mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, a] = await Promise.all([
        api.getDashboardStats(),
        api.getActivity({ limit: 8 })
      ]);
      setStats(s);
      setActivity(a.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const statusBadge = (status) => {
    const map = { sent: 'badge-green', failed: 'badge-red', pending: 'badge-yellow', skipped: 'badge-blue' };
    return <span className={map[status] || 'badge-blue'}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted text-sm mt-0.5">Real-time overview of your automation</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-bg-tertiary" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Active Accounts" value={stats?.active_accounts} color="bg-accent-blue" />
          <StatCard icon={Zap} label="Active Rules" value={stats?.active_rules} color="bg-accent-purple" />
          <StatCard icon={CheckCircle} label="Sent Today" value={stats?.sent_today} color="bg-accent-green" />
          <StatCard icon={Clock} label="In Queue" value={stats?.pending_now} color="bg-accent-orange" sub="auto-delayed 45-120s" />
          <StatCard icon={AlertTriangle} label="Failed Today" value={stats?.failed_today} color="bg-accent-red" />
          <StatCard icon={TrendingUp} label="Total Sent" value={stats?.total_sent} color="bg-accent-pink" />
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">Recent Activity</h2>
          <a href="/activity" className="text-accent-blue text-sm hover:underline">View all →</a>
        </div>

        {activity.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            <p>No activity yet. Connect an account and set up rules to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activity.map(item => (
              <div key={item.id} className="py-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.platform === 'instagram' ? 'bg-pink-500/20' : 'bg-cyan-500/20'}`}>
                  <span className="text-xs font-bold">{item.platform === 'instagram' ? 'IG' : 'TK'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-primary text-sm font-medium truncate">@{item.commenter_username || 'unknown'}</span>
                    {statusBadge(item.status)}
                    <span className="text-text-muted text-xs">{item.action_taken}</span>
                  </div>
                  {item.comment_text && (
                    <p className="text-text-muted text-xs mt-0.5 truncate">"{item.comment_text}"</p>
                  )}
                </div>
                <div className="text-text-muted text-xs flex-shrink-0">
                  {new Date(item.created_at * 1000).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anti-spam info */}
      <div className="card border-accent-blue/30 bg-accent-blue/5">
        <div className="flex items-start gap-3">
          <Zap size={20} className="text-accent-blue mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-text-primary font-medium text-sm">Anti-Spam Protection Active</div>
            <div className="text-text-muted text-xs mt-1">
              Replies are randomly delayed 45–120 seconds • Max 30 replies/hour per account • 1 hour cooldown per user
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
