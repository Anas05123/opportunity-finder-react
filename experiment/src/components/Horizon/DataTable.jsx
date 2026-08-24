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

export default function HorizonDataTable({
  opportunities = [],
  selectedId,
  onSelect,
  savedIds = [],
  onToggleSave
}) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div className="custom-scroll" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-tertiary)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Opportunity & Organization</th>
              <th style={{ padding: '0.85rem 1rem' }}>Category</th>
              <th style={{ padding: '0.85rem 1rem' }}>Location</th>
              <th style={{ padding: '0.85rem 1rem' }}>Stipend / Award</th>
              <th style={{ padding: '0.85rem 1rem' }}>Match</th>
              <th style={{ padding: '0.85rem 1rem' }}>Deadline</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(opp => {
              const isSelected = selectedId === opp.id;
              const isSaved = savedIds.includes(opp.id);
              const orgName = opp.company || opp.organization || 'Global Enterprise';
              const location = opp.location_country ? (opp.location_city ? `${opp.location_city}, ${opp.location_country}` : opp.location_country) : 'Remote';

              return (
                <tr
                  key={opp.id}
                  onClick={() => onSelect(opp)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background var(--trans-fast)'
                  }}
                  className="table-row-hover"
                >
                  {/* Title & Org */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '800', color: isSelected ? 'var(--primary)' : '#fff', marginBottom: '0.2rem' }}>
                      {opp.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{orgName}</span>
                      <ShieldCheck size={12} color="var(--emerald)" />
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="hz-chip hz-chip-iris" style={{ fontSize: '0.72rem' }}>
                      {opp.opportunity_type || 'Internship'}
                    </span>
                  </td>

                  {/* Location */}
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={13} color="var(--text-tertiary)" />
                      <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
                    </div>
                  </td>

                  {/* Stipend */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {opp.stipend_text ? (
                      <span className="hz-chip hz-chip-amber" style={{ fontSize: '0.72rem' }}>
                        {opp.stipend_text}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>

                  {/* Match Score */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ 
                      fontWeight: '800', 
                      color: (opp.match_score || 85) >= 80 ? 'var(--emerald)' : 'var(--primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {opp.match_score || 85}%
                    </span>
                  </td>

                  {/* Deadline */}
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    {opp.deadline_raw || opp.deadline_utc || 'Rolling'}
                  </td>

                  {/* Action Icons */}
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(opp.id);
                        }}
                        className="hz-btn-ghost hz-btn-icon"
                        style={{ width: '28px', height: '28px', color: isSaved ? 'var(--primary)' : 'var(--text-tertiary)' }}
                        title={isSaved ? 'Remove from Saved' : 'Save'}
                      >
                        <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>

                      {opp.official_apply_url && (
                        <a
                          href={opp.official_apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hz-btn-ghost hz-btn-icon"
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
