import React from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Columns, 
  Table, 
  Layers, 
  Check 
} from 'lucide-react';

export default function Topbar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  noIeltsOnly,
  setNoIeltsOnly,
  viewMode,
  setViewMode,
  totalCount = 0
}) {
  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'internships', label: 'Internships' },
    { id: 'scholarships', label: 'Scholarships' },
    { id: 'fellowships', label: 'Fellowships' },
    { id: 'remote', label: 'Remote / Global' },
  ];

  return (
    <header className="app-topbar">
      {/* 1. Direct Search Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '420px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '32px', paddingRight: searchQuery ? '28px' : '10px', height: '34px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by role, organization, country, or skill..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Functional Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Category Select */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', height: '34px', padding: '0 10px', cursor: 'pointer' }}
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        {/* No IELTS Toggle */}
        <button
          onClick={() => setNoIeltsOnly(!noIeltsOnly)}
          className="btn"
          style={{
            height: '34px',
            background: noIeltsOnly ? 'var(--success-subtle)' : 'var(--bg-surface-elevated)',
            color: noIeltsOnly ? 'var(--success)' : 'var(--text-secondary)',
            border: noIeltsOnly ? '1px solid var(--success-border)' : '1px solid var(--border-default)',
            fontSize: '12px'
          }}
        >
          {noIeltsOnly && <Check size={12} />}
          <span>English Waiver</span>
        </button>

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border-default)', margin: '0 4px' }} />

        {/* View Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '2px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-default)' }}>
          <button
            onClick={() => setViewMode('split')}
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-xs)',
              background: viewMode === 'split' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'split' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '500'
            }}
            title="Split Inspector View"
          >
            <Columns size={13} />
            <span>Split</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-xs)',
              background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '500'
            }}
            title="Table View"
          >
            <Table size={13} />
            <span>Table</span>
          </button>

          <button
            onClick={() => setViewMode('pipeline')}
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-xs)',
              background: viewMode === 'pipeline' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'pipeline' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '500'
            }}
            title="Kanban Pipeline"
          >
            <Layers size={13} />
            <span>Pipeline</span>
          </button>
        </div>

        {/* Count */}
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalCount}</span> items
        </div>

      </div>
    </header>
  );
}
