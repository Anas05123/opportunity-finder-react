import React from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  Bookmark, 
  Clock 
} from 'lucide-react';

export default function OpportunityList({
  opportunities = [],
  selectedId,
  onSelect,
  savedIds = [],
  onToggleSave
}) {
  if (opportunities.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <p style={{ fontSize: '13px' }}>No opportunities match the current query criteria.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {opportunities.map(opp => {
        const isSelected = selectedId === opp.id;
        const isSaved = savedIds.includes(opp.id);
        const orgName = opp.company || opp.organization || 'Corporate Registry';
        const location = opp.location_country ? (opp.location_city ? `${opp.location_city}, ${opp.location_country}` : opp.location_country) : 'Worldwide / Remote';

        return (
          <div
            key={opp.id}
            onClick={() => onSelect(opp)}
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-default)',
              background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
              borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'background var(--transition-fast)'
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface)'; }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Header: Org & Save */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {orgName}
                </span>
                <CheckCircle size={12} color="var(--success)" title="Verified Official Portal" style={{ flexShrink: 0 }} />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(opp.id);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isSaved ? 'var(--primary)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex'
                }}
                title={isSaved ? 'Remove Bookmark' : 'Save'}
              >
                <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Title */}
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.35 }}>
              {opp.title}
            </div>

            {/* Metadata Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
              <span className="tag tag-blue">
                {opp.opportunity_type || 'Internship'}
              </span>

              <span className="tag tag-neutral">
                <MapPin size={10} />
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
              </span>

              {opp.stipend_text && (
                <span className="tag tag-amber">
                  <DollarSign size={10} />
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.stipend_text}</span>
                </span>
              )}

              {opp.no_ielts === 1 && (
                <span className="tag tag-green">
                  No IELTS
                </span>
              )}
            </div>

            {/* Footer Deadline */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} />
                <span>Cutoff: {opp.deadline_raw || opp.deadline_utc || 'Rolling Admissions'}</span>
              </div>

              {opp.match_score && (
                <span style={{ fontWeight: '600', color: opp.match_score >= 80 ? 'var(--success)' : 'var(--primary)' }}>
                  {opp.match_score}% Match
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
