import React from 'react';
import { 
  Building2, MapPin, Coins, Clock, CheckCircle2, Bookmark, Zap, Mail, ChevronRight, ExternalLink
} from 'lucide-react';

export default function OpportunityListView({ 
  opportunities, 
  selectedOpId, 
  onSelectOp, 
  onToggleSave, 
  savedIds = [], 
  onAutoApply,
  onEmailOutreach,
  calculateMatchScore
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

  return (
    <div className="table-bento-container">
      <table className="shadcn-table">
        <thead>
          <tr>
            <th style={{ width: '42%' }}>Opportunity & Host</th>
            <th style={{ width: '12%' }}>Type</th>
            <th style={{ width: '15%' }}>Discipline</th>
            <th style={{ width: '18%' }}>Funding & Benefits</th>
            <th style={{ width: '13%' }}>Deadline</th>
            <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map(op => {
            const isSaved = savedIds.includes(op.id);
            const isSelected = selectedOpId === op.id;
            const daysLeft = getDaysLeft(op.deadline_utc);
            const isAd = op.field_of_study === 'advertising';
            const isOfficial = op.verification_status === 'official_verified';

            return (
              <tr 
                key={op.id} 
                className={`table-row-hover ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectOp(op)}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div className="card-inst-avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
                      {getInitials(op.organization)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: 'var(--foreground)', fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {op.title}
                        {isOfficial && (
                          <CheckCircle2 size={14} color="var(--accent-emerald)" title="Official Verified Source" />
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
                        {op.organization} • {op.location_country || 'Global'}
                      </div>
                    </div>
                  </div>
                </td>

                <td>
                  <span className="bento-tag">
                    {op.type.toUpperCase()}
                  </span>
                </td>

                <td>
                  {isAd ? (
                    <span className="bento-tag" style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber)', fontWeight: '700' }}>
                      📢 Advertising
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.84rem', color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>
                      {op.field_of_study || 'General'}
                    </span>
                  )}
                </td>

                <td>
                  <div style={{ color: 'var(--accent-emerald)', fontWeight: '700', fontSize: '0.88rem' }}>
                    {op.stipend_text || 'Fully Funded'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {op.no_ielts ? '✓ English Waiver' : 'IELTS Required'}
                  </div>
                </td>

                <td>
                  <div className="tabular-nums" style={{ fontSize: '0.84rem', color: daysLeft < 15 ? 'var(--accent-amber)' : 'var(--muted-foreground)', fontWeight: '600' }}>
                    {daysLeft < 0 ? 'Passed' : `${daysLeft}d left`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-subtle)' }}>
                    {op.deadline_utc}
                  </div>
                </td>

                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                    <button 
                      className="btn btn-emerald"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => onAutoApply(op)}
                      title="1-Click Auto Apply"
                    >
                      <Zap size={12} /> Apply
                    </button>
                    <button 
                      className="icon-button"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => onToggleSave(op)}
                      title={isSaved ? 'Remove from Board' : 'Save to CRM'}
                    >
                      <Bookmark size={14} fill={isSaved ? 'var(--primary)' : 'none'} color={isSaved ? 'var(--primary)' : 'var(--muted-foreground)'} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
