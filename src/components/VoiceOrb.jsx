import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff } from 'lucide-react';

/**
 * VoiceOrb - المساعد الصوتي المتحرك
 * الحالات: idle | listening | thinking | speaking | error
 */
export default function VoiceOrb({ state, text, onClose, onManualActivate }) {
  const visible = state !== 'idle';

  return (
    <>
      {/* زر التفعيل اليدوي - يظهر دائماً في الزاوية */}
      {!visible && (
        <button
          onClick={onManualActivate}
          title="تفعيل المساعد (أو صفّق مرتين)"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                     bg-gradient-to-br from-blue-500 to-purple-600
                     flex items-center justify-center shadow-lg shadow-blue-500/30
                     hover:scale-110 transition-transform duration-200
                     orb-breathe"
        >
          <Mic size={22} className="text-white" />
        </button>
      )}

      {/* الـ Overlay */}
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-8 select-none">

            {/* ── الكرة الرئيسية ── */}
            <div className="relative flex items-center justify-center">

              {/* حلقات النبض الخارجية */}
              {(state === 'listening' || state === 'speaking') && (
                <>
                  <span className="absolute w-56 h-56 rounded-full bg-blue-500/10 orb-ring orb-ring-1" />
                  <span className="absolute w-44 h-44 rounded-full bg-blue-500/15 orb-ring orb-ring-2" />
                  <span className="absolute w-36 h-36 rounded-full bg-blue-500/20 orb-ring orb-ring-3" />
                </>
              )}

              {state === 'thinking' && (
                <>
                  <span className="absolute w-52 h-52 rounded-full orb-spin-ring" />
                </>
              )}

              {/* الكرة نفسها */}
              <div
                className={`
                  relative w-28 h-28 rounded-full flex items-center justify-center
                  shadow-2xl cursor-pointer transition-all duration-500
                  ${state === 'listening'  ? 'orb-listening shadow-blue-500/50'  : ''}
                  ${state === 'thinking'   ? 'orb-thinking shadow-purple-500/50' : ''}
                  ${state === 'speaking'   ? 'orb-speaking shadow-cyan-500/50'   : ''}
                  ${state === 'error'      ? 'orb-error shadow-red-500/50'       : ''}
                `}
              >
                {/* موجات داخلية */}
                {state === 'speaking' && (
                  <div className="absolute inset-0 rounded-full orb-inner-wave" />
                )}

                {/* أيقونة */}
                {state === 'listening'  && <Mic size={40} className="text-white relative z-10" />}
                {state === 'thinking'   && <span className="text-white text-3xl relative z-10 orb-dots">···</span>}
                {state === 'speaking'   && <SoundBars />}
                {state === 'error'      && <MicOff size={40} className="text-white relative z-10" />}
              </div>
            </div>

            {/* ── النص ── */}
            <div className="text-center max-w-xs min-h-[56px] flex flex-col items-center gap-1">
              <p className="text-sm text-blue-300 font-medium tracking-wide uppercase">
                {state === 'listening' && 'أسمعك...'}
                {state === 'thinking'  && 'أفكر...'}
                {state === 'speaking'  && 'ميندي'}
                {state === 'error'     && 'خطأ'}
              </p>
              {text && (
                <p className="text-white text-base leading-relaxed text-center px-4">
                  {text}
                </p>
              )}
            </div>

            {/* ── زر الإغلاق ── */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full
                         bg-white/10 hover:bg-white/20 text-white/70 hover:text-white
                         text-sm transition-all duration-200 border border-white/10"
            >
              <X size={14} />
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// أعمدة الصوت عند الكلام
function SoundBars() {
  return (
    <div className="flex items-center gap-1 relative z-10">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className="w-1.5 bg-white rounded-full sound-bar"
          style={{ animationDelay: `${i * 0.1}s`, height: `${12 + i * 4}px` }}
        />
      ))}
    </div>
  );
}
