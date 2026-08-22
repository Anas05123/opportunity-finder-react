import React from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Bookmark, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Clock,
  ArrowRight
} from 'lucide-react';

export default function HorizonPassportCard({
  opportunity,
  isSelected,
  onSelect,
  isSaved,
  onToggleSave,
  onApplyDirect
}) {
  const {
    id,
    title,
    organization,
    company,
    opportunity_type,
    location_country,
    location_city,
    stipend_text,
    deadline_raw,
    deadline_utc,
    no_ielts,
    trust_score = 98,
    match_score = 85,
    official_apply_url
  } = opportunity;

  const orgName = company || organization || 'Global Enterprise';
  const location = location_country ? (location_city ? `${location_city}, ${location_country}` : location_country) : 'Worldwide / Remote';

  return (
    <div 
      onClick={onSelect}
      className={`hz-card hz-passport ${isSelected ? 'selected' : ''}`}
      style={{ cursor: 'pointer' }}
    >
      {/* Header: Company Avatar, Org Name, Verified Authority Badge & Save Icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--bg-surface-elevated)', 
            border: '1px solid var(--border-default)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '1rem',
            color: 'var(--primary)',
            flexShrink: 0
          }}>
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>{orgName}</span>
              <ShieldCheck size={14} color="var(--emerald)" title="Verified Official Source" />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              Trust Score: <span style={{ color: 'var(--emerald)', fontWeight: '700' }}>{trust_score}%</span>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(id);
          }}
          className="hz-btn-ghost hz-btn-icon"
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: 'var(--radius-full)', 
            background: isSaved ? 'var(--primary-subtle)' : 'transparent',
            color: isSaved ? 'var(--primary)' : 'var(--text-tertiary)',
            border: isSaved ? '1px solid var(--primary-border)' : '1px solid transparent'
          }}
          title={isSaved ? 'Remove from Saved' : 'Save Opportunity'}
        >
          <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Opportunity Title */}
      <h3 style={{ 
        fontSize: '1.02rem', 
        fontWeight: '800', 
        color: '#ffffff', 
        lineHeight: 1.35,
        letterSpacing: '-0.01em'
      }}>
        {title}
      </h3>

      {/* Badges & Metadata Strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <div className="hz-chip hz-chip-iris">
          <Building2 size={12} />
          <span>{opportunity_type || 'Internship'}</span>
        </div>

        <div className="hz-chip hz-chip-muted">
          <MapPin size={12} />
          <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
        </div>

        {stipend_text && (
          <div className="hz-chip hz-chip-amber">
            <DollarSign size={12} />
            <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stipend_text}</span>
          </div>
        )}

        {no_ielts === 1 && (
          <div className="hz-chip hz-chip-emerald">
            <CheckCircle2 size={12} />
            <span>No IELTS</span>
          </div>
        )}
      </div>

      {/* Footer: Match Score Bar & Action Arrow */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingTop: '0.75rem', 
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '0.25rem' 
      }}>
        {/* Match Breakdown Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '26px', 
            height: '26px', 
            borderRadius: 'var(--radius-full)', 
            background: match_score >= 80 ? 'var(--emerald-subtle)' : 'var(--primary-subtle)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '0.74rem',
            fontWeight: '800',
            color: match_score >= 80 ? 'var(--emerald)' : 'var(--primary)'
          }}>
            {match_score}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Candidate Match
          </div>
        </div>

        {/* Deadline Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
          <Clock size={12} />
          <span>{deadline_raw || deadline_utc || 'Open'}</span>
        </div>
      </div>
    </div>
  );
}
