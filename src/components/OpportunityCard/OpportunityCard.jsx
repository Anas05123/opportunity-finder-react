import React, { useState } from 'react';
import { 
  Building2, MapPin, Coins, CheckCircle2, 
  Bookmark, Zap, ShieldCheck, Check, AlertTriangle,
  Copy, CheckCheck, ExternalLink, Sparkles, Clock, ArrowUpRight
} from 'lucide-react';

import { cleanStipendText, cleanHtmlText } from '../../utils/formatUtils.js';

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

  if (!opportunity) return null;

  const displayStipend = cleanStipendText(opportunity.stipend_text || opportunity.stipend);
  const hasStipend = displayStipend !== 'Compensation not disclosed';
  const cleanTitle = cleanHtmlText(opportunity.title);
  const cleanCompany = cleanHtmlText(opportunity.organization || opportunity.company || opportunity.company_name || 'Enterprise Employer');

  const score = opportunity.match_score || 92;
  const isHighMatch = score >= 90;
  const isGoodMatch = score >= 80;

  const matchColor = isHighMatch ? 'var(--accent-emerald, #10b981)' : isGoodMatch ? 'var(--primary, #6366f1)' : '#f59e0b';
  const matchBg = isHighMatch ? 'rgba(16, 185, 129, 0.1)' : isGoodMatch ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)';

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
      className="saas-card-item"
      onClick={() => onSelectOp && onSelectOp(opportunity)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onSelectOp) onSelectOp(opportunity);
        }
      }}
      role="article"
      tabIndex={0}
      aria-label={`${cleanTitle} at ${cleanCompany}`}
    >
      
      {/* Top Header: Organization & Actions */}
      <div className="saas-card-header">
        <div className="saas-card-org">
          <div className="saas-card-avatar">
            {getInitials(cleanCompany)}
          </div>
          <div className="saas-card-org-meta">
            <span className="saas-card-company">{cleanCompany}</span>
            <span className="saas-card-location">
              <MapPin size={11} />
              {opportunity.location_city || opportunity.location_country || 'Worldwide'}
            </span>
          </div>
        </div>

        <div className="saas-card-top-actions" onClick={(e) => e.stopPropagation()}>
          <button 
            className="saas-card-icon-btn"
            onClick={handleCopyLink}
            aria-label={copied ? 'Link Copied' : 'Copy Apply URL'}
            title={copied ? 'Link Copied to Clipboard!' : 'Copy Direct Application URL'}
          >
            {copied ? <CheckCheck size={13} color="var(--accent-emerald, #10b981)" /> : <Copy size={13} />}
          </button>

          {onToggleSave && (
            <button 
              className={`saas-card-icon-btn ${isSaved ? 'is-saved' : ''}`}
              onClick={() => onToggleSave(opportunity.id || opportunity.opportunity_id)}
              aria-label={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
              title={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
            >
              <Bookmark 
                size={13} 
                fill={isSaved ? 'var(--primary)' : 'none'} 
                color={isSaved ? 'var(--primary)' : 'currentColor'} 
              />
            </button>
          )}
        </div>
      </div>

      {/* Role Title */}
      <h3 className="saas-card-title" title={cleanTitle}>
        {cleanTitle}
      </h3>

      {/* Tags Row */}
      <div className="saas-card-tags">
        <span className="saas-tag">
          {opportunity.opportunity_type || opportunity.type || 'Opportunity'}
        </span>

        {hasStipend && (
          <span className="saas-tag saas-tag-stipend">
            <Coins size={11} />
            {displayStipend}
          </span>
        )}

        {opportunity.no_ielts ? (
          <span className="saas-tag saas-tag-waiver">
            English Waiver
          </span>
        ) : null}
      </div>

      {/* Key Match Alignment Reason */}
      <div className="saas-card-match-preview">
        <div className="saas-match-score-pill" style={{ background: matchBg, color: matchColor }}>
          <span className="saas-match-dot" style={{ background: matchColor }} />
          <span>{score}% Match</span>
        </div>
        <span className="saas-match-reason-text">
          {opportunity.discipline || opportunity.field_of_study || 'Aligned with target profile'}
        </span>
      </div>

      {/* Card Footer Actions */}
      <div className="saas-card-footer" onClick={(e) => e.stopPropagation()}>
        <button 
          className="saas-btn-details"
          onClick={() => onSelectOp && onSelectOp(opportunity)}
        >
          <span>View Details</span>
          <ArrowUpRight size={13} />
        </button>

        <button 
          className="saas-btn-prep"
          onClick={() => onPrepareApplication && onPrepareApplication(opportunity)}
        >
          <Zap size={13} />
          <span>Prep Kit</span>
        </button>
      </div>

    </div>
  );
}
