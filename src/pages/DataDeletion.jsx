import React, { useState } from 'react';
import { Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function DataDeletion() {
  const [step, setStep] = useState('info'); // info | form | done
  const [form, setForm] = useState({ name: '', email: '', ig_username: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [refId, setRefId] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Generate a reference ID (in real app this would hit backend)
    await new Promise(r => setTimeout(r, 1200));
    const id = 'DEL-' + Date.now().toString(36).toUpperCase();
    setRefId(id);
    setStep('done');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <span className="text-white font-bold text-xl">SocialMind</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Data Deletion Request</h1>
          <p className="text-gray-500 text-sm">Request removal of your personal data from SocialMind</p>
        </div>

        {step === 'info' && (
          <div className="space-y-5">
            <div className="bg-white/5 rounded-xl p-5 space-y-3 text-sm">
              <div className="text-white font-medium flex items-center gap-2">
                <Trash2 size={16} className="text-red-400" />
                What will be deleted
              </div>
              <ul className="space-y-2 text-gray-400 list-disc list-inside">
                <li>Your connected Instagram and TikTok account tokens</li>
                <li>All automation rules and reply templates</li>
                <li>All activity logs and history</li>
                <li>Your app settings and configuration</li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-200">
                  This action is <strong>irreversible</strong>. You will need to reconnect your
                  accounts and recreate your rules if you wish to use SocialMind again.
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-400 bg-white/5 rounded-xl p-4">
              <div className="text-white font-medium mb-2">Alternative: Disconnect via Instagram</div>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Go to Instagram Settings → Apps and Websites</li>
                <li>Find SocialMind and click Remove</li>
                <li>This revokes all permissions immediately</li>
              </ol>
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 font-medium transition-colors"
            >
              Continue with Data Deletion Request
            </button>

            <a
              href="/privacy"
              className="block text-center text-sm text-gray-500 hover:text-gray-400 underline"
            >
              View Privacy Policy
            </a>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
              <input
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
              <input
                required
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Instagram Username (optional)</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="@username"
                value={form.ig_username}
                onChange={e => setForm({ ...form, ig_username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Reason (optional)</label>
              <textarea
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Tell us why you want your data deleted..."
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('info')}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Trash2 size={14} /> Submit Request</>
                }
              </button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl mb-2">Request Submitted</h2>
              <p className="text-gray-400 text-sm">
                Your data deletion request has been received. We will process it within <strong className="text-white">30 days</strong> and
                send a confirmation to your email.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-sm">
              <div className="text-gray-500 mb-1">Reference ID</div>
              <div className="text-white font-mono font-bold text-lg">{refId}</div>
              <div className="text-gray-500 text-xs mt-1">Save this for your records</div>
            </div>
            <a
              href="/privacy"
              className="block text-sm text-gray-500 hover:text-gray-400 underline"
            >
              View Privacy Policy
            </a>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-white/10 text-center text-gray-600 text-xs">
          © 2026 SocialMind · <a href="/privacy" className="hover:text-gray-500">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
