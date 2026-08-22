import React from 'react';
import OpportunityCard from './OpportunityCard/OpportunityCard.jsx';
import { Filter, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, SlidersHorizontal } from 'lucide-react';

export default function OpportunityGridView({ 
  opportunities = [], 
  funnelMetrics = null,
  relaxationOptions = [],
  onSelectOp, 
  onPrepareApplication, 
  onToggleSave, 
  onInspectEvidence,
  onRelaxConstraint,
  savedIds = []
}) {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div style={{ padding: '2.5rem 1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-2xl)', maxWidth: '780px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: 'var(--accent-amber-subtle)', color: 'var(--accent-amber)', marginBottom: '0.75rem' }}>
            <Filter size={24} />
          </div>
          <h3 className="type-h3" style={{ fontSize: '1.25rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            0 Verified Opportunities Passed Hard Constraints
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
            Zero-Fabrication Guarantee: We strictly enforce your constraints and will never generate synthetic or non-compliant placeholders.
          </p>
        </div>

        {/* Pipeline Funnel Metrics Breakdown */}
        {funnelMetrics && (
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={13} color="var(--primary)" /> Transparent Ingestion Funnel
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{funnelMetrics.total_discovered ?? 0}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Discovered</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>{funnelMetrics.active_verified ?? 0}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Active & Verified</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-amber)' }}>{funnelMetrics.passed_hard_filter ?? 0}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Passed Hard Filter</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>0</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Final Returned</div>
              </div>
            </div>
          </div>
        )}

        {/* Relaxation Options if available */}
        {relaxationOptions && relaxationOptions.length > 0 && (
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <SlidersHorizontal size={13} color="var(--accent-amber)" /> Suggested Constraint Relaxations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {relaxationOptions.map((opt, idx) => (
                <button
                  key={opt.id || idx}
                  onClick={() => onRelaxConstraint && onRelaxConstraint(opt)}
                  className="btn btn-outline"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: '700', fontSize: '0.78rem' }}>
                    Relax Constraint <ArrowRight size={13} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="bento-grid">
      {opportunities.map((op, idx) => (
        <OpportunityCard
          key={op.id}
          opportunity={op}
          index={idx}
          onSelectOp={onSelectOp}
          onPrepareApplication={onPrepareApplication}
          onToggleSave={onToggleSave}
          onInspectEvidence={onInspectEvidence}
          isSaved={savedIds.includes(op.id)}
        />
      ))}
    </div>
  );
}
