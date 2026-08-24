import React from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Bookmark, 
  ExternalLink, 
  CheckCircle, 
  Clock 
} from 'lucide-react';

export default function TableView({
  opportunities = [],
  onSelect,
  savedIds = [],
  onToggleSave
}) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', margin: '16px', overflow: 'hidden' }}>
      <div className="custom-scroll" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '10px 14px' }}>Opportunity</th>
              <th style={{ padding: '10px 14px' }}>Organization</th>
              <th style={{ padding: '10px 14px' }}>Category</th>
              <th style={{ padding: '10px 14px' }}>Location</th>
              <th style={{ padding: '10px 14px' }}>Compensation</th>
              <th style={{ padding: '10px 14px' }}>Language</th>
              <th style={{ padding: '10px 14px' }}>Cutoff</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(opp => {
              const isSaved = savedIds.includes(opp.id);
              const orgName = opp.company || opp.organization || 'Corporate';
              const location = opp.location_country ? (opp.location_city ? `${opp.location_city}, ${opp.location_country}` : opp.location_country) : 'Remote';

              return (
                <tr
                  key={opp.id}
                  onClick={() => onSelect(opp)}
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {opp.title}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{orgName}</span>
                      <CheckCircle size={11} color="var(--success)" />
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="tag tag-blue" style={{ fontSize: '11px' }}>
                      {opp.opportunity_type || 'Internship'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{location}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {opp.stipend_text ? (
                      <span className="tag tag-amber" style={{ fontSize: '11px' }}>
                        {opp.stipend_text}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {opp.no_ielts === 1 ? (
                      <span className="tag tag-green" style={{ fontSize: '11px' }}>Waiver</span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>Standard</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {opp.deadline_raw || opp.deadline_utc || 'Rolling'}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(opp.id);
                        }}
                        className="btn-ghost btn-icon"
                        style={{ width: '26px', height: '26px', color: isSaved ? 'var(--primary)' : 'var(--text-tertiary)' }}
                        title={isSaved ? 'Remove Bookmark' : 'Save'}
                      >
                        <Bookmark size={13} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>

                      {opp.official_apply_url && (
                        <a
                          href={opp.official_apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-ghost btn-icon"
                          style={{ width: '26px', height: '26px' }}
                          title="Open Application"
                        >
                          <ExternalLink size={13} />
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
