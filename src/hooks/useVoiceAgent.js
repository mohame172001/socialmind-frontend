import { useEffect, useRef, useState, useCallback } from 'react';

const API   = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '') + '/api';
const WS    = 'ws://localhost:7654';
const GREET = 'أهلاً بك سيدي! بماذا تأمر؟';

export function useVoiceAgent() {
  const [orbState, setOrbState] = useState('idle');   // idle|ready|listening|thinking|speaking|error
  const [orbText,  setOrbText]  = useState('');

  const recRef     = useRef(null);
  const activeRef  = useRef(false);
  const histRef    = useRef([]);
  const actRef     = useRef(null);   // للـ WS handler

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text, onDone) => {
    const s = window.speechSynthesis;
    s.cancel();

    const go = () => {
      const u    = new SpeechSynthesisUtterance(text);
      u.lang     = 'ar-EG';
      u.rate     = 0.92;
      u.volume   = 1;

      const voices = s.getVoices();
      u.voice = voices.find(v => /ar[-_]EG/i.test(v.lang))
             || voices.find(v => v.lang.startsWith('ar'))
             || null;

      u.onstart = () => { setOrbState('speaking'); setOrbText(text); };
      u.onend   = () => onDone?.();
      u.onerror = () => onDone?.();
      s.speak(u);

      // Chrome pause bug
      const t = setInterval(() => {
        if (s.paused) s.resume();
        if (!s.speaking) clearInterval(t);
      }, 400);
    };

    s.getVoices().length ? go() : (s.onvoiceschanged = () => { s.onvoiceschanged = null; go(); });
  }, []);

  // ── STT ──────────────────────────────────────────────────────────────────
  const listen = useCallback(() => {
    if (!activeRef.current) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setOrbState('error'); setOrbText('Chrome مطلوب'); return; }

    try { recRef.current?.stop(); } catch {}
    const r = new SR();
    r.lang = 'ar-EG'; r.continuous = false; r.interimResults = false;
    recRef.current = r;
    setOrbState('listening'); setOrbText('');

    r.onresult = e => { const c = e.results[0][0].transcript.trim(); if (c) onCmd(c); };
    r.onerror  = e => {
      if (e.error === 'no-speech' && activeRef.current) setTimeout(listen, 200);
      else if (!['aborted','interrupted'].includes(e.error)) {
        setOrbState('error'); setOrbText('تأكد من إذن الميكروفون');
      }
    };
    try { r.start(); } catch {}
  }, []);

  // ── معالجة الأوامر ────────────────────────────────────────────────────────
  const onCmd = useCallback(async cmd => {
    if (!activeRef.current) return;

    if (/خروج|إغلاق|انتهى|باي|وداع|كفاية|stop/i.test(cmd)) {
      activeRef.current = false; histRef.current = [];
      speak('في أمان الله سيدي!', () => { setOrbState('idle'); setOrbText(''); });
      return;
    }

    setOrbState('thinking'); setOrbText(cmd);

    try {
      const r = await fetch(`${API}/activity/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, history: histRef.current }),
      });
      const d = await r.json();
      const reply = d.response || '...';
      histRef.current = [...histRef.current.slice(-8),
        { role:'user', content:cmd }, { role:'assistant', content:reply }];
      speak(reply, () => { if (activeRef.current) listen(); });
    } catch {
      speak('تعذّر الاتصال.', () => { if (activeRef.current) listen(); });
    }
  }, [speak, listen]);

  // ── تفعيل (مع user gesture) ───────────────────────────────────────────────
  const activate = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true; histRef.current = [];
    setOrbState('speaking'); setOrbText(GREET);
    speak(GREET, () => listen());
  }, [speak, listen]);

  // ── ready: يظهر الـ orb بدون كلام (من التصفيق) ──────────────────────────
  const ready = useCallback(() => {
    if (activeRef.current) return;
    setOrbState('ready'); setOrbText('');
  }, []);

  const deactivate = useCallback(() => {
    activeRef.current = false;
    window.speechSynthesis.cancel();
    try { recRef.current?.stop(); } catch {}
    setOrbState('idle'); setOrbText('');
  }, []);

  useEffect(() => { actRef.current = { activate, ready }; }, [activate, ready]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let ws, retry;
    const connect = () => {
      try {
        ws = new WebSocket(WS);
        ws.onopen  = () => console.log('[WS] connected');
        ws.onclose = () => { retry = setTimeout(connect, 4000); };
        ws.onerror = () => ws.close();
        ws.onmessage = e => {
          try {
            const m = JSON.parse(e.data);
            // من التصفيق → أظهر الـ orb في وضع ready فقط
            if (m.type === 'activate') actRef.current?.ready();
          } catch {}
        };
      } catch { retry = setTimeout(connect, 4000); }
    };
    connect();
    return () => { clearTimeout(retry); try { ws?.close(); } catch {} };
  }, []);

  return { orbState, orbText, activate, deactivate };
}
