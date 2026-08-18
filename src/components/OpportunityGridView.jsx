import React from 'react';
import { 
  Building2, MapPin, Coins, Clock, CheckCircle2, Bookmark, Zap, Mail, ChevronRight, ExternalLink
} from 'lucide-react';

export default function OpportunityGridView({ 
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
    <div className="bento-grid">
      {opportunities.map(op => {
        const isSaved = savedIds.includes(op.id);
        const isSelected = selectedOpId === op.id;
        const daysLeft = getDaysLeft(op.deadline_utc);
        const isAd = op.field_of_study === 'advertising';
        const isOfficial = op.verification_status === 'official_verified';
        const matchScore = calculateMatchScore ? calculateMatchScore(op) : 85;

        return (
          <div 
            key={op.id} 
            className={`bento-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectOp(op)}
          >
            <div>
              {/* Card Header: Institution & Trust */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="card-inst-avatar">
                    {getInitials(op.organization)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {op.organization}
                      {isOfficial && (
                        <CheckCircle2 size={14} color="var(--accent-emerald)" title="Official Verified Portal" />
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                      {op.location_country || 'Global'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'var(--muted)', color: 'var(--foreground)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
                    🎯 {matchScore}% Match
                  </span>
                  <button 
                    className="icon-button"
                    style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
                    onClick={() => onToggleSave(op)}
                    title={isSaved ? 'Remove from Board' : 'Save to Board'}
                  >
                    <Bookmark size={15} fill={isSaved ? 'var(--primary)' : 'none'} color={isSaved ? 'var(--primary)' : 'var(--muted-foreground)'} />
                  </button>
                </div>
              </div>

              {/* Opportunity Title */}
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', lineHeight: '1.35', color: 'var(--foreground)', marginBottom: '0.65rem' }}>
                {op.title}
              </h3>

              {/* Stipend Box */}
              <div className="bento-stipend-box">
                <Coins size={16} />
                <span>{op.stipend_text || '100% Fully Funded + Monthly Stipend'}</span>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.25rem' }}>
                <span className="bento-tag">
                  {op.type.toUpperCase()}
                </span>
                <span className="bento-tag">
                  {op.degree_level === 'undergrad' ? 'Bachelor' : op.degree_level}
                </span>
                {isAd && (
                  <span className="bento-tag" style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber)', fontWeight: '700', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                    📢 Advertising & Media
                  </span>
                )}
                {op.no_ielts && (
                  <span className="bento-tag" style={{ color: 'var(--accent-emerald)' }}>
                    ✓ No IELTS / Waiver
                  </span>
                )}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.15rem', borderTop: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
              <div className="tabular-nums" style={{ fontSize: '0.8rem', color: daysLeft < 15 ? 'var(--accent-amber)' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                <Clock size={13} /> {daysLeft < 0 ? 'Passed' : `${daysLeft} days remaining`}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-emerald" 
                  style={{ padding: '0.4rem 0.95rem', fontSize: '0.82rem' }}
                  onClick={() => onAutoApply(op)}
                >
                  <Zap size={13} /> Apply
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                  onClick={() => onSelectOp(op)}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
