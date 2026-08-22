import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Building2, MapPin, ExternalLink, Zap, Mail, ArrowRight, X } from 'lucide-react';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  opportunities, 
  onSelectOp, 
  onAutoApply,
  onEmailOutreach,
  setActiveTab
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filtered = query.trim() === '' 
    ? opportunities.slice(0, 8) 
    : opportunities.filter(o => 
        o.title.toLowerCase().includes(query.toLowerCase()) ||
        o.organization.toLowerCase().includes(query.toLowerCase()) ||
        (o.field_of_study && o.field_of_study.toLowerCase().includes(query.toLowerCase())) ||
        (o.location_country && o.location_country.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 10);

  return (
    <div className="command-modal-backdrop" onClick={onClose}>
      <div className="command-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Search Input Box */}
        <div className="command-search-input-box">
          <Search size={18} color="var(--text-tertiary)" />
          <input 
            type="text" 
            placeholder="Search Chevening, Ogilvy, Google, MEXT, Advertising, DAAD..."
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="kbd-shortcut">ESC</span>
        </div>

        {/* Quick Jumps / Actions */}
        <div style={{ padding: '0.4rem 0.85rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '0.4rem', fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
          <span>Jump to:</span>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.74rem' }}
            onClick={() => { setActiveTab('tracker'); onClose(); }}
          >
            📋 Application CRM
          </button>
          <span>•</span>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.74rem' }}
            onClick={() => { setActiveTab('calendar'); onClose(); }}
          >
            📅 Deadlines
          </button>
          <span>•</span>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.74rem' }}
            onClick={() => { setActiveTab('admin'); onClose(); }}
          >
            ⚙️ Scraper Ops
          </button>
        </div>

        {/* Results List */}
        <div className="command-results-list">
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.86rem' }}>
              No matching programs found for "{query}".
            </div>
          ) : (
            filtered.map(op => (
              <div 
                key={op.id} 
                className="command-item"
                onClick={() => { onSelectOp(op); onClose(); }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-headings)', fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {op.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {op.organization} • {op.location_country || 'Global'} • <span style={{ color: 'var(--accent-emerald)' }}>{op.stipend_text || 'Fully Funded'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  <span className={`pill-tag pill-${op.type}`}>
                    {op.type}
                  </span>
                  <ArrowRight size={14} color="var(--text-tertiary)" />
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
