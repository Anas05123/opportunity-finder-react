import React from 'react';
import { 
  Building2, MapPin, Coins, Clock, CheckCircle2, 
  Bookmark, Zap, ShieldCheck, ExternalLink 
} from 'lucide-react';

export default function OpportunityListView({ 
  opportunities = [], 
  selectedOpId, 
  onSelectOp, 
  onToggleSave, 
  savedIds = [], 
  onAutoApply,
  onEmailOutreach
}) {
  const getDaysLeft = (deadlineStr) => {
    if (!deadlineStr) return 90;
    const diff = new Date(deadlineStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getInitials = (name) => {
    if (!name) return 'OP';
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (!opportunities || opportunities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
        <p style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No opportunities found</p>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Try broadening your search or switching categories.</p>
      </div>
    );
  }

  return (
    <div className="table-bento-container">
      <div style={{ overflowX: 'auto' }}>
        <table className="shadcn-table">
          <thead>
            <tr>
              <th style={{ minWidth: '240px' }}>Opportunity & Organization</th>
              <th style={{ minWidth: '110px' }}>Type</th>
              <th style={{ minWidth: '140px' }}>Field</th>
              <th style={{ minWidth: '160px' }}>Compensation</th>
              <th style={{ minWidth: '110px' }}>Deadline</th>
              <th style={{ minWidth: '130px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(op => {
              const isSaved = savedIds.includes(op.id);
              const daysLeft = getDaysLeft(op.deadline_utc);
              const isOfficial = op.verification_status === 'official_verified';

              return (
                <tr 
                  key={op.id} 
                  className="table-row-hover"
                  onClick={() => onSelectOp(op)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div className="card-inst-avatar" style={{ width: '38px', height: '38px', fontSize: '0.85rem' }}>
                        {getInitials(op.organization || op.company)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {op.title}
                          {isOfficial && (
                            <CheckCircle2 size={13} color="var(--accent-emerald)" title="Official Verified Source" />
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {op.organization || op.company} • {op.location_city || op.location_country || 'Malaysia'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="bento-tag" style={{ textTransform: 'uppercase' }}>
                      {op.opportunity_type || op.type || 'Internship'}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: '600' }}>
                      {op.field_of_study || 'General'}
                    </span>
                  </td>

                  <td>
                    <div style={{ color: 'var(--accent-emerald)', fontWeight: '700', fontSize: '0.86rem' }}>
                      {op.stipend_text || 'Competitive Stipend'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {op.no_ielts ? '✓ English Waiver' : 'IELTS Accepted'}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.82rem', color: daysLeft < 15 ? 'var(--accent-amber)' : 'var(--text-secondary)', fontWeight: '700' }}>
                      {daysLeft < 0 ? 'Closed' : `${daysLeft}d left`}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {op.deadline_utc}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                      <button 
                        className="btn btn-emerald"
                        style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.78rem' }}
                        onClick={() => onAutoApply(op)}
                        title="Prepare Application Kit"
                      >
                        <Zap size={12} /> Prepare
                      </button>
                      <button 
                        className="icon-button"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => onToggleSave(op)}
                        title={isSaved ? 'Remove from Saved' : 'Save to CRM'}
                      >
                        <Bookmark size={13} fill={isSaved ? 'var(--primary)' : 'none'} color={isSaved ? 'var(--primary)' : 'var(--text-muted)'} />
                      </button>
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
