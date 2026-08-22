import React from 'react';
import { 
  Bookmark, 
  Clock, 
  Send, 
  MessageSquare, 
  Award, 
  ChevronRight, 
  Building2, 
  MapPin 
} from 'lucide-react';

const STAGES = [
  { id: 'saved', label: 'Saved Bookmarks', icon: Bookmark, color: 'var(--aura-primary)' },
  { id: 'preparing', label: 'Preparing Dossier', icon: Clock, color: 'var(--aura-amber)' },
  { id: 'applied', label: 'Submitted & Applied', icon: Send, color: 'var(--aura-cyan)' },
  { id: 'interview', label: 'Interview Stages', icon: MessageSquare, color: 'var(--aura-pink)' },
  { id: 'offer', label: 'Honors & Offers', icon: Award, color: 'var(--aura-emerald)' },
];

export default function AuraKanban({
  applications = [],
  onSelectOpportunity,
  onUpdateStage,
  opportunities = []
}) {
  const getStageOpps = (stageId) => {
    return applications
      .filter(app => (app.status || app.stage || 'saved').toLowerCase() === stageId)
      .map(app => {
        const fullOpp = opportunities.find(o => o.id === (app.opportunity_id || app.id));
        return {
          ...app,
          ...(fullOpp || {}),
          title: fullOpp?.title || app.title || 'Career Opportunity',
          company: fullOpp?.company || fullOpp?.organization || app.company || 'Enterprise'
        };
      });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(260px, 1fr))', gap: '1rem', height: '100%', overflowX: 'auto', paddingBottom: '1.5rem' }}>
      {STAGES.map((stage, idx) => {
        const stageOpps = getStageOpps(stage.id);
        const Icon = stage.icon;
        const nextStage = STAGES[idx + 1];

        return (
          <div
            key={stage.id}
            style={{
              background: 'var(--aura-surface)',
              border: '1px solid var(--aura-border)',
              borderRadius: 'var(--aura-radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '560px',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1rem 1.15rem', borderBottom: '1px solid var(--aura-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon size={16} color={stage.color} />
                <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#fff' }}>{stage.label}</span>
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--aura-text-tertiary)', background: 'var(--aura-surface-elevated)', padding: '2px 8px', borderRadius: 'var(--aura-radius-full)' }}>
                {stageOpps.length}
              </span>
            </div>

            {/* Stream */}
            <div className="custom-scroll" style={{ flex: 1, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
              {stageOpps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--aura-text-tertiary)', fontSize: '0.78rem' }}>
                  No opportunities in this stage.
                </div>
              ) : (
                stageOpps.map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => onSelectOpportunity(opp)}
                    className="aura-card"
                    style={{ padding: '0.85rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--aura-text-secondary)' }}>
                        {opp.company}
                      </span>
                      {opp.match_score && (
                        <span style={{ fontSize: '0.72rem', fontWeight: '900', color: 'var(--aura-emerald)' }}>
                          {opp.match_score}%
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', lineHeight: 1.3 }}>
                      {opp.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', paddingTop: '0.45rem', borderTop: '1px solid var(--aura-border)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--aura-text-tertiary)' }}>
                        {opp.deadline_raw || 'Open'}
                      </span>

                      {nextStage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStage(opp.id || opp.opportunity_id, nextStage.id);
                          }}
                          style={{
                            background: 'var(--aura-surface-elevated)',
                            border: '1px solid var(--aura-border)',
                            borderRadius: '4px',
                            color: 'var(--aura-text-secondary)',
                            padding: '3px 8px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>Advance</span>
                          <ChevronRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
