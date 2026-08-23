import React, { useState } from 'react';
import { 
  Building2, MapPin, Coins, CheckCircle2, 
  Bookmark, Zap, ShieldCheck, Check, AlertTriangle,
  Copy, CheckCheck, ExternalLink, Sparkles, Clock, ArrowUpRight
} from 'lucide-react';

import MatchRing from '../ui/MatchRing';
import { cleanStipendText, cleanHtmlText } from '../../utils/formatUtils.js';
import { sanitizeUrl } from '../../utils/sanitizeUrl.js';

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

  const getInitials = (name) => {
    if (!name) return 'OP';
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const rawUrl = opportunity.official_apply_url || opportunity.job_page_url || opportunity.source_url || window.location.href;
    const url = sanitizeUrl(rawUrl, window.location.href);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="card-editorial"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        position: 'relative'
      }}
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary-ice)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '13px',
            fontFamily: 'var(--careerly-font-display)',
            flexShrink: 0,
            border: '1px solid var(--color-primary-soft)'
          }}>
            {getInitials(cleanCompany)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {cleanCompany}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={10} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {opportunity.location_city || opportunity.location_country || 'Worldwide'}
              </span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
          <button 
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={handleCopyLink}
            aria-label={copied ? 'Link Copied' : 'Copy Apply URL'}
            title={copied ? 'Link Copied to Clipboard!' : 'Copy Direct Application URL'}
          >
            {copied ? <CheckCheck size={13} color="var(--color-success)" /> : <Copy size={13} />}
          </button>

          {onToggleSave && (
            <button 
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-xs)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isSaved ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => onToggleSave(opportunity.id || opportunity.opportunity_id)}
              aria-label={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
              title={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
            >
              <Bookmark 
                size={14} 
                fill={isSaved ? 'currentColor' : 'none'} 
              />
            </button>
          )}
        </div>
      </div>

      {/* Role Title */}
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)', lineHeight: 1.35, minHeight: '40px' }} title={cleanTitle}>
        {cleanTitle}
      </h3>

      {/* Tags Row */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <span className="tag-badge tag-badge-blue">
          {opportunity.opportunity_type || opportunity.type || 'Opportunity'}
        </span>

        {hasStipend && (
          <span className="tag-badge tag-badge-amber">
            <Coins size={10} />
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayStipend}
            </span>
          </span>
        )}

        {opportunity.no_ielts === 1 && (
          <span className="tag-badge tag-badge-emerald">
            English Waiver
          </span>
        )}
      </div>

      {/* Card Footer: Match Score Ring & Action CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--color-paper-border)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MatchRing score={score} size={36} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
            Match Fit
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn-secondary-white"
            style={{ padding: '5px 10px', fontSize: '11.5px', borderRadius: 'var(--radius-xs)' }}
            onClick={() => onSelectOp && onSelectOp(opportunity)}
          >
            <span>Inspect</span>
            <ArrowUpRight size={12} />
          </button>

          {onPrepareApplication && (
            <button 
              className="btn-primary-blue"
              style={{ padding: '5px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-xs)' }}
              onClick={() => onPrepareApplication(opportunity)}
            >
              <Zap size={12} />
              <span>Prep Kit</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
