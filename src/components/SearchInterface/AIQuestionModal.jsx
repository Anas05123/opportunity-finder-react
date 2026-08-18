import React from 'react';
import { Sparkles, ArrowRight, X, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function AIQuestionModal({ questionData, onAnswerSelected, onSkip, isOpen }) {
  if (!isOpen || !questionData) return null;

  return (
    <div className="modal-backdrop" onClick={onSkip}>
      <div className="modal-card modal-medium" onClick={(e) => e.stopPropagation()} style={{ padding: '2.25rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--accent-blue-light, rgba(59, 130, 246, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.04em' }}>
                AI Discovery Clarification
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--foreground)', marginTop: '0.15rem' }}>
                {questionData.question}
              </h3>
            </div>
          </div>

          <button className="icon-button" onClick={onSkip} title="Skip and search anyway">
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
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
