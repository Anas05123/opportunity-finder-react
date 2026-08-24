import React from 'react';
import { 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  LayoutGrid, 
  Table as TableIcon, 
  Columns3, 
  Globe, 
  Award, 
  Briefcase, 
  GraduationCap, 
  X,
  Zap
} from 'lucide-react';

export default function HorizonOmnibar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  viewMode,
  setViewMode,
  totalResults = 0,
  isSearching = false,
  aiStatus = { configured: true },
  onOpenAiLab
}) {
  const categoryPills = [
    { id: 'all', label: 'All Intelligence', icon: Sparkles },
    { id: 'internships', label: 'Internships', icon: Briefcase },
    { id: 'scholarships', label: 'Scholarships', icon: GraduationCap },
    { id: 'fellowships', label: 'Fellowships', icon: Award },
    { id: 'remote', label: 'Worldwide / Remote', icon: Globe },
  ];

  return (
    <header className="horizon-header">
      {/* 1. Global AI Search Omnibar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '620px' }}>
        <div className="hz-omnibar">
          <Search size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search opportunities or ask AI: 'Finance internships in Europe with stipend'..."
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Result Counter */}
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap', display: 'none', lg: 'block' }}>
          <span style={{ color: '#fff', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>{totalResults}</span> matches
        </div>
      </div>

      {/* 2. Category Quick Filters & View Switchers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        
        {/* Category Pills Strip */}
        <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', maxWidth: '420px' }}>
          {categoryPills.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isActive && cat.id !== 'all' ? 'all' : cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.42rem 0.8rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? '800' : '600',
                  background: isActive ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                  cursor: 'pointer',
                  transition: 'all var(--trans-fast)',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <Icon size={13} color={isActive ? '#fff' : 'currentColor'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Segmented Control */}
        <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
          <button 
            onClick={() => setViewMode('grid')}
            style={{
              width: '32px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--trans-fast)'
            }}
            title="Passport Grid View"
          >
            <LayoutGrid size={15} />
          </button>

          <button 
            onClick={() => setViewMode('table')}
            style={{
              width: '32px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--trans-fast)'
            }}
            title="Compact Table View"
          >
            <TableIcon size={15} />
          </button>

          <button 
            onClick={() => setViewMode('kanban')}
            style={{
              width: '32px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'kanban' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--trans-fast)'
            }}
            title="Kanban CRM Pipeline"
          >
            <Columns3 size={15} />
          </button>
        </div>

        {/* AI Copilot Quick Trigger */}
        <button 
          onClick={onOpenAiLab}
          className="hz-btn hz-btn-ai"
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem', borderRadius: 'var(--radius-full)' }}
          title="Open AI Career Lab"
        >
          <Zap size={14} />
          <span>AI Lab</span>
        </button>

      </div>
    </header>
  );
}
