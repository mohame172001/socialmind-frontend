import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:7654';

export function useVoiceAgent() {
  const [orbState, setOrbState] = useState('idle');
  const [orbText,  setOrbText]  = useState('');

  const recRef    = useRef(null);
  const wsRef     = useRef(null);
  const activeRef = useRef(false);

  // ── STT: يسمع ويبعت الأمر لـ Python ─────────────────────────────────────
  const startListening = useCallback(() => {
    if (!activeRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setOrbState('error');
      setOrbText('Chrome is required for voice recognition');
      return;
    }

    try { recRef.current?.stop(); } catch {}

    const r = new SR();
    r.lang            = 'ar-EG';
    r.continuous      = false;
    r.interimResults  = false;
    r.maxAlternatives = 1;
    recRef.current    = r;

    setOrbState('listening');
    setOrbText('');

    r.onresult = (e) => {
      const cmd = e.results[0][0].transcript.trim();
      if (!cmd || !activeRef.current) return;
      console.log('[STT]', cmd);

      // أوامر الإغلاق محلياً
      if (/خروج|إغلاق|انتهى|باي|وداع|كفاية|stop|exit|bye/i.test(cmd)) {
        activeRef.current = false;
        setOrbState('idle');
        setOrbText('');
        return;
      }

      // ابعت للـ Python
      sendWS({ type: 'command', text: cmd });
    };

    r.onerror = (e) => {
      if (e.error === 'no-speech' && activeRef.current) {
        setTimeout(startListening, 200);
      } else if (!['aborted', 'interrupted'].includes(e.error)) {
        setOrbState('error');
        setOrbText('Microphone error: ' + e.error);
      }
    };

    try { r.start(); } catch {}
  }, []);

  const sendWS = useCallback((data) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, []);

  // ── تفعيل يدوي (click) ───────────────────────────────────────────────────
  const activate = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setOrbState('listening');
    setOrbText('');
    startListening();
  }, [startListening]);

  const deactivate = useCallback(() => {
    activeRef.current = false;
    try { recRef.current?.stop(); } catch {}
    setOrbState('idle');
    setOrbText('');
  }, []);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let ws, retry;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen  = () => console.log('[WS] Connected to Mindy agent');
        ws.onclose = () => { retry = setTimeout(connect, 3000); };
        ws.onerror = () => ws.close();

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);

            if (msg.type === 'activate') {
              // من التصفيق: أظهر الـ Orb وابدأ الاستماع
              activeRef.current = true;
              setOrbState('listening');
              setOrbText('');
              startListening();

            } else if (msg.type === 'thinking') {
              // Python بيفكر (أثناء كلام Claude)
              setOrbState('thinking');
              setOrbText(msg.text || '');
              try { recRef.current?.stop(); } catch {}

            } else if (msg.type === 'listen') {
              // Python خلص الكلام - ابدأ تسمع
              if (activeRef.current) {
                setOrbState('listening');
                setOrbText('');
                startListening();
              }
            }
          } catch {}
        };
      } catch { retry = setTimeout(connect, 3000); }
    };

    connect();
    return () => {
      clearTimeout(retry);
      try { ws?.close(); } catch {}
    };
  }, [startListening]);

  return { orbState, orbText, activate, deactivate };
}
