import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, Zap, X } from 'lucide-react';

export default function Toast({ message, onClose, duration = 3200 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setIsVisible(false);
      return;
    }

    // Trigger enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 20);

    // Auto dismiss after duration
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 250);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [message, duration, onClose]);

  if (!message) return null;

  // Clean and parse message
  const rawText = typeof message === 'string' ? message : message?.text || '';
  
  // Strip leading checkmarks/icons from text if already formatted
  const cleanText = rawText.replace(/^[✓✔🎯⚡📧ℹ️⚠️]\s*/, '').trim();

  // Detect type
  const isError = /error|failed|rejected|invalid|blocked/i.test(cleanText);
  const isInfo = /searching|initiating|re-running|analyzing/i.test(cleanText);
  const isAction = /prep|copied|updated|saved|cleared|dispatched|sent|signed|verified/i.test(cleanText);

  return (
    <div 
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md select-none max-w-sm sm:max-w-md">
        
        {/* Dynamic Icon */}
        {isError ? (
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
        ) : isInfo ? (
          <Info size={18} className="text-blue-500 flex-shrink-0" />
        ) : isAction ? (
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
        ) : (
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
        )}

        {/* Message Text */}
        <span className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight leading-snug flex-1">
          {cleanText}
        </span>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 200);
          }}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
