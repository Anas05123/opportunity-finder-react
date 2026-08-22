import React from 'react';
import { 
  Bookmark, 
  Clock, 
  Send, 
  MessageSquare, 
  Award, 
  ChevronRight, 
  Building2, 
  ExternalLink,
  Plus
} from 'lucide-react';

const STAGES = [
  { id: 'saved', label: 'Saved & Bookmarked', icon: Bookmark, color: 'var(--primary)', bg: 'var(--primary-subtle)' },
  { id: 'preparing', label: 'Preparing Dossier', icon: Clock, color: 'var(--amber)', bg: 'var(--amber-subtle)' },
  { id: 'applied', label: 'Applied & Submitted', icon: Send, color: 'var(--cyan)', bg: 'var(--cyan-subtle)' },
  { id: 'interview', label: 'Interviewing', icon: MessageSquare, color: 'var(--pink)', bg: 'var(--pink-subtle)' },
  { id: 'offer', label: 'Offers & Honors', icon: Award, color: 'var(--emerald)', bg: 'var(--emerald-subtle)' },
];

export default function HorizonKanbanPipeline({
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(260px, 1fr))', gap: '1rem', height: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
      {STAGES.map((stage, idx) => {
        const stageOpps = getStageOpps(stage.id);
        const Icon = stage.icon;
        const nextStage = STAGES[idx + 1];

        return (
          <div 
            key={stage.id}
            style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border-default)', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              minHeight: '520px',
              overflow: 'hidden'
            }}
          >
            {/* Stage Header */}
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: 'var(--radius-sm)', background: stage.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={stage.color} />
                </div>
                <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#fff' }}>{stage.label}</span>
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-tertiary)', background: 'var(--bg-surface-elevated)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                {stageOpps.length}
              </span>
            </div>

            {/* Stage Cards Stream */}
            <div className="custom-scroll" style={{ flex: 1, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto' }}>
              {stageOpps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>
                  No opportunities in this stage yet.
                </div>
              ) : (
                stageOpps.map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => onSelectOpportunity(opp)}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all var(--trans-fast)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                    className="hz-card-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                        {opp.company}
                      </span>
                      {opp.match_score && (
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--emerald)' }}>
                          {opp.match_score}%
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#fff', lineHeight: 1.3 }}>
                      {opp.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', paddingTop: '0.45rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        {opp.deadline_raw || 'Open'}
                      </span>

                      {nextStage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStage(opp.id || opp.opportunity_id, nextStage.id);
                          }}
                          style={{
                            background: 'var(--bg-surface-overlay)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                            padding: '2px 6px',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title={`Move to ${nextStage.label}`}
                        >
                          <span>Next</span>
                          <ChevronRight size={10} />
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
