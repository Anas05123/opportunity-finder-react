import React from 'react';
import OpportunityCard from './OpportunityCard/OpportunityCard.jsx';

export default function OpportunityGridView({ 
  opportunities = [], 
  onSelectOp, 
  onPrepareApplication, 
  onToggleSave, 
  savedIds = []
}) {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
        <p style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--foreground)', marginBottom: '0.35rem' }}>No matching opportunities found</p>
        <p style={{ fontSize: '0.86rem', color: 'var(--muted-foreground)' }}>Try broadening your search query or removing category filters.</p>
      </div>
    );
  }

  return (
    <div className="bento-grid">
      {opportunities.map(op => (
        <OpportunityCard
          key={op.id}
          opportunity={op}
          onSelectOp={onSelectOp}
          onPrepareApplication={onPrepareApplication}
          onToggleSave={onToggleSave}
          isSaved={savedIds.includes(op.id)}
        />
      ))}
    </div>
  );
}
