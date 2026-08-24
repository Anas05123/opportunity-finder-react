import React from 'react';
import { Sparkles } from 'lucide-react';

export default function LoadingScreen({ 
  message = "Loading Careerly...", 
  subMessage = "Verifying credentials & calibrating opportunity feed",
  fullScreen = true 
}) {
  return (
    <div 
      className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen w-full fixed inset-0 z-50' : 'min-h-[60vh] w-full'} bg-background text-foreground select-none transition-colors duration-300`}
      style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
    >
      {/* Ambient Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(36, 87, 255, 0.15) 0%, transparent 65%)'
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        
        {/* Brand Icon with Orbiting Glow */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Aura */}
          <div className="absolute w-24 h-24 rounded-full bg-[#2457FF]/15 animate-ping" style={{ animationDuration: '3s' }} />
          
          {/* Rotating Glowing Ring */}
          <div className="absolute w-20 h-20 rounded-full border-2 border-dashed border-[#2457FF]/40 animate-spin" style={{ animationDuration: '10s' }} />
          
          {/* Center Brand Logo */}
          <div className="relative w-16 h-16 rounded-2xl bg-white/5 dark:bg-white/10 backdrop-blur-md border border-[#2457FF]/30 p-2.5 flex items-center justify-center shadow-xl shadow-[#2457FF]/20 transition-transform hover:scale-105">
            <img 
              src="/careerly-logo.png" 
              alt="Careerly" 
              className="w-full h-full object-contain drop-shadow-md"
            />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-background rounded-full animate-pulse" />
          </div>
        </div>

        {/* Dynamic Typography */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#2457FF]">
            <Sparkles size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
            <span>Career Intelligence</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
            {message}
          </h2>
          {subMessage && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {subMessage}
            </p>
          )}
        </div>

        {/* Shimmering Progress Track */}
        <div className="w-48 h-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent via-[#2457FF] to-transparent w-24 rounded-full animate-shimmer"
            style={{
              animation: 'careerlyProgressBeam 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }}
          />
        </div>

      </div>

      <style>{`
        @keyframes careerlyProgressBeam {
          0% { left: -50%; }
          100% { left: 120%; }
        }
      `}</style>
    </div>
  );
}
