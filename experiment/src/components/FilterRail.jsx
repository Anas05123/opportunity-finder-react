import React from 'react';
import { 
  Compass, CheckSquare, Calendar, ShieldCheck, User, 
  Megaphone, Sparkles, Filter, RefreshCw, SlidersHorizontal, Award, Layers
} from 'lucide-react';

export default function FilterRail({ 
  activeTab, 
  setActiveTab, 
  savedCount, 
  fieldFilter, 
  setFieldFilter, 
  typeFilter, 
  setTypeFilter, 
  levelFilter, 
  setLevelFilter, 
  onResetFilters,
  onOpenProfile,
  userProfile
}) {
  return (
    <aside className="sidebar-rail">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge" onClick={() => { setActiveTab('explore'); onResetFilters(); }}>
          <div className="brand-icon">
            <Compass size={16} />
          </div>
          <span className="brand-title">Opportunity<span style={{ color: 'var(--accent-primary)' }}>Hub</span></span>
        </div>
      </div>

      {/* Main App Navigation */}
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          <div className="nav-item-left">
            <Compass size={15} />
            <span>Directory Feed</span>
          </div>
        </button>

        <button 
          className={`nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          <div className="nav-item-left">
            <CheckSquare size={15} />
            <span>Application Board</span>
          </div>
          <span className="badge-counter">{savedCount}</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <div className="nav-item-left">
            <Calendar size={15} />
            <span>Deadlines</span>
          </div>
        </button>

        <button 
          className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <div className="nav-item-left">
            <ShieldCheck size={15} />
            <span>Scraper Ops</span>
          </div>
          <span className="badge-counter" style={{ color: 'var(--accent-emerald)' }}>48+</span>
        </button>
      </nav>

      {/* Faceted Filter Rail */}
      <div className="sidebar-filters">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0 0.4rem' }}>
          <span className="filter-section-title" style={{ margin: 0, padding: 0 }}>Filters</span>
          <button 
            onClick={onResetFilters} 
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.74rem', cursor: 'pointer', fontWeight: '600' }}
          >
            Reset
          </button>
        </div>

        {/* Specialization Filter */}
        <div className="filter-section-title">Specialization</div>
        <div className="filter-chip-group">
          <button 
            className={`filter-row-btn ${fieldFilter === 'all' ? 'active' : ''}`}
            onClick={() => setFieldFilter('all')}
          >
            <span>All Disciplines</span>
          </button>
          <button 
            className={`filter-row-btn ${fieldFilter === 'advertising' ? 'ad-active' : ''}`}
            onClick={() => setFieldFilter('advertising')}
          >
            <span>📢 Advertising & PR</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: '700' }}>Focus</span>
          </button>
          <button 
            className={`filter-row-btn ${fieldFilter === 'stem' ? 'active' : ''}`}
            onClick={() => setFieldFilter('stem')}
          >
            <span>💻 Tech & STEM</span>
          </button>
          <button 
            className={`filter-row-btn ${fieldFilter === 'business' ? 'active' : ''}`}
            onClick={() => setFieldFilter('business')}
          >
            <span>📊 Business & Mgmt</span>
          </button>
        </div>

        {/* Program Type Filter */}
        <div className="filter-section-title">Program Type</div>
        <div className="filter-chip-group">
          <button 
            className={`filter-row-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            <span>All Types</span>
          </button>
          <button 
            className={`filter-row-btn ${typeFilter === 'scholarship' ? 'active' : ''}`}
            onClick={() => setTypeFilter('scholarship')}
          >
            <span>🎓 100% Scholarships</span>
          </button>
          <button 
            className={`filter-row-btn ${typeFilter === 'internship' ? 'active' : ''}`}
            onClick={() => setTypeFilter('internship')}
          >
            <span>💼 Paid Internships</span>
          </button>
          <button 
            className={`filter-row-btn ${typeFilter === 'fellowship' ? 'active' : ''}`}
            onClick={() => setTypeFilter('fellowship')}
          >
            <span>🔬 Fellowships</span>
          </button>
        </div>

        {/* Education Level Selector */}
        <div className="filter-section-title">Education Level</div>
        <select 
          className="select-compact" 
          style={{ width: '100%', marginBottom: '1.25rem' }}
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="all">All Education Levels</option>
          <option value="undergrad">Undergraduate (Bachelor)</option>
          <option value="masters">Master's Degree</option>
          <option value="phd">PhD / Doctorate</option>
        </select>

        {/* User Profile Quick Card */}
        <div 
          onClick={onOpenProfile}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            cursor: 'pointer',
            marginTop: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem' }}>
              {userProfile?.name?.charAt(0) || 'A'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-headings)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userProfile?.name || 'Anas'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                {userProfile?.major || 'Advertising'} • GPA {userProfile?.gpa || '3.85'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
