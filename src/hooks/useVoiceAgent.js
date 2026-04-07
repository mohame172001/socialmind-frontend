import { useEffect, useRef, useState, useCallback } from 'react';

const WS_LOCAL = 'ws://localhost:7654';

export function useVoiceAgent() {
  const [orbState, setOrbState] = useState('idle');
  const [orbText,  setOrbText]  = useState('');

  const recognitionRef = useRef(null);
  const wsRef          = useRef(null);
  const activeRef      = useRef(false);
  const activateRef    = useRef(null);

  // ── STT ──────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!activeRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setOrbState('error');
      setOrbText('Chrome مطلوب للتعرف على الصوت');
      return;
    }

    try { recognitionRef.current?.stop(); } catch {}

    const r = new SR();
    r.lang            = 'ar-EG';
    r.interimResults  = false;
    r.maxAlternatives = 1;
    r.continuous      = false;
    recognitionRef.current = r;

    setOrbState('listening');
    setOrbText('');

    r.onresult = (e) => {
      const cmd = e.results[0][0].transcript.trim();
      console.log('[STT]', cmd);
      if (!activeRef.current) return;

      // أوامر الإغلاق
      if (/خروج|إغلاق|انتهى|باي|وداع|كفاية|stop/i.test(cmd)) {
        // ابعت للـ Python يقول وداع
        sendToAgent({ type: "speak", text: "في أمان الله سيدي!" });
        setOrbState('speaking');
        setOrbText('في أمان الله سيدي!');
        activeRef.current = false;
        // الـ speak_done هيجي من Python ويغلق الـ Orb
        return;
      }

      // ابعت الأمر لـ Python يعالجه ويتكلم
      setOrbState('thinking');
      setOrbText(cmd);
      sendToAgent({ type: "command", text: cmd });
    };

    r.onerror = (e) => {
      if (e.error === 'no-speech' && activeRef.current) {
        startListening();
      } else if (e.error !== 'aborted') {
        setOrbState('error');
        setOrbText('تأكد من الميكروفون وأذونات المتصفح');
      }
    };

    try { r.start(); } catch {}
  }, []);

  // ── إرسال رسالة لـ Python ─────────────────────────────────────────────────
  const sendToAgent = useCallback((msg) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  // ── تفعيل الجلسة ─────────────────────────────────────────────────────────
  const activate = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;

    // أظهر الـ Orb فوراً - Python قال الترحيب محلياً بالفعل
    setOrbState('listening');
    setOrbText('أهلا بك سيدي! بماذا تأمر؟');

    // ابدأ تسمع بعد ثانية واحدة (بعد ما الصوت المحلي يخلص)
    setTimeout(() => {
      setOrbText('');
      startListening();
    }, 1000);
  }, [startListening]);

  // ── deactivate ────────────────────────────────────────────────────────────
  const deactivate = useCallback(() => {
    activeRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    setOrbState('idle');
    setOrbText('');
  }, []);

  // حفظ activate في ref
  useEffect(() => { activateRef.current = activate; }, [activate]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let ws;
    let retryTimer;

    function connect() {
      try {
        ws = new WebSocket(WS_LOCAL);
        wsRef.current = ws;

        ws.onopen  = () => console.log('[WS] Connected to local agent');
        ws.onclose = () => { retryTimer = setTimeout(connect, 4000); };
        ws.onerror = () => ws.close();

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);

            if (msg.type === 'activate') {
              activateRef.current?.();

            } else if (msg.type === 'reply') {
              // Python رد وتكلم - أظهر النص وابدأ تسمع
              setOrbState('speaking');
              setOrbText(msg.text || '');

            } else if (msg.type === 'speak_done') {
              // Python خلص الكلام
              if (activeRef.current) {
                setOrbText('');
                startListening();
              } else {
                setOrbState('idle');
                setOrbText('');
              }
            }
          } catch {}
        };
      } catch {
        retryTimer = setTimeout(connect, 4000);
      }
    }

    connect();
    return () => {
      clearTimeout(retryTimer);
      try { ws?.close(); } catch {}
    };
  }, [startListening]);

  return { orbState, orbText, activate, deactivate };
}
