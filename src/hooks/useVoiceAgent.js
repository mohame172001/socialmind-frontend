import { useEffect, useRef, useState, useCallback } from 'react';

const BACKEND_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
const WS_LOCAL    = 'ws://localhost:7654';
const GREET       = 'أهلا بك سيدي! بماذا تأمر؟';

export function useVoiceAgent() {
  const [orbState, setOrbState]   = useState('idle');   // idle|listening|thinking|speaking|error
  const [orbText,  setOrbText]    = useState('');

  const recognitionRef = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);
  const wsRef          = useRef(null);
  const activeRef      = useRef(false);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback((text, onDone) => {
    const synth = synthRef.current;
    synth.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = 'ar-EG';
    utt.rate  = 0.95;
    utt.pitch = 1.0;

    // اختر أحسن صوت عربي متاح
    const voices = synth.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar')) ||
                    voices.find(v => v.name.toLowerCase().includes('arab'));
    if (arVoice) utt.voice = arVoice;

    utt.onstart = () => {
      setOrbState('speaking');
      setOrbText(text);
    };
    utt.onend = () => {
      if (onDone) onDone();
    };
    utt.onerror = () => {
      if (onDone) onDone();
    };

    synth.speak(utt);
  }, []);

  // ── STT ────────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setOrbState('error');
      setOrbText('المتصفح لا يدعم التعرف على الصوت. استخدم Chrome.');
      return;
    }

    const r = new SR();
    r.lang           = 'ar-EG';
    r.interimResults = false;
    r.maxAlternatives= 1;
    recognitionRef.current = r;

    setOrbState('listening');
    setOrbText('');

    r.onresult = (e) => {
      const command = e.results[0][0].transcript.trim();
      console.log('[STT]', command);
      handleCommand(command);
    };

    r.onerror = (e) => {
      if (e.error === 'no-speech') {
        speak('لم أسمعك، حاول مرة أخرى.', () => startListening());
      } else {
        setOrbState('error');
        setOrbText('تعذّر سماعك، تأكد من الميكروفون.');
      }
    };

    r.onend = () => {
      // لو ما جاش result → error سيتولى الأمر
    };

    r.start();
  }, [speak]);

  // ── طلب من الـ backend ─────────────────────────────────────────────────────
  const handleCommand = useCallback(async (command) => {
    // إنهاء الجلسة
    if (/خروج|إغلاق|انتهى|باي|وداعاً|كفاية/.test(command)) {
      speak('في أمان الله سيدي!', () => {
        setOrbState('idle');
        setOrbText('');
        activeRef.current = false;
      });
      return;
    }

    setOrbState('thinking');
    setOrbText(command);

    try {
      const res = await fetch(`${BACKEND_URL}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      const reply = data.response || 'تم.';
      speak(reply, () => {
        if (activeRef.current) startListening();
      });
    } catch {
      speak('تعذّر الاتصال بالسيرفر.', () => {
        if (activeRef.current) startListening();
      });
    }
  }, [speak, startListening]);

  // ── تفعيل الجلسة ──────────────────────────────────────────────────────────
  const activate = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    speak(GREET, () => startListening());
  }, [speak, startListening]);

  const deactivate = useCallback(() => {
    activeRef.current = false;
    synthRef.current.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setOrbState('idle');
    setOrbText('');
  }, []);

  // ── WebSocket من Python agent ──────────────────────────────────────────────
  useEffect(() => {
    let ws;
    let retryTimer;

    function connect() {
      try {
        ws = new WebSocket(WS_LOCAL);

        ws.onopen  = () => console.log('[WS] Connected to local agent');
        ws.onclose = () => {
          retryTimer = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws.close();

        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.type === 'activate') activate();
        };

        wsRef.current = ws;
      } catch {
        retryTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      if (ws) ws.close();
    };
  }, [activate]);

  return { orbState, orbText, activate, deactivate };
}
