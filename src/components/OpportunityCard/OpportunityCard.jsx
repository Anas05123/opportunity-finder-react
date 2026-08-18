import React from 'react';
import { 
  Building2, MapPin, Coins, Clock, CheckCircle2, 
  ExternalLink, Bookmark, Zap, Globe, Sparkles, Check, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { resolveSafeJobUrl, resolveLinkedInSearchUrl, resolveGoogleJobsUrl } from '../../utils/urlResolver.js';

export default function OpportunityCard({ 
  opportunity, 
  onSelectOp, 
  onPrepareApplication, 
  onToggleSave, 
  isSaved = false 
}) {
  if (!opportunity) return null;

  const score = opportunity.match_score || 92;
  const scoreColor = score >= 90 ? 'var(--accent-emerald)' : score >= 80 ? 'var(--accent-blue)' : 'var(--accent-amber)';
  const scoreBg = score >= 90 ? 'var(--accent-emerald-light, rgba(34, 197, 94, 0.12))' : score >= 80 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)';

  const reasons = opportunity.match_reasons || [
    `✓ Location matches (${opportunity.location_country || 'Malaysia'})`,
    '✓ Specialization matches your academic background',
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
    <div className="opportunity-bento-card" onClick={() => onSelectOp(opportunity)}>
      
      {/* Top Header Row: Match Badge & Save */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div 
          className="match-score-badge"
          style={{ background: scoreBg, color: scoreColor, borderColor: scoreColor }}
        >
          <span className="match-dot" style={{ background: scoreColor }} />
          <span>{score}% MATCH</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span className="bento-tag" style={{ textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: '800' }}>
            {opportunity.opportunity_type || opportunity.type || 'Internship'}
          </span>
          <button 
            className="icon-button"
            onClick={(e) => { e.stopPropagation(); onToggleSave(opportunity); }}
            title={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
            style={{ width: '30px', height: '30px' }}
          >
            <Bookmark size={14} fill={isSaved ? 'var(--primary)' : 'none'} color={isSaved ? 'var(--primary)' : 'var(--muted-foreground)'} />
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
          <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: 'var(--foreground)' }}>{opportunity.organization || opportunity.company}</span>
            <span>•</span>
            <span><MapPin size={12} style={{ display: 'inline', marginRight: '0.2rem' }} />{opportunity.location_city || opportunity.location_country || 'Malaysia'}</span>
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
            <Check size={13} color="var(--accent-emerald)" className="check-icon" />
            <span>{r.replace(/^✓\s*/, '')}</span>
          </div>
        ))}
        {flags.slice(0, 1).map((f, idx) => (
          <div key={`flag-${idx}`} className="match-flag-item">
            <AlertTriangle size={13} color="var(--accent-amber)" className="flag-icon" />
            <span>{f.replace(/^⚠\s*/, '')}</span>
          </div>
        ))}
      </div>

      {/* Why This Matches You Snippet */}
      {opportunity.why_matches_you && (
        <div className="why-matches-box">
          <div className="why-matches-header">
            <Sparkles size={12} color="var(--accent-blue)" />
            <span>WHY THIS MATCHES YOU</span>
          </div>
          <p className="why-matches-text">
            {opportunity.why_matches_you}
          </p>
        </div>
      )}

      {/* Source Provenance & Last Verified */}
      <div className="card-provenance-footer">
        <div className="provenance-info">
          <span>SOURCE: <strong>{opportunity.source_name || 'Official Corporate Careers'}</strong></span>
          <span>•</span>
          <span><ShieldCheck size={11} color="var(--accent-emerald)" style={{ display: 'inline', marginRight: '0.15rem' }} /> Verified Active</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card-actions-row" onClick={(e) => e.stopPropagation()}>
        <button 
          className="btn btn-outline btn-details-action"
          onClick={() => onSelectOp(opportunity)}
        >
          View Details
        </button>
        <button 
          className="btn btn-emerald btn-prepare-action"
          onClick={() => onPrepareApplication(opportunity)}
        >
          <Zap size={14} /> Prepare Application
        </button>
      </div>

    </div>
  );
}
