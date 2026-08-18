import React, { useEffect } from 'react';
import { Sparkles, ArrowRight, X, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function AIQuestionModal({ questionData, onAnswerSelected, onSkip, isOpen }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSkip]);

  if (!isOpen || !questionData) return null;

  return (
    <div className="modal-backdrop" onClick={onSkip} role="presentation">
      <div 
        className="modal-card modal-medium" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="ai-question-title"
        style={{ padding: '2rem', position: 'relative' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={20} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                AI Discovery Clarification
              </div>
              <h3 id="ai-question-title" className="type-h2" style={{ marginTop: '0.15rem' }}>
                {questionData.question}
              </h3>
            </div>
          </div>

          <button className="icon-button" onClick={onSkip} aria-label="Skip question and search anyway" title="Skip question">
            <X size={16} />
          </button>
        </div>

        <p className="type-body" style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Select an option below to help the AI pinpoint the most relevant verified listings for your career goals.
        </p>

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
          {questionData.options?.map((opt, idx) => (
            <button
              key={idx}
              className="ai-question-option-btn"
              onClick={() => onAnswerSelected(questionData.parameterKey, opt.value)}
            >
              <span>{opt.label}</span>
              <ArrowRight size={15} className="option-arrow-icon" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span className="type-caption">
            1 quick question to maximize match accuracy
          </span>
          <button className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }} onClick={onSkip}>
            Skip & Search All
          </button>
        </div>

      </div>
    </div>
  );
}
