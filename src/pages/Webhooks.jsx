import React, { useEffect, useState } from 'react';
import { Copy, Check, Webhook, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';

function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <div className={`flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm ${mono ? 'font-mono' : ''} text-text-primary break-all`}>
          {value || <span className="text-text-muted">Loading...</span>}
        </div>
        {value && (
          <button onClick={copy} className={`flex-shrink-0 p-2 rounded-lg border transition-colors ${copied ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-border bg-bg-tertiary text-text-muted hover:text-text-primary hover:border-accent-blue'}`}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Webhooks() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    api.getWebhooks().then(setInfo).catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Webhook URLs</h1>
        <p className="text-text-muted text-sm mt-0.5">Paste these in your Meta / TikTok developer consoles</p>
      </div>

      {/* Instagram */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <span className="text-pink-400 font-bold text-sm">IG</span>
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Instagram / Meta</h2>
            <p className="text-text-muted text-xs">Meta for Developers → Your App → Webhooks</p>
          </div>
        </div>
        <CopyField label="Callback URL" value={info?.instagram_webhook_url} />
        <CopyField label="Verify Token" value={info?.instagram_verify_token} />

        <div className="bg-bg-tertiary rounded-lg p-3 space-y-1.5 text-xs text-text-muted">
          <div className="font-medium text-text-secondary">Setup Steps:</div>
          <div>1. Go to <strong>developers.facebook.com</strong> → Your App</div>
          <div>2. Add Product → Webhooks → Subscribe to <strong>Instagram</strong></div>
          <div>3. Paste the Callback URL and Verify Token above</div>
          <div>4. Subscribe to <strong>comments</strong> and <strong>messages</strong> fields</div>
          <div>5. Make sure Instagram account is linked to a Facebook Page</div>
        </div>
      </div>

      {/* TikTok */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <span className="text-cyan-400 font-bold text-sm">TK</span>
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">TikTok for Business</h2>
            <p className="text-text-muted text-xs">developers.tiktok.com → Your App → Events</p>
          </div>
        </div>
        <CopyField label="Webhook URL" value={info?.tiktok_webhook_url} />
        <CopyField label="Verify Token" value={info?.tiktok_verify_token} />

        <div className="bg-bg-tertiary rounded-lg p-3 space-y-1.5 text-xs text-text-muted">
          <div className="font-medium text-text-secondary">Setup Steps:</div>
          <div>1. Go to <strong>developers.tiktok.com</strong> → Your App → Events</div>
          <div>2. Add Webhook Endpoint with the URL above</div>
          <div>3. Subscribe to <strong>comment.create</strong> events</div>
          <div>4. Note: TikTok Business API requires business verification</div>
        </div>
      </div>

      {/* Quick test */}
      <div className="card border-accent-blue/30 bg-accent-blue/5">
        <div className="flex items-start gap-3">
          <Webhook size={18} className="text-accent-blue mt-0.5 flex-shrink-0" />
          <div className="text-sm text-text-secondary">
            <strong className="text-text-primary">Test webhook:</strong> Once configured, Instagram will send a GET request to verify the endpoint, then POST events for every new comment. You'll see them appear in the Activity Log in real-time.
          </div>
        </div>
      </div>
    </div>
  );
}
