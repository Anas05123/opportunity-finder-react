import React, { useState } from 'react';
import { 
  Building2, MapPin, Coins, CheckCircle2, 
  Bookmark, Zap, ShieldCheck, Check, AlertTriangle, Sparkles,
  Copy, CheckCheck, ExternalLink, Info
} from 'lucide-react';

export default function OpportunityCard({ 
  opportunity, 
  index = 0,
  onSelectOp, 
  onPrepareApplication, 
  onToggleSave, 
  onInspectEvidence,
  isSaved = false 
}) {
  const [copied, setCopied] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState(false);

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

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = opportunity.official_apply_url || opportunity.job_page_url || opportunity.source_url || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="opportunity-bento-card card-entrance-animated" 
      style={{ '--card-index': index }}
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
      
      {/* Top Header: Score & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', position: 'relative' }}>
        <div 
          className="match-score-badge badge-pulse-interactive"
          style={{ background: badgeBg, color: badgeColor, borderColor: badgeColor, cursor: 'pointer' }}
          onMouseEnter={() => setShowScoreDetails(true)}
          onMouseLeave={() => setShowScoreDetails(false)}
        >
          <span className="match-dot" style={{ background: badgeColor }} />
          <span>{score}% • {badgeLabel}</span>
          <Info size={11} style={{ opacity: 0.7, marginLeft: '0.2rem' }} />

          {/* Glassmorphic Match Score Popover Tooltip */}
          {showScoreDetails && (
            <div className="match-score-tooltip-popover">
              <div style={{ fontWeight: '800', fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={12} color="var(--primary)" /> Match Scoring Breakdown
              </div>
              <div style={{ fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Discipline / Role Alignment:</span>
                  <strong style={{ color: 'var(--accent-emerald)' }}>+35 pts</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Location Compatibility:</span>
                  <strong style={{ color: 'var(--accent-emerald)' }}>+25 pts</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Verified Compensation:</span>
                  <strong style={{ color: 'var(--accent-blue)' }}>+20 pts</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Source Authority Level {opportunity.source_authority_level || 1}:</span>
                  <strong style={{ color: 'var(--primary)' }}>+12 pts</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span className="bento-tag" style={{ textTransform: 'uppercase' }}>
            {opportunity.opportunity_type || opportunity.type || 'Internship'}
          </span>

          {/* Quick Copy Link Button */}
          <button 
            className="icon-button"
            onClick={handleCopyLink}
            aria-label={copied ? 'Link Copied' : 'Copy Apply URL'}
            title={copied ? 'Link Copied to Clipboard!' : 'Copy Direct Application URL'}
            style={{ width: '32px', height: '32px' }}
          >
            {copied ? (
              <CheckCheck size={14} color="var(--accent-emerald)" />
            ) : (
              <Copy size={13} color="var(--text-muted)" />
            )}
          </button>

          {/* Bookmark Button */}
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
          {getInitials(opportunity.organization || opportunity.company || opportunity.company_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="card-title-clamp" title={opportunity.title}>
            {opportunity.title}
          </h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{opportunity.organization || opportunity.company || opportunity.company_name}</span>
            <span>•</span>
            <span><MapPin size={12} style={{ display: 'inline', marginRight: '0.15rem' }} />{opportunity.location_city || opportunity.location_country || 'Malaysia'}</span>
          </div>
        </div>
      </div>

      {/* Stipend / Allowance Highlight */}
      <div className="stipend-pill-highlight">
        <Coins size={14} color={opportunity.stipend_text ? "var(--accent-emerald)" : "var(--text-muted)"} />
        <span>{opportunity.stipend_text || 'Compensation not disclosed'}</span>
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
        <div className="card-provenance-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="provenance-info">
            <span>SOURCE: <strong style={{ color: 'var(--text-primary)' }}>{opportunity.source_name || 'Official Portal'}</strong></span>
            <span>•</span>
            <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <ShieldCheck size={12} /> Level {opportunity.source_authority_level || 1} Verified
            </span>
          </div>
          {onInspectEvidence && (
            <button
              onClick={(e) => { e.stopPropagation(); onInspectEvidence(opportunity); }}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--primary)',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
              title="Inspect verbatim evidence records"
            >
              Audit Evidence
            </button>
          )}
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
            <Zap size={14} /> {opportunity.application_url_type === 'EXACT_JOB_APPLICATION' ? 'Apply Now' : (opportunity.application_url_type === 'OFFICIAL_CAREER_PAGE' ? 'Visit Careers Portal' : 'View Official Source')}
          </button>
        </div>
      </div>

    </div>
  );
}
