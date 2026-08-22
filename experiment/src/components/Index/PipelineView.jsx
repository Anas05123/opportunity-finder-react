import React from 'react';
import { 
  Bookmark, 
  Clock, 
  Send, 
  MessageSquare, 
  Award, 
  ChevronRight, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';

const STAGES = [
  { id: 'saved', label: 'Saved Items', icon: Bookmark },
  { id: 'preparing', label: 'Preparing', icon: Clock },
  { id: 'applied', label: 'Applied', icon: Send },
  { id: 'interview', label: 'Interview', icon: MessageSquare },
  { id: 'offer', label: 'Offer Received', icon: Award },
];

export default function PipelineView({
  applications = [],
  opportunities = [],
  onSelectOpportunity,
  onUpdateStage
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
          company: fullOpp?.company || fullOpp?.organization || app.company || 'Corporate'
        };
      });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(240px, 1fr))', gap: '12px', height: '100%', overflowX: 'auto', padding: '16px' }}>
      {STAGES.map((stage, idx) => {
        const items = getStageOpps(stage.id);
        const Icon = stage.icon;
        const nextStage = STAGES[idx + 1];

        return (
          <div
            key={stage.id}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '520px',
              overflow: 'hidden'
            }}
          >
            {/* Stage Column Header */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={14} color="var(--primary)" />
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{stage.label}</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', background: 'var(--bg-surface-subtle)', padding: '1px 6px', borderRadius: 'var(--radius-xs)' }}>
                {items.length}
              </span>
            </div>

            {/* Stage Items Stream */}
            <div className="custom-scroll" style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                  No applications in this stage.
                </div>
              ) : (
                items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelectOpportunity(item)}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {item.company}
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {item.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      <span>{item.deadline_raw || 'Open'}</span>

                      {nextStage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStage(item.id || item.opportunity_id, nextStage.id);
                          }}
                          style={{
                            background: 'var(--bg-surface-subtle)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--text-secondary)',
                            padding: '2px 6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <span>{nextStage.label}</span>
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
