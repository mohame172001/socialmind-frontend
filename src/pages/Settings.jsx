import React, { useEffect, useState } from 'react';
import { Save, FlaskConical, Check, ExternalLink, CheckCircle, XCircle, Shield } from 'lucide-react';
import { api } from '../lib/api';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

// Keys that are masked by the backend — never send their masked value back
const MASKED_KEYS = ['anthropic_api_key', 'meta_app_secret', 'tiktok_client_secret'];

function StatusBadge({ ok, label }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-400' : 'text-red-400'}`}>
      {ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
      {label}
    </div>
  );
}

export default function Settings() {
  // Non-secret settings (safe to display and send back)
  const [settings, setSettings] = useState({
    ai_prompt_template: '',
    min_delay_seconds: '45',
    max_delay_seconds: '120',
    max_replies_per_hour: '30',
    user_cooldown_minutes: '60',
    meta_app_id: '',
    meta_login_config_id: '',
    tiktok_client_key: '',
  });

  // Secret fields — only sent if user types a NEW value
  const [secrets, setSecrets] = useState({
    anthropic_api_key: '',
    meta_app_secret: '',
    tiktok_client_secret: ''
  });

  // Masked display values from backend (e.g. "d0fc...823e")
  const [maskedSecrets, setMaskedSecrets] = useState({
    anthropic_api_key: '',
    meta_app_secret: '',
    tiktok_client_secret: ''
  });

  // Config status from /api/settings/status
  const [configStatus, setConfigStatus] = useState(null);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const loadSettings = () => {
    api.getSettings().then(data => {
      // Separate masked secrets from regular settings
      const regular = {};
      const masked = {};
      for (const [key, value] of Object.entries(data)) {
        if (MASKED_KEYS.includes(key)) {
          masked[key] = value || '';
        } else {
          regular[key] = value || '';
        }
      }
      setSettings(prev => ({ ...prev, ...regular }));
      setMaskedSecrets(prev => ({ ...prev, ...masked }));
    });
  };

  const loadStatus = () => {
    api.getConfigStatus().then(setConfigStatus).catch(console.error);
  };

  useEffect(() => {
    loadSettings();
    loadStatus();
  }, []);

  const save = async () => {
    setSaving(true); setSaved(false);

    // Build payload: only non-secret settings + non-empty new secrets
    const payload = { ...settings };

    // Only include secrets if user typed a new value
    for (const key of MASKED_KEYS) {
      const newVal = secrets[key]?.trim();
      if (newVal) {
        payload[key] = newVal;
      }
      // If empty → don't include in payload → backend won't overwrite
    }

    try {
      const result = await api.updateSettings(payload);
      setSaved(true);
      // Clear secret inputs after save
      setSecrets({ anthropic_api_key: '', meta_app_secret: '', tiktok_client_secret: '' });
      // Reload to get fresh masked values and status
      setTimeout(() => {
        loadSettings();
        loadStatus();
        setSaved(false);
      }, 1500);
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

  const set = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));

  const oauthReady = configStatus?.oauth_ready;
  // Canonical redirect URI from backend (single source of truth) — never construct locally
  const redirectUri = configStatus?.canonical_redirect_uri || `${BACKEND_URL}/api/oauth/instagram/callback`;
  const appDomain = configStatus?.canonical_app_domain || '';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm mt-0.5">Configure API credentials and automation settings</p>
      </div>

      {/* ── OAuth Status Banner ── */}
      {configStatus && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${oauthReady
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <Shield size={18} className={oauthReady ? 'text-green-400' : 'text-yellow-400'} />
          <div className="flex-1">
            <div className={`font-medium text-sm ${oauthReady ? 'text-green-400' : 'text-yellow-400'}`}>
              {oauthReady ? 'OAuth Ready' : 'OAuth Not Configured'}
            </div>
            <div className="flex gap-4 mt-1">
              <StatusBadge ok={configStatus.meta_app_id?.set} label={`App ID (${configStatus.meta_app_id?.source || 'none'})`} />
              <StatusBadge ok={configStatus.meta_app_secret?.set} label={`App Secret (${configStatus.meta_app_secret?.source || 'none'})`} />
              <StatusBadge ok={configStatus.anthropic_api_key?.set} label={`AI Key (${configStatus.anthropic_api_key?.source || 'none'})`} />
            </div>
          </div>
        </div>
      )}

      {/* ── Meta / Instagram App ── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">IG</span>
            </div>
            Meta / Instagram App
          </h2>
          <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer"
            className="text-text-muted hover:text-accent-blue text-xs flex items-center gap-1">
            Open Meta Dev <ExternalLink size={11} />
          </a>
        </div>

        <div className="bg-bg-tertiary rounded-lg p-3 text-xs text-text-muted space-y-1">
          <div className="font-medium text-text-secondary">Setup:</div>
          <div>1. Create a Meta App at developers.facebook.com</div>
          <div>2. Add <strong className="text-text-secondary">Facebook Login</strong> product (or Facebook Login for Business)</div>
          <div>3. <strong className="text-yellow-400">App Settings → Basic → App Domains</strong>, add:</div>
          <code className="block bg-bg-primary px-2 py-1 rounded text-accent-blue select-all break-all">{appDomain || '(loading...)'}</code>
          <div>4. <strong className="text-yellow-400">Facebook Login → Settings → Valid OAuth Redirect URIs</strong>, add:</div>
          <code className="block bg-bg-primary px-2 py-1 rounded text-accent-blue select-all break-all">{redirectUri}</code>
          <div>5. If using <strong className="text-text-secondary">Facebook Login for Business</strong>: create a Login Configuration with the redirect URI and scopes, then paste Config ID below</div>
          <div>6. Paste your App ID and App Secret below</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">App ID (Public)</label>
            <input className="input font-mono text-sm" placeholder="1234567890"
              value={settings.meta_app_id} onChange={e => set('meta_app_id', e.target.value)} />
          </div>
          <div>
            <label className="label">App Secret</label>
            <div className="text-xs mb-1">
              {maskedSecrets.meta_app_secret
                ? <span className="text-green-400">Saved: {maskedSecrets.meta_app_secret}</span>
                : <span className="text-red-400">Not set</span>}
            </div>
            <input className="input font-mono text-sm" type="password"
              placeholder={maskedSecrets.meta_app_secret ? 'Leave empty to keep current' : 'Enter App Secret...'}
              value={secrets.meta_app_secret}
              onChange={e => setSecrets(prev => ({ ...prev, meta_app_secret: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Login Config ID <span className="text-text-muted font-normal">(Facebook Login for Business only — leave empty for standard Facebook Login)</span></label>
            <input className="input font-mono text-sm" placeholder="Optional — e.g. 123456789012345"
              value={settings.meta_login_config_id} onChange={e => set('meta_login_config_id', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── TikTok App ── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">TK</span>
            </div>
            TikTok App
          </h2>
          <a href="https://developers.tiktok.com" target="_blank" rel="noreferrer"
            className="text-text-muted hover:text-accent-blue text-xs flex items-center gap-1">
            Open TikTok Dev <ExternalLink size={11} />
          </a>
        </div>

        <div className="bg-bg-tertiary rounded-lg p-3 text-xs text-text-muted space-y-1">
          <div className="font-medium text-text-secondary">Setup:</div>
          <div>1. Create an app at developers.tiktok.com</div>
          <div>2. Add redirect URI: your backend URL + <code className="bg-bg-primary px-1 rounded">/api/oauth/tiktok/callback</code></div>
          <div>3. Paste your Client Key and Client Secret below</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Client Key (Public)</label>
            <input className="input font-mono text-sm" placeholder="aw1234..."
              value={settings.tiktok_client_key} onChange={e => set('tiktok_client_key', e.target.value)} />
          </div>
          <div>
            <label className="label">Client Secret</label>
            <div className="text-xs mb-1">
              {maskedSecrets.tiktok_client_secret
                ? <span className="text-green-400">Saved: {maskedSecrets.tiktok_client_secret}</span>
                : <span className="text-red-400">Not set</span>}
            </div>
            <input className="input font-mono text-sm" type="password"
              placeholder={maskedSecrets.tiktok_client_secret ? 'Leave empty to keep current' : 'Enter Client Secret...'}
              value={secrets.tiktok_client_secret}
              onChange={e => setSecrets(prev => ({ ...prev, tiktok_client_secret: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* ── AI Config ── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-purple/20 flex items-center justify-center">
            <span className="text-accent-purple text-xs font-bold">AI</span>
          </div>
          Anthropic Claude AI
        </h2>

        <div>
          <label className="label">API Key</label>
          <div className="text-xs mb-1">
            {maskedSecrets.anthropic_api_key
              ? <span className="text-green-400">Saved: {maskedSecrets.anthropic_api_key}</span>
              : <span className="text-red-400">Not set</span>}
          </div>
          <input className="input font-mono text-sm" type="password"
            placeholder={maskedSecrets.anthropic_api_key ? 'Leave empty to keep current' : 'sk-ant-...'}
            value={secrets.anthropic_api_key}
            onChange={e => setSecrets(prev => ({ ...prev, anthropic_api_key: e.target.value }))} />
        </div>

        <div>
          <label className="label">AI Reply Prompt Template</label>
          <textarea className="input" rows={3} value={settings.ai_prompt_template} onChange={e => set('ai_prompt_template', e.target.value)} />
          <div className="text-text-muted text-xs mt-1">Variables: <code className="bg-bg-tertiary px-1 rounded">{'{{comment}}'}</code> <code className="bg-bg-tertiary px-1 rounded">{'{{username}}'}</code></div>
        </div>

        {testResult && (
          <div className={`px-3 py-2.5 rounded-lg text-sm border ${testResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {testResult.success ? <><strong>Sample reply:</strong> "{testResult.text}"</> : <><strong>Error:</strong> {testResult.text}</>}
          </div>
        )}

        <button onClick={testAI} disabled={testing} className="btn-secondary flex items-center gap-2 text-sm">
          {testing ? <div className="w-4 h-4 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" /> : <FlaskConical size={14} />}
          Test AI
        </button>
      </div>

      {/* ── Anti-Spam ── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-text-primary">Anti-Spam Controls</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Min Delay (seconds)</label>
            <input className="input" type="number" min="10" value={settings.min_delay_seconds} onChange={e => set('min_delay_seconds', e.target.value)} />
          </div>
          <div>
            <label className="label">Max Delay (seconds)</label>
            <input className="input" type="number" min="10" value={settings.max_delay_seconds} onChange={e => set('max_delay_seconds', e.target.value)} />
          </div>
          <div>
            <label className="label">Max Replies / Hour</label>
            <input className="input" type="number" min="1" value={settings.max_replies_per_hour} onChange={e => set('max_replies_per_hour', e.target.value)} />
          </div>
          <div>
            <label className="label">User Cooldown (minutes)</label>
            <input className="input" type="number" min="5" value={settings.user_cooldown_minutes} onChange={e => set('user_cooldown_minutes', e.target.value)} />
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
        {saved ? 'Saved!' : 'Save All Settings'}
      </button>
    </div>
  );
}
