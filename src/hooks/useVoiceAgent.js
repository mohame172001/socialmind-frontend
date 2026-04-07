import { useEffect, useRef, useState, useCallback } from 'react';

const API_BASE  = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '') + '/api';
const WS_LOCAL  = 'ws://localhost:7654';
const GREET_TXT = 'أهلاً بك سيدي! بماذا تأمر؟';

export function useVoiceAgent() {
  const [orbState, setOrbState] = useState('idle');
  const [orbText,  setOrbText]  = useState('');

  const recRef      = useRef(null);
  const activeRef   = useRef(false);
  const historyRef  = useRef([]);       // conversation history
  const activateRef = useRef(null);
  const wsRef       = useRef(null);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text, onDone) => {
    const synth = window.speechSynthesis;
    synth.cancel();

    // انتظر تحميل الأصوات
    const doSpeak = () => {
      const utt   = new SpeechSynthesisUtterance(text);
      utt.lang    = 'ar-EG';
      utt.rate    = 0.92;
      utt.pitch   = 1.0;
      utt.volume  = 1.0;

      const voices  = synth.getVoices();
      const arVoice = voices.find(v => /ar[-_]EG/i.test(v.lang))
                   || voices.find(v => v.lang.startsWith('ar'))
                   || voices.find(v => /arab/i.test(v.name));
      if (arVoice) utt.voice = arVoice;

      utt.onstart = () => { setOrbState('speaking'); setOrbText(text); };
      utt.onend   = () => { if (onDone) onDone(); };
      utt.onerror = () => { if (onDone) onDone(); };  // مش شغال → كمّل

      synth.speak(utt);

      // Chrome pause bug fix
      const t = setInterval(() => {
        if (synth.paused) synth.resume();
        if (!synth.speaking) clearInterval(t);
      }, 400);
    };

    if (synth.getVoices().length > 0) {
      doSpeak();
    } else {
      synth.onvoiceschanged = () => { synth.onvoiceschanged = null; doSpeak(); };
    }
  }, []);

  // ── STT ──────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!activeRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setOrbState('error');
      setOrbText('Chrome مطلوب للتعرف على الصوت');
      return;
    }

    try { recRef.current?.stop(); } catch {}
    const r = new SR();
    r.lang = 'ar-EG';
    r.continuous      = false;
    r.interimResults  = false;
    r.maxAlternatives = 1;
    recRef.current = r;

    setOrbState('listening');
    setOrbText('');

    r.onresult = (e) => {
      const cmd = e.results[0][0].transcript.trim();
      if (cmd) handleCommand(cmd);
    };

    r.onerror = (e) => {
      if (e.error === 'no-speech' && activeRef.current) {
        setTimeout(startListening, 300);
      } else if (!['aborted','interrupted'].includes(e.error)) {
        setOrbState('error');
        setOrbText('تأكد من إذن الميكروفون في Chrome');
      }
    };

    try { r.start(); } catch {}
  }, []);

  // ── معالجة الأوامر ────────────────────────────────────────────────────────
  const handleCommand = useCallback(async (cmd) => {
    if (!activeRef.current) return;

    // إغلاق
    if (/خروج|إغلاق|انتهى|باي|وداع|كفاية|stop/i.test(cmd)) {
      activeRef.current = false;
      historyRef.current = [];
      speak('في أمان الله سيدي!', () => { setOrbState('idle'); setOrbText(''); });
      return;
    }

    setOrbState('thinking');
    setOrbText(cmd);

    try {
      const res  = await fetch(`${API_BASE}/settings/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, history: historyRef.current }),
      });
      const data = await res.json();
      const reply = data.response || '...';

      // حفظ في التاريخ
      historyRef.current = [
        ...historyRef.current.slice(-8),
        { role: 'user',      content: cmd   },
        { role: 'assistant', content: reply },
      ];

      speak(reply, () => { if (activeRef.current) startListening(); });
    } catch {
      speak('تعذّر الاتصال بالسيرفر.', () => { if (activeRef.current) startListening(); });
    }
  }, [speak, startListening]);

  // ── تفعيل الجلسة ─────────────────────────────────────────────────────────
  const activate = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current  = true;
    historyRef.current = [];

    // أظهر الـ Orb فوراً
    setOrbState('speaking');
    setOrbText(GREET_TXT);

    // تكلم - بعدها ابدأ تسمع
    speak(GREET_TXT, () => startListening());
  }, [speak, startListening]);

  const deactivate = useCallback(() => {
    activeRef.current = false;
    window.speechSynthesis.cancel();
    try { recRef.current?.stop(); } catch {}
    setOrbState('idle');
    setOrbText('');
  }, []);

  useEffect(() => { activateRef.current = activate; }, [activate]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let ws, retry;

    function connect() {
      try {
        ws = new WebSocket(WS_LOCAL);
        wsRef.current = ws;
        ws.onopen    = () => console.log('[WS] Connected');
        ws.onclose   = () => { retry = setTimeout(connect, 4000); };
        ws.onerror   = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'activate') activateRef.current?.();
          } catch {}
        };
      } catch { retry = setTimeout(connect, 4000); }
    }

    connect();
    return () => { clearTimeout(retry); try { ws?.close(); } catch {} };
  }, []);

  return { orbState, orbText, activate, deactivate };
}
