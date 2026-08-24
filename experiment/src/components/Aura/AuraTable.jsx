import React from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Bookmark, 
  ExternalLink, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

export default function AuraTable({
  opportunities = [],
  onSelect,
  savedIds = [],
  onToggleSave
}) {
  return (
    <div style={{ background: 'var(--aura-surface)', border: '1px solid var(--aura-border)', borderRadius: 'var(--aura-radius-lg)', overflow: 'hidden' }}>
      <div className="custom-scroll" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: 'var(--aura-surface-elevated)', borderBottom: '1px solid var(--aura-border)', color: 'var(--aura-text-tertiary)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <th style={{ padding: '0.95rem 1.15rem' }}>Opportunity & Organization</th>
              <th style={{ padding: '0.95rem 1.15rem' }}>Category</th>
              <th style={{ padding: '0.95rem 1.15rem' }}>Location</th>
              <th style={{ padding: '0.95rem 1.15rem' }}>Stipend / Award</th>
              <th style={{ padding: '0.95rem 1.15rem' }}>Match</th>
              <th style={{ padding: '0.95rem 1.15rem' }}>Deadline</th>
              <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(opp => {
              const isSaved = savedIds.includes(opp.id);
              const orgName = opp.company || opp.organization || 'Global Enterprise';
              const location = opp.location_country ? (opp.location_city ? `${opp.location_city}, ${opp.location_country}` : opp.location_country) : 'Remote';

              return (
                <tr
                  key={opp.id}
                  onClick={() => onSelect(opp)}
                  style={{
                    borderBottom: '1px solid var(--aura-border)',
                    cursor: 'pointer',
                    transition: 'background var(--trans-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--aura-surface-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Title & Org */}
                  <td style={{ padding: '0.95rem 1.15rem' }}>
                    <div style={{ fontWeight: '800', color: '#fff', marginBottom: '0.2rem' }}>
                      {opp.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--aura-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{orgName}</span>
                      <ShieldCheck size={13} color="var(--aura-emerald)" />
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '0.95rem 1.15rem' }}>
                    <span className="aura-chip aura-chip-iris" style={{ fontSize: '0.72rem' }}>
                      {opp.opportunity_type || 'Internship'}
                    </span>
                  </td>

                  {/* Location */}
                  <td style={{ padding: '0.95rem 1.15rem', color: 'var(--aura-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={13} color="var(--aura-text-tertiary)" />
                      <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
                    </div>
                  </td>

                  {/* Stipend */}
                  <td style={{ padding: '0.95rem 1.15rem' }}>
                    {opp.stipend_text ? (
                      <span className="aura-chip aura-chip-amber" style={{ fontSize: '0.72rem' }}>
                        {opp.stipend_text}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--aura-text-tertiary)' }}>—</span>
                    )}
                  </td>

                  {/* Match Score */}
                  <td style={{ padding: '0.95rem 1.15rem' }}>
                    <span style={{
                      fontWeight: '900',
                      color: (opp.match_score || 85) >= 80 ? 'var(--aura-emerald)' : 'var(--aura-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {opp.match_score || 85}%
                    </span>
                  </td>

                  {/* Deadline */}
                  <td style={{ padding: '0.95rem 1.15rem', color: 'var(--aura-text-secondary)', fontSize: '0.78rem' }}>
                    {opp.deadline_raw || opp.deadline_utc || 'Rolling'}
                  </td>

                  {/* Action Icons */}
                  <td style={{ padding: '0.95rem 1.15rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(opp.id);
                        }}
                        className="aura-btn-ghost aura-btn-icon"
                        style={{ width: '28px', height: '28px', color: isSaved ? 'var(--aura-primary)' : 'var(--aura-text-tertiary)' }}
                        title={isSaved ? 'Remove Bookmark' : 'Bookmark'}
                      >
                        <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>

                      {opp.official_apply_url && (
                        <a
                          href={opp.official_apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="aura-btn-ghost aura-btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          title="Open Application"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
