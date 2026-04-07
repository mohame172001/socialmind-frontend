import React from 'react';
import { X, Mic, MicOff } from 'lucide-react';

export default function VoiceOrb({ state, text, onClose, onManualActivate }) {

  if (state === 'idle') {
    return (
      <button
        onClick={onManualActivate}
        title="Click or clap twice"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-gradient-to-br from-blue-500 to-purple-600
                   flex items-center justify-center shadow-lg shadow-blue-500/30
                   hover:scale-110 transition-transform duration-200 orb-breathe"
      >
        <Mic size={22} className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="flex flex-col items-center gap-8 select-none">

        {/* الكرة */}
        <div className="relative flex items-center justify-center">

          {/* حلقات نبض */}
          {(state === 'listening' || state === 'speaking') && (
            <>
              <span className="absolute w-60 h-60 rounded-full bg-blue-500/8  orb-ring orb-ring-1" />
              <span className="absolute w-48 h-48 rounded-full bg-blue-500/12 orb-ring orb-ring-2" />
              <span className="absolute w-38 h-38 rounded-full bg-blue-500/18 orb-ring orb-ring-3" />
            </>
          )}

          {state === 'thinking' && (
            <span className="absolute w-52 h-52 rounded-full orb-spin-ring" />
          )}

          {/* الكرة الرئيسية */}
          <div className={[
            'relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500',
            state === 'listening' ? 'orb-listening shadow-blue-500/60'   : '',
            state === 'thinking'  ? 'orb-thinking  shadow-purple-500/60' : '',
            state === 'speaking'  ? 'orb-speaking  shadow-cyan-500/60'   : '',
            state === 'error'     ? 'orb-error     shadow-red-500/60'    : '',
          ].join(' ')}>

            {state === 'speaking' && <div className="absolute inset-0 rounded-full orb-inner-wave" />}

            {state === 'listening' && <Mic    size={44} className="text-white relative z-10" />}
            {state === 'thinking'  && <span className="text-white text-4xl relative z-10 orb-dots">···</span>}
            {state === 'speaking'  && <SoundBars />}
            {state === 'error'     && <MicOff size={44} className="text-white relative z-10" />}
          </div>
        </div>

        {/* النص */}
        <div className="text-center max-w-sm flex flex-col items-center gap-2 min-h-16">
          <p className="text-sm font-semibold tracking-widest uppercase text-blue-300">
            {state === 'listening' && 'Listening...'}
            {state === 'thinking'  && 'Thinking...'}
            {state === 'speaking'  && 'Mindy'}
            {state === 'error'     && 'Error'}
          </p>
          {text && (
            <p className="text-white text-base leading-relaxed px-6 text-center">
              {text}
            </p>
          )}
        </div>

        {/* إغلاق */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full
                     bg-white/10 hover:bg-white/20 text-white/70 hover:text-white
                     text-sm transition-all duration-200 border border-white/10"
        >
          <X size={14} /> Close
        </button>
      </div>
    </div>
  );
}

function SoundBars() {
  return (
    <div className="flex items-end gap-1.5 relative z-10" style={{height: 44}}>
      {[18, 32, 44, 32, 18].map((h, i) => (
        <span key={i} className="w-2 bg-white rounded-full sound-bar"
          style={{ height: h, animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  );
}
