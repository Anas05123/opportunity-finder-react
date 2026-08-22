import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

const STAGES = [
  { id: 1, label: 'Understanding your request & extracting intent' },
  { id: 2, label: 'Checking candidate profile & academic prerequisites' },
  { id: 3, label: 'Searching 9 registered source adapter suites & public feeds' },
  { id: 4, label: 'Removing duplicate cross-postings & canonicalizing' },
  { id: 5, label: 'Verifying live corporate links & recruiter emails' },
  { id: 6, label: 'Calculating deterministic 8-factor match rankings' }
];

export default function SearchProgressExperience({ isActive, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(1);
      return;
    }

    const intervals = [400, 700, 1100, 1500, 1900, 2300];
    const timers = intervals.map((delay, index) => {
      return setTimeout(() => {
        setCurrentStep(index + 2);
      }, delay);
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="search-progress-overlay">
      <div className="search-progress-card">
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <Sparkles size={20} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--foreground)' }}>
            AI Discovery Pipeline Active
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {STAGES.map((stage) => {
            const isFinished = currentStep > stage.id;
            const isCurrent = currentStep === stage.id;

            return (
              <div 
                key={stage.id} 
                className={`search-progress-row ${isFinished ? 'done' : isCurrent ? 'current' : 'pending'}`}
              >
                <div className="progress-icon-slot">
                  {isFinished ? (
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  ) : isCurrent ? (
                    <Loader2 size={16} className="spin" color="var(--accent-blue)" />
                  ) : (
                    <div className="progress-bullet" />
                  )}
                </div>
                <span className="progress-label-text">
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
