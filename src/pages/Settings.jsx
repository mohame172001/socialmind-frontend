import React, { useEffect, useState } from 'react';
import { Save, FlaskConical, Check, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    anthropic_api_key: '',
    ai_prompt_template: '',
    min_delay_seconds: '45',
    max_delay_seconds: '120',
    max_replies_per_hour: '30',
    user_cooldown_minutes: '60'
  });
  const [newApiKey, setNewApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(data => {
      setSettings(prev => ({ ...prev, ...data }));
    });
  }, []);

  const save = async () => {
    setSaving(true); setSaved(false);
    const payload = { ...settings };
    if (newApiKey.trim()) payload.anthropic_api_key = newApiKey.trim();
    try {
      await api.updateSettings(payload);
      setSaved(true); setNewApiKey('');
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const testAI = async () => {
    setTesting(true); setTestResult(null);
    try {
      const result = await api.testAI();
      setTestResult({ success: true, text: result.sample_reply });
    } catch (e) {
      setTestResult({ success: false, text: e.message });
    } finally { setTesting(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm mt-0.5">Configure AI and anti-spam settings</p>
      </div>

      {/* AI Config */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent-purple/20 flex items-center justify-center">
            <span className="text-accent-purple text-xs">AI</span>
          </div>
          Anthropic Claude AI
        </h2>

        <div>
          <label className="label">API Key</label>
          <div className="text-text-muted text-xs mb-1">Current: {settings.anthropic_api_key || 'Not set'}</div>
          <input
            className="input font-mono text-sm"
            type="password"
            placeholder="sk-ant-api03-... (enter to update)"
            value={newApiKey}
            onChange={e => setNewApiKey(e.target.value)}
          />
        </div>

        <div>
          <label className="label">AI Reply Prompt Template</label>
          <textarea
            className="input"
            rows={4}
            value={settings.ai_prompt_template}
            onChange={e => setSettings({ ...settings, ai_prompt_template: e.target.value })}
          />
          <div className="text-text-muted text-xs mt-1">Variables: <code className="bg-bg-tertiary px-1 rounded">{'{{comment}}'}</code> <code className="bg-bg-tertiary px-1 rounded">{'{{username}}'}</code> <code className="bg-bg-tertiary px-1 rounded">{'{{platform}}'}</code></div>
        </div>

        {testResult && (
          <div className={`px-3 py-2.5 rounded-lg text-sm border ${testResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {testResult.success ? <><strong>AI Reply:</strong> "{testResult.text}"</> : <><strong>Error:</strong> {testResult.text}</>}
          </div>
        )}

        <button onClick={testAI} disabled={testing} className="btn-secondary flex items-center gap-2 text-sm">
          {testing ? <div className="w-4 h-4 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" /> : <FlaskConical size={15} />}
          Test AI Connection
        </button>
      </div>

      {/* Anti-Spam */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent-orange/20 flex items-center justify-center">
            <span className="text-accent-orange text-xs">🛡</span>
          </div>
          Anti-Spam Controls
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Min Delay (seconds)</label>
            <input className="input" type="number" min="10" max="300" value={settings.min_delay_seconds} onChange={e => setSettings({ ...settings, min_delay_seconds: e.target.value })} />
          </div>
          <div>
            <label className="label">Max Delay (seconds)</label>
            <input className="input" type="number" min="10" max="600" value={settings.max_delay_seconds} onChange={e => setSettings({ ...settings, max_delay_seconds: e.target.value })} />
          </div>
          <div>
            <label className="label">Max Replies Per Hour</label>
            <input className="input" type="number" min="1" max="100" value={settings.max_replies_per_hour} onChange={e => setSettings({ ...settings, max_replies_per_hour: e.target.value })} />
          </div>
          <div>
            <label className="label">User Cooldown (minutes)</label>
            <input className="input" type="number" min="5" max="1440" value={settings.user_cooldown_minutes} onChange={e => setSettings({ ...settings, user_cooldown_minutes: e.target.value })} />
          </div>
        </div>

        <div className="bg-bg-tertiary rounded-lg p-3 text-text-muted text-xs space-y-1">
          <div>• Replies sent with random {settings.min_delay_seconds}–{settings.max_delay_seconds}s delay</div>
          <div>• Max {settings.max_replies_per_hour} replies per account per hour</div>
          <div>• {settings.user_cooldown_minutes} min cooldown before replying to same user again</div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
