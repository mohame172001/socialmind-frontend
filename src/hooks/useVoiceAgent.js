import { useEffect, useRef, useState, useCallback } from 'react';

const BACKEND_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
const WS_LOCAL    = 'ws://localhost:7654';

export function useVoiceAgent() {
  const [orbState, setOrbState] = useState('idle');
  const [orbText,  setOrbText]  = useState('');

  const recognitionRef  = useRef(null);
  const activeRef       = useRef(false);
  const audioUnlocked   = useRef(false);   // هل Chrome سمح بالكلام بعد interaction؟
  const activateRef     = useRef(null);    // ref للـ activate function (للـ WS handler)

  // ── فتح قناة الصوت عند أول interaction ──────────────────────────────────
  const unlockAudio = useCallback(() => {
    if (audioUnlocked.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    audioUnlocked.current = true;
  }, []);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text, onDone) => {
    const synth = window.speechSynthesis;
    synth.cancel();

    const utt    = new SpeechSynthesisUtterance(text);
    utt.lang     = 'ar-EG';
    utt.rate     = 0.95;
    utt.pitch    = 1.0;
    utt.volume   = 1.0;

    // أحسن صوت عربي متاح
    const voices  = synth.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar')) ||
                    voices.find(v => v.name.toLowerCase().includes('arab'));
    if (arVoice) utt.voice = arVoice;

    utt.onstart = () => { setOrbState('speaking'); setOrbText(text); };
    utt.onend   = () => { if (onDone) onDone(); };
    utt.onerror = (e) => {
      console.warn('[TTS error]', e.error);
      if (onDone) onDone();
    };

    synth.speak(utt);

    // Chrome bug workaround: بعض الأوقات بيقف - خليه يكمل
    const resume = setInterval(() => {
      if (synth.paused) synth.resume();
      if (!synth.speaking) clearInterval(resume);
    }, 500);
  }, []);

  // ── STT ──────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setOrbState('error');
      setOrbText('Chrome مطلوب للتعرف على الصوت');
      return;
    }

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
      handleCommand(cmd);
    };

    r.onerror = (e) => {
      console.warn('[STT error]', e.error);
      if (e.error === 'no-speech' && activeRef.current) {
        startListening();
      } else if (e.error !== 'aborted') {
        setOrbState('error');
        setOrbText('تأكد من الميكروفون وأذونات المتصفح');
      }
    };

    try { r.start(); } catch {}
  }, []);   // handleCommand added below via ref

  // ── handleCommand ─────────────────────────────────────────────────────────
  const handleCommand = useCallback(async (command) => {
    if (!command) return;

    if (/خروج|إغلاق|انتهى|باي|وداعاً|كفاية|stop/.test(command)) {
      activeRef.current = false;
      speak('في أمان الله سيدي!', () => {
        setOrbState('idle');
        setOrbText('');
      });
      return;
    }

    setOrbState('thinking');
    setOrbText(command);

    try {
      const res  = await fetch(`${BACKEND_URL}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data  = await res.json();
      const reply = data.response || '...';
      speak(reply, () => {
        if (activeRef.current) startListening();
      });
    } catch {
      speak('تعذّر الاتصال بالسيرفر', () => {
        if (activeRef.current) startListening();
      });
    }
  }, [speak, startListening]);

  // ── تفعيل الجلسة ─────────────────────────────────────────────────────────
  const activate = useCallback(() => {
    if (activeRef.current) return;
    unlockAudio();
    activeRef.current = true;

    // أظهر الـ Orb فوراً بصرياً مع نص الترحيب
    setOrbState('listening');
    setOrbText('أهلا بك سيدي! بماذا تأمر؟');

    // حاول تتكلم - لو Chrome سمح هيتكلم، لو لأ الـ Orb موجودة بصرياً
    const synth = window.speechSynthesis;
    const utt   = new SpeechSynthesisUtterance('أهلا بك سيدي! بماذا تأمر؟');
    utt.lang    = 'ar-EG';
    utt.rate    = 0.95;

    const voices  = synth.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arVoice) utt.voice = arVoice;

    utt.onstart = () => setOrbState('speaking');
    utt.onend   = () => { setOrbState('listening'); setOrbText(''); startListening(); };
    utt.onerror = () => { setOrbText(''); startListening(); };  // مش قادر يتكلم → يسمع مباشرة

    synth.cancel();
    synth.speak(utt);

    // لو مش تكلم بعد 2 ثانية → ابدأ تسمع مباشرة
    const speakingRef = { started: false };
    utt.onstart = () => { speakingRef.started = true; setOrbState('speaking'); };
    setTimeout(() => {
      if (!speakingRef.started && activeRef.current) {
        setOrbText('');
        startListening();
      }
    }, 2000);
  }, [unlockAudio, startListening]);

  // ── deactivate ────────────────────────────────────────────────────────────
  const deactivate = useCallback(() => {
    activeRef.current = false;
    window.speechSynthesis.cancel();
    try { recognitionRef.current?.stop(); } catch {}
    setOrbState('idle');
    setOrbText('');
  }, []);

  // حفظ activate في ref عشان WS handler يستخدمها بدون إعادة connect
  useEffect(() => { activateRef.current = activate; }, [activate]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let ws;
    let retryTimer;

    function connect() {
      try {
        ws = new WebSocket(WS_LOCAL);
        ws.onopen  = () => console.log('[WS] Connected to local agent');
        ws.onclose = () => { retryTimer = setTimeout(connect, 4000); };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'activate') activateRef.current?.();
          } catch {}
        };
      } catch {
        retryTimer = setTimeout(connect, 4000);
      }
    }

    connect();
    return () => { clearTimeout(retryTimer); try { ws?.close(); } catch {} };
  }, []);  // deps فاضية - WS يتصل مرة واحدة بس

  return { orbState, orbText, activate, deactivate };
}
