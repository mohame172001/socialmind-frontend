import React, { useEffect, useState } from 'react';
import { Save, FlaskConical, Check, ExternalLink, CheckCircle, XCircle, Shield } from 'lucide-react';
import { api } from '../lib/api';

const MASKED_KEYS = ['anthropic_api_key', 'tiktok_client_secret'];

function StatusBadge({ ok, label }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-400' : 'text-red-400'}`}>
      {ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
      {label}
    </div>
  );
}

function ReadOnlyRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div className="text-xs font-medium text-text-secondary">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono break-all text-accent-blue' : 'text-text-primary'}`}>
        {value || 'Not set'}
      </div>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({
    ai_prompt_template: '',
    min_delay_seconds: '45',
    max_delay_seconds: '120',
    max_replies_per_hour: '30',
    user_cooldown_minutes: '60',
    tiktok_client_key: '',
  });

  const [secrets, setSecrets] = useState({
    anthropic_api_key: '',
    tiktok_client_secret: ''
  });

  const [maskedSecrets, setMaskedSecrets] = useState({
    anthropic_api_key: '',
    tiktok_client_secret: ''
  });

  const [configStatus, setConfigStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadSettings = () => {
    api.getSettings().then((data) => {
      const regular = {};
      const masked = {};

      for (const [key, value] of Object.entries(data)) {
        if (MASKED_KEYS.includes(key)) {
          masked[key] = value || '';
        } else {
          regular[key] = value || '';
        }
      }

      setSettings((prev) => ({ ...prev, ...regular }));
      setMaskedSecrets((prev) => ({ ...prev, ...masked }));
    }).catch((err) => console.error('[Settings] Failed to load:', err));
  };

  const loadStatus = () => {
    api.getConfigStatus().then(setConfigStatus).catch(console.error);
  };

  useEffect(() => {
    loadSettings();
    loadStatus();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');

    const payload = { ...settings };
    for (const key of MASKED_KEYS) {
      const newVal = secrets[key]?.trim();
      if (newVal) payload[key] = newVal;
    }

    try {
      await api.updateSettings(payload);
      setSaved(true);
      setSecrets({ anthropic_api_key: '', tiktok_client_secret: '' });
      setTimeout(() => {
        loadSettings();
        loadStatus();
        setSaved(false);
      }, 1500);
    } catch (err) {
      console.error('[Settings] Save failed:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const testAI = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testAI();
      setTestResult({ success: true, text: result.sample_reply });
    } catch (err) {
      setTestResult({ success: false, text: err.message });
    } finally {
      setTesting(false);
    }
  };

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const oauthReady = configStatus?.oauth_ready;
  const accountsConnected = configStatus?.instagram_accounts_connected || 0;
  const accountsActive = configStatus?.instagram_accounts_active || 0;
  const integrationSourceLabel = configStatus?.integration_source_label || 'Unknown';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm mt-0.5">Keep your automation friendly and your integrations healthy.</p>
      </div>

      {configStatus && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${oauthReady
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <Shield size={18} className={oauthReady ? 'text-green-400' : 'text-yellow-400'} />
          <div className="flex-1">
            <div className={`font-medium text-sm ${oauthReady ? 'text-green-400' : 'text-yellow-400'}`}>
              {oauthReady ? 'Instagram integration is ready' : 'Instagram integration needs attention'}
            </div>
            <div className="flex flex-wrap gap-4 mt-1">
              <StatusBadge ok={configStatus.meta_app_id?.set} label="App ID saved" />
              <StatusBadge ok={configStatus.meta_app_secret?.set} label="App Secret saved" />
              <StatusBadge ok={configStatus.anthropic_api_key?.set} label="AI key ready" />
            </div>
          </div>
        </div>
      )}

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">IG</span>
            </div>
            Instagram Connection
          </h2>
          <a href="/accounts" className="btn-secondary text-sm">Open Accounts</a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-bg-tertiary/70 p-4">
            <div className="text-xs text-text-muted">Status</div>
            <div className={`mt-1 font-semibold ${oauthReady ? 'text-green-400' : 'text-yellow-400'}`}>
              {oauthReady ? 'Healthy' : 'Needs attention'}
            </div>
            <div className="text-xs text-text-muted mt-2">
              SocialMind uses the saved Meta app connection automatically.
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg-tertiary/70 p-4">
            <div className="text-xs text-text-muted">Connected accounts</div>
            <div className="mt-1 font-semibold text-text-primary">{accountsConnected}</div>
            <div className="text-xs text-text-muted mt-2">
              {accountsActive} active right now
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg-tertiary/70 p-4">
            <div className="text-xs text-text-muted">App integration source</div>
            <div className="mt-1 font-semibold text-text-primary">{integrationSourceLabel}</div>
            <div className="text-xs text-text-muted mt-2">
              Normal users do not need to re-enter app credentials here.
            </div>
          </div>
        </div>

        {!oauthReady && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            An admin needs to add the Instagram app credentials in the backend environment once. After that, users can reconnect Instagram from the Accounts page without typing App ID or App Secret again.
          </div>
        )}

        <details className="rounded-xl border border-border bg-bg-tertiary/40 p-4">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-text-primary">Advanced / Admin</div>
              <div className="text-xs text-text-muted mt-0.5">Read-only technical details for troubleshooting</div>
            </div>
            <ExternalLink size={14} className="text-text-muted" />
          </summary>

          <div className="mt-4 space-y-4">
            <ReadOnlyRow label="Runtime source of truth" value={configStatus?.integration_source_label} />
            <ReadOnlyRow label="Meta App ID" value={configStatus?.meta_app_id_display} mono />
            <ReadOnlyRow label="Meta App Secret" value={configStatus?.meta_app_secret_display} mono />
            <ReadOnlyRow label="Redirect URI" value={configStatus?.canonical_redirect_uri} mono />
            <ReadOnlyRow label="App domain" value={configStatus?.canonical_app_domain} mono />
            <ReadOnlyRow label="Webhook URL" value={configStatus?.canonical_webhook_url} mono />
            <div className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-xs text-text-muted">
              These values are read-only here. Change them in backend environment variables, not in normal settings.
            </div>
          </div>
        </details>
      </div>

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
          <div className="font-medium text-text-secondary">Optional setup:</div>
          <div>1. Create an app at developers.tiktok.com</div>
          <div>2. Add redirect URI: your backend URL + <code className="bg-bg-primary px-1 rounded">/api/oauth/tiktok/callback</code></div>
          <div>3. Paste your Client Key and Client Secret below</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Client Key (Public)</label>
            <input className="input font-mono text-sm" placeholder="aw1234..."
              value={settings.tiktok_client_key} onChange={(e) => set('tiktok_client_key', e.target.value)} />
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
              onChange={(e) => setSecrets((prev) => ({ ...prev, tiktok_client_secret: e.target.value }))} />
          </div>
        </div>
      </div>

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
            onChange={(e) => setSecrets((prev) => ({ ...prev, anthropic_api_key: e.target.value }))} />
        </div>

        <div>
          <label className="label">AI Reply Prompt Template</label>
          <textarea className="input" rows={3} value={settings.ai_prompt_template} onChange={(e) => set('ai_prompt_template', e.target.value)} />
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

      <div className="card space-y-4">
        <h2 className="font-semibold text-text-primary">Anti-Spam Controls</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Min Delay (seconds)</label>
            <input className="input" type="number" min="10" value={settings.min_delay_seconds} onChange={(e) => set('min_delay_seconds', e.target.value)} />
          </div>
          <div>
            <label className="label">Max Delay (seconds)</label>
            <input className="input" type="number" min="10" value={settings.max_delay_seconds} onChange={(e) => set('max_delay_seconds', e.target.value)} />
          </div>
          <div>
            <label className="label">Max Replies / Hour</label>
            <input className="input" type="number" min="1" value={settings.max_replies_per_hour} onChange={(e) => set('max_replies_per_hour', e.target.value)} />
          </div>
          <div>
            <label className="label">User Cooldown (minutes)</label>
            <input className="input" type="number" min="5" value={settings.user_cooldown_minutes} onChange={(e) => set('user_cooldown_minutes', e.target.value)} />
          </div>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          <strong>Save failed:</strong> {saveError}
        </div>
      )}

      <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
