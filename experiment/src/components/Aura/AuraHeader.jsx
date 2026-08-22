import React from 'react';
import { 
  Search, 
  Sparkles, 
  LayoutGrid, 
  Table as TableIcon, 
  Columns3, 
  Globe, 
  Award, 
  Briefcase, 
  GraduationCap, 
  X,
  Zap,
  SlidersHorizontal
} from 'lucide-react';

export default function AuraHeader({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  viewMode,
  setViewMode,
  totalResults = 0,
  onOpenAiLab
}) {
  const categoryFilters = [
    { id: 'all', label: 'All Opportunities', icon: Sparkles },
    { id: 'internships', label: 'Corporate & Tech', icon: Briefcase },
    { id: 'scholarships', label: 'Fully Funded Scholarships', icon: GraduationCap },
    { id: 'fellowships', label: 'Global Fellowships', icon: Award },
    { id: 'remote', label: 'Worldwide & Remote', icon: Globe },
  ];

  return (
    <header style={{
      height: '72px',
      borderBottom: '1px solid var(--aura-border)',
      background: 'rgba(10, 13, 20, 0.75)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      flexShrink: 0,
      zIndex: 40
    }}>
      {/* 1. Global AI Search Omnibar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, maxWidth: '640px' }}>
        <div className="aura-omnibar">
          <Search size={16} color="var(--aura-primary)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, global firms, scholarships, or ask AI: 'EU finance internships'..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--aura-text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.84rem', color: 'var(--aura-text-secondary)', fontWeight: '700', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#fff', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>{totalResults}</span> matches
        </div>
      </div>

      {/* 2. Quick Preset Filters & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        
        {/* Category Pills Strip */}
        <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflowX: 'auto', maxWidth: '440px' }}>
          {categoryFilters.map(cat => {
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
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--aura-radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? '800' : '600',
                  background: isActive ? 'var(--aura-primary)' : 'var(--aura-surface-elevated)',
                  color: isActive ? '#ffffff' : 'var(--aura-text-secondary)',
                  border: isActive ? '1px solid var(--aura-primary)' : '1px solid var(--aura-border)',
                  cursor: 'pointer',
                  transition: 'all var(--trans-fast)',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? 'var(--aura-shadow-sm)' : 'none'
                }}
              >
                <Icon size={13} color={isActive ? '#fff' : 'currentColor'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Segmented Control */}
        <div style={{ display: 'flex', background: 'var(--aura-surface-elevated)', padding: '3px', borderRadius: 'var(--aura-radius-md)', border: '1px solid var(--aura-border)' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              width: '34px',
              height: '32px',
              borderRadius: 'var(--aura-radius-sm)',
              background: viewMode === 'grid' ? 'var(--aura-primary)' : 'transparent',
              color: viewMode === 'grid' ? '#fff' : 'var(--aura-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--trans-fast)'
            }}
            title="Bento Grid"
          >
            <LayoutGrid size={15} />
          </button>

          <button
            onClick={() => setViewMode('table')}
            style={{
              width: '34px',
              height: '32px',
              borderRadius: 'var(--aura-radius-sm)',
              background: viewMode === 'table' ? 'var(--aura-primary)' : 'transparent',
              color: viewMode === 'table' ? '#fff' : 'var(--aura-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--trans-fast)'
            }}
            title="Data Table"
          >
            <TableIcon size={15} />
          </button>

          <button
            onClick={() => setViewMode('kanban')}
            style={{
              width: '34px',
              height: '32px',
              borderRadius: 'var(--aura-radius-sm)',
              background: viewMode === 'kanban' ? 'var(--aura-primary)' : 'transparent',
              color: viewMode === 'kanban' ? '#fff' : 'var(--aura-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--trans-fast)'
            }}
            title="CRM Kanban Pipeline"
          >
            <Columns3 size={15} />
          </button>
        </div>

        {/* AI Career Lab Launcher */}
        <button
          onClick={onOpenAiLab}
          className="aura-btn aura-btn-ai"
          style={{ padding: '0.48rem 1rem', fontSize: '0.82rem', borderRadius: 'var(--aura-radius-full)' }}
        >
          <Zap size={14} />
          <span>AI Lab</span>
        </button>

      </div>
    </header>
  );
}
