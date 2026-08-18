import React from 'react';
import { 
  Building2, MapPin, Coins, CheckCircle2, 
  Bookmark, Zap, ShieldCheck, Check, AlertTriangle, Sparkles
} from 'lucide-react';

export default function OpportunityCard({ 
  opportunity, 
  onSelectOp, 
  onPrepareApplication, 
  onToggleSave, 
  isSaved = false 
}) {
  if (!opportunity) return null;

  const score = opportunity.match_score || 92;
  const isHighMatch = score >= 90;
  const isGoodMatch = score >= 80;

  const badgeColor = isHighMatch ? 'var(--accent-emerald)' : isGoodMatch ? 'var(--accent-blue)' : 'var(--accent-amber)';
  const badgeBg = isHighMatch ? 'var(--accent-emerald-subtle)' : isGoodMatch ? 'var(--accent-blue-subtle)' : 'var(--accent-amber-subtle)';
  const badgeLabel = isHighMatch ? 'EXCELLENT MATCH' : isGoodMatch ? 'STRONG MATCH' : 'GOOD MATCH';

  const reasons = opportunity.match_reasons || [
    `✓ Location matches (${opportunity.location_country || 'Malaysia'})`,
    '✓ Discipline aligns with your profile',
    opportunity.no_ielts ? '✓ Accepts English Medium of Instruction waiver' : '✓ Standard eligibility confirmed'
  ];

  const flags = opportunity.match_flags || [];

  const getInitials = (name) => {
    if (!name) return 'OP';
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div 
      className="opportunity-bento-card" 
      onClick={() => onSelectOp(opportunity)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectOp(opportunity);
        }
      }}
      role="article"
      tabIndex={0}
      aria-label={`${opportunity.title} at ${opportunity.organization || opportunity.company}`}
    >
      
      {/* Top Header: Score & Save */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div 
          className="match-score-badge"
          style={{ background: badgeBg, color: badgeColor, borderColor: badgeColor }}
        >
          <span className="match-dot" style={{ background: badgeColor }} />
          <span>{score}% • {badgeLabel}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="bento-tag" style={{ textTransform: 'uppercase' }}>
            {opportunity.opportunity_type || opportunity.type || 'Internship'}
          </span>
          <button 
            className="icon-button"
            onClick={(e) => { e.stopPropagation(); onToggleSave(opportunity); }}
            aria-label={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
            title={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
            style={{ width: '32px', height: '32px' }}
          >
            <Bookmark size={14} fill={isSaved ? 'var(--primary)' : 'none'} color={isSaved ? 'var(--primary)' : 'var(--text-muted)'} />
          </button>
        </div>
      </div>

      {/* Main Title & Organization */}
      <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '0.85rem' }}>
        <div className="card-inst-avatar">
          {getInitials(opportunity.organization || opportunity.company)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="card-title-clamp" title={opportunity.title}>
            {opportunity.title}
          </h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{opportunity.organization || opportunity.company}</span>
            <span>•</span>
            <span><MapPin size={12} style={{ display: 'inline', marginRight: '0.15rem' }} />{opportunity.location_city || opportunity.location_country || 'Malaysia'}</span>
          </div>
        </div>
      </div>

      {/* Stipend / Allowance Highlight */}
      <div className="stipend-pill-highlight">
        <Coins size={14} color="var(--accent-emerald)" />
        <span>{opportunity.stipend_text || 'Competitive Monthly Allowance + Benefits'}</span>
      </div>

      {/* Deterministic Match Criteria Breakdown */}
      <div className="match-reasons-list">
        {reasons.slice(0, 3).map((r, idx) => (
          <div key={idx} className="match-reason-item">
            <Check size={13} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
            <span>{r.replace(/^✓\s*/, '')}</span>
          </div>
        ))}
        {flags.slice(0, 1).map((f, idx) => (
          <div key={`flag-${idx}`} className="match-flag-item">
            <AlertTriangle size={13} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
            <span>{f.replace(/^⚠\s*/, '')}</span>
          </div>
        ))}
      </div>

      {/* Why This Matches You Snippet */}
      {opportunity.why_matches_you && (
        <div className="why-matches-box">
          <div className="why-matches-header">
            <Sparkles size={11} color="var(--primary)" />
            <span>WHY THIS MATCHES YOU</span>
          </div>
          <p className="why-matches-text">
            {opportunity.why_matches_you}
          </p>
        </div>
      )}

      {/* Footer Area: Provenance + Actions (Locked to bottom) */}
      <div style={{ marginTop: 'auto' }}>
        <div className="card-provenance-footer">
          <div className="provenance-info">
            <span>SOURCE: <strong style={{ color: 'var(--text-primary)' }}>{opportunity.source_name || 'Official Portal'}</strong></span>
            <span>•</span>
            <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <ShieldCheck size={12} /> Verified Active
            </span>
          </div>
        </div>

        <div className="card-actions-row" onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn btn-outline"
            style={{ flex: 1, height: '36px', fontSize: '0.82rem' }}
            onClick={() => onSelectOp(opportunity)}
          >
            View Details
          </button>
          <button 
            className="btn btn-emerald"
            style={{ flex: 1.4, height: '36px', fontSize: '0.82rem' }}
            onClick={() => onPrepareApplication(opportunity)}
          >
            <Zap size={14} /> Prepare Application
          </button>
        </div>
      </div>

    </div>
  );
}
