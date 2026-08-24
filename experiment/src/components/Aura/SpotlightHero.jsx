import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Bookmark, 
  Clock 
} from 'lucide-react';

export default function SpotlightHero({
  opportunity,
  onSelect,
  isSaved,
  onToggleSave
}) {
  if (!opportunity) return null;

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
    description,
    trust_score = 99,
    match_score = 96,
    official_apply_url
  } = opportunity;

  const orgName = company || organization || 'Global Enterprise';
  const location = location_country ? (location_city ? `${location_city}, ${location_country}` : location_country) : 'Worldwide / Remote';

  return (
    <div 
      onClick={() => onSelect(opportunity)}
      className="aura-card spotlight"
      style={{ 
        cursor: 'pointer',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '2rem',
        alignItems: 'center'
      }}
    >
      {/* Left Column: Spotlight Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="aura-chip aura-chip-pink" style={{ fontSize: '0.74rem' }}>
            <Sparkles size={12} />
            <span>#1 Top AI Match of the Day</span>
          </span>
          <span className="aura-chip aura-chip-emerald" style={{ fontSize: '0.74rem' }}>
            <ShieldCheck size={12} />
            <span>Official Corporate Portal</span>
          </span>
        </div>

        <div>
          <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--aura-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
            <span>{orgName}</span>
            <span>•</span>
            <span style={{ color: 'var(--aura-text-tertiary)' }}>{location}</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {title}
          </h2>
        </div>

        <p style={{ fontSize: '0.86rem', color: 'var(--aura-text-secondary)', lineHeight: 1.55, maxWidth: '680px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description || 'High-caliber international opportunity with verified institutional sponsorship, career advancement mentorship, and competitive financial allowances.'}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
          {stipend_text && (
            <span className="aura-chip aura-chip-amber">
              <DollarSign size={12} />
              <span>{stipend_text}</span>
            </span>
          )}

          {no_ielts === 1 && (
            <span className="aura-chip aura-chip-emerald">
              <CheckCircle2 size={12} />
              <span>No IELTS Required</span>
            </span>
          )}

          <span className="aura-chip aura-chip-muted">
            <Clock size={12} />
            <span>Cutoff: {deadline_raw || deadline_utc || 'Rolling Admissions'}</span>
          </span>
        </div>
      </div>

      {/* Right Column: Match Meter & Action Buttons */}
      <div style={{ 
        background: 'rgba(10, 13, 20, 0.65)', 
        border: '1px solid var(--aura-border)', 
        borderRadius: 'var(--aura-radius-md)', 
        padding: '1.35rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--aura-text-tertiary)' }}>
            Candidate Profile Match
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--aura-emerald)', fontFamily: 'var(--font-mono)', lineHeight: 1.1, marginTop: '0.25rem' }}>
            {match_score}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--aura-emerald)', fontWeight: '700', marginTop: '0.2rem' }}>
            ✓ Exceptional Target Alignment
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(opportunity);
            }}
            className="aura-btn aura-btn-primary"
            style={{ flex: 1, padding: '0.62rem 1rem', fontSize: '0.84rem' }}
          >
            <span>Inspect Dossier</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(id);
            }}
            className="aura-btn-ghost aura-btn-icon"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--aura-radius-sm)',
              background: isSaved ? 'rgba(99, 102, 241, 0.15)' : 'var(--aura-surface-elevated)',
              color: isSaved ? 'var(--aura-primary)' : 'var(--aura-text-tertiary)',
              border: isSaved ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--aura-border)'
            }}
            title={isSaved ? 'Remove Bookmark' : 'Bookmark'}
          >
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}
