import React from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Bookmark, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';

export default function BentoCard({
  opportunity,
  onSelect,
  isSaved,
  onToggleSave
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
    match_score = 85
  } = opportunity;

  const orgName = company || organization || 'Global Enterprise';
  const location = location_country ? (location_city ? `${location_city}, ${location_country}` : location_country) : 'Worldwide / Remote';

  return (
    <div
      onClick={() => onSelect(opportunity)}
      className="aura-card"
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '230px'
      }}
    >
      <div>
        {/* Header: Company Avatar, Name, Trust & Save */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--aura-radius-md)',
              background: 'var(--aura-surface-elevated)',
              border: '1px solid var(--aura-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '1rem',
              color: 'var(--aura-primary)',
              flexShrink: 0
            }}>
              {orgName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--aura-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{orgName}</span>
                <ShieldCheck size={14} color="var(--aura-emerald)" />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--aura-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={11} />
                <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(id);
            }}
            className="aura-btn-ghost aura-btn-icon"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--aura-radius-full)',
              background: isSaved ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: isSaved ? 'var(--aura-primary)' : 'var(--aura-text-tertiary)',
              border: isSaved ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
            }}
            title={isSaved ? 'Remove Bookmark' : 'Bookmark Opportunity'}
          >
            <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Opportunity Title */}
        <h3 style={{
          fontSize: '1.02rem',
          fontWeight: '800',
          color: '#ffffff',
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
          marginBottom: '0.85rem'
        }}>
          {title}
        </h3>

        {/* Badges Strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <span className="aura-chip aura-chip-iris">
            <Building2 size={12} />
            <span>{opportunity_type || 'Internship'}</span>
          </span>

          {stipend_text && (
            <span className="aura-chip aura-chip-amber">
              <DollarSign size={12} />
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stipend_text}</span>
            </span>
          )}

          {no_ielts === 1 && (
            <span className="aura-chip aura-chip-emerald">
              <CheckCircle2 size={12} />
              <span>No IELTS</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer: Match Breakdown & Deadline */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.85rem',
        borderTop: '1px solid var(--aura-border)',
        marginTop: '1rem'
      }}>
        {/* Match Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{
            fontSize: '0.76rem',
            fontWeight: '900',
            color: (match_score || 85) >= 80 ? 'var(--aura-emerald)' : 'var(--aura-primary)',
            fontFamily: 'var(--font-mono)'
          }}>
            {match_score || 85}% Match
          </span>
        </div>

        {/* Deadline & Peek Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--aura-text-tertiary)' }}>
          <Clock size={12} />
          <span>{deadline_raw || deadline_utc || 'Open'}</span>
          <ArrowUpRight size={14} color="var(--aura-text-secondary)" style={{ marginLeft: '4px' }} />
        </div>
      </div>
    </div>
  );
}
