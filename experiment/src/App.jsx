import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useLocation 
} from 'react-router-dom';

import HorizonSidebar from './components/Horizon/Sidebar';
import HorizonOmnibar from './components/Horizon/Omnibar';
import HorizonPassportCard from './components/Horizon/PassportCard';
import HorizonInspectorStudio from './components/Horizon/InspectorStudio';
import HorizonKanbanPipeline from './components/Horizon/KanbanPipeline';
import HorizonDataTable from './components/Horizon/DataTable';
import HorizonAiLabModal from './components/Horizon/AiLabModal';
import HorizonSecurityOps from './components/Horizon/SecurityOps';

import UserProfileModal from './components/UserProfileModal';

import { API_BASE_URL } from './config/api';
import { 
  RefreshCw, 
  Sparkles, 
  Search, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Globe,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';

export default function App() {
  return (
    <Router>
      <HorizonAppRoot />
    </Router>
  );
}

function HorizonAppRoot() {
  const navigate = useNavigate();
  const location = useLocation();

  // Core App State
  const [activeView, setActiveView] = useState('explore'); // 'explore' | 'saved' | 'applications' | 'ai-lab' | 'calendar' | 'security'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'kanban'

  // Data State
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals & User State
  const [isAiLabOpen, setIsAiLabOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load User & Token from Storage
  useEffect(() => {
    const storedToken = localStorage.getItem('careerly_token') || sessionStorage.getItem('careerly_token');
    const storedUser = localStorage.getItem('careerly_user');
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);

  // Fetch Live Opportunities
  useEffect(() => {
    const fetchOpportunities = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/opportunities`);
        const data = await res.json();
        const opps = Array.isArray(data) ? data : (data.opportunities || []);
        setOpportunities(opps);
        if (opps.length > 0 && !selectedOpportunity) {
          setSelectedOpportunity(opps[0]);
        }
      } catch (err) {
        console.error('[Horizon] Failed to fetch opportunities:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // Fetch Saved & Applications if authenticated
  useEffect(() => {
    if (!token) return;

    const fetchUserData = async () => {
      try {
        // Fetch Saved
        const savedRes = await fetch(`${API_BASE_URL}/user/saved`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          const items = Array.isArray(savedData) ? savedData : (savedData.saved || []);
          setSavedOpportunityIds(items.map(s => s.opportunity_id || s.id));
        }

        // Fetch Applications
        const appRes = await fetch(`${API_BASE_URL}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (appRes.ok) {
          const appData = await appRes.json();
          const apps = Array.isArray(appData) ? appData : (appData.applications || []);
          setApplications(apps);
        }
      } catch (e) {
        console.warn('[Horizon] User data sync notice:', e.message);
      }
    };

    fetchUserData();
  }, [token]);

  // Toggle Save Opportunity
  const handleToggleSave = async (oppId) => {
    const isCurrentlySaved = savedOpportunityIds.includes(oppId);
    
    // Optimistic Update
    if (isCurrentlySaved) {
      setSavedOpportunityIds(prev => prev.filter(id => id !== oppId));
    } else {
      setSavedOpportunityIds(prev => [...prev, oppId]);
    }

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/user/saved/${oppId}`, {
          method: isCurrentlySaved ? 'DELETE' : 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
    }
  };

  // Update CRM Application Stage
  const handleUpdateStage = async (oppId, newStage) => {
    // Update state
    setApplications(prev => {
      const existing = prev.find(a => (a.opportunity_id || a.id) === oppId);
      if (existing) {
        return prev.map(a => (a.opportunity_id || a.id) === oppId ? { ...a, stage: newStage, status: newStage } : a);
      } else {
        const opp = opportunities.find(o => o.id === oppId);
        return [...prev, { id: `app-${Date.now()}`, opportunity_id: oppId, stage: newStage, status: newStage, ...(opp || {}) }];
      }
    });

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/applications`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ opportunity_id: oppId, stage: newStage, status: newStage })
        });
      } catch (e) {}
    }
  };

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    let result = opportunities;

    // View filter
    if (activeView === 'saved') {
      result = result.filter(o => savedOpportunityIds.includes(o.id));
    }

    // Category filter
    if (selectedCategory === 'internships') {
      result = result.filter(o => (o.opportunity_type || '').toLowerCase().includes('intern') || (o.title || '').toLowerCase().includes('intern'));
    } else if (selectedCategory === 'scholarships') {
      result = result.filter(o => (o.opportunity_type || '').toLowerCase().includes('scholar') || (o.title || '').toLowerCase().includes('scholar'));
    } else if (selectedCategory === 'fellowships') {
      result = result.filter(o => (o.opportunity_type || '').toLowerCase().includes('fellow') || (o.title || '').toLowerCase().includes('fellow') || (o.opportunity_type || '').toLowerCase().includes('grant'));
    } else if (selectedCategory === 'remote') {
      result = result.filter(o => o.is_remote === 1 || (o.location_country || '').toLowerCase().includes('remote') || (o.location_country || '').toLowerCase().includes('world'));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        (o.title || '').toLowerCase().includes(q) ||
        (o.company || o.organization || '').toLowerCase().includes(q) ||
        (o.location_country || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [opportunities, activeView, selectedCategory, searchQuery, savedOpportunityIds]);

  const handleLogout = () => {
    localStorage.removeItem('careerly_token');
    localStorage.removeItem('careerly_user');
    sessionStorage.removeItem('careerly_token');
    setToken(null);
    setUser(null);
  };

  return (
    <div className="horizon-app">
      {/* 1. Global Navigation Rail */}
      <HorizonSidebar
        activeView={activeView}
        setActiveView={(v) => {
          if (v === 'ai-lab') {
            setIsAiLabOpen(true);
          } else {
            setActiveView(v);
          }
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        savedCount={savedOpportunityIds.length}
        appliedCount={applications.length}
        user={user}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Execution Area */}
      <main className="horizon-main">
        {/* Top Omnibar */}
        <HorizonOmnibar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalResults={filteredOpportunities.length}
          onOpenAiLab={() => setIsAiLabOpen(true)}
        />

        {/* Content Area */}
        <div className="horizon-content-area">
          
          {/* VIEW: SECURITY OPERATIONS */}
          {activeView === 'security' ? (
            <div style={{ padding: '1.5rem 2rem', height: '100%' }}>
              <HorizonSecurityOps />
            </div>
          ) : activeView === 'calendar' ? (
            /* VIEW: DEADLINES TIMELINE */
            <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }} className="custom-scroll">
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', marginBottom: '0.5rem' }}>Upcoming Application Deadlines</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '1.5rem' }}>Chronological roadmap of all upcoming opportunity cutoffs.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredOpportunities.slice(0, 15).map(opp => (
                    <div 
                      key={opp.id} 
                      onClick={() => { setSelectedOpportunity(opp); setActiveView('explore'); }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '1rem 1.25rem', 
                        background: 'var(--bg-surface-elevated)', 
                        border: '1px solid var(--border-default)', 
                        borderRadius: 'var(--radius-md)', 
                        cursor: 'pointer' 
                      }}
                      className="hz-card-hover"
                    >
                      <div>
                        <div style={{ fontWeight: '800', color: '#fff' }}>{opp.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{opp.company || opp.organization}</div>
                      </div>
                      <span className="hz-chip hz-chip-amber">
                        {opp.deadline_raw || opp.deadline_utc || 'Rolling Admissions'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : viewMode === 'kanban' || activeView === 'applications' ? (
            /* VIEW: KANBAN CRM PIPELINE */
            <div style={{ padding: '1.5rem', height: '100%' }}>
              <HorizonKanbanPipeline
                applications={applications}
                opportunities={opportunities}
                onSelectOpportunity={(opp) => {
                  setSelectedOpportunity(opp);
                  setViewMode('grid');
                  setActiveView('explore');
                }}
                onUpdateStage={handleUpdateStage}
              />
            </div>
          ) : (
            /* DUAL-PANE HORIZON WORKSPACE */
            <div className={`horizon-workspace ${!selectedOpportunity ? 'single-pane' : ''}`}>
              
              {/* Left Pane: Match Stream / Table */}
              <div className="horizon-stream-pane custom-scroll">
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={36} className="spin-slow" color="var(--primary)" style={{ margin: '0 auto 1.25rem' }} />
                    <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '800' }}>Calibrating Global Intelligence Stream...</h3>
                    <p style={{ fontSize: '0.84rem', marginTop: '0.35rem' }}>Syncing verified opportunity records from official corporate portals.</p>
                  </div>
                ) : viewMode === 'table' ? (
                  <HorizonDataTable
                    opportunities={filteredOpportunities}
                    selectedId={selectedOpportunity?.id}
                    onSelect={(opp) => setSelectedOpportunity(opp)}
                    savedIds={savedOpportunityIds}
                    onToggleSave={handleToggleSave}
                  />
                ) : filteredOpportunities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-tertiary)' }}>
                    <Search size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '800' }}>No Matching Opportunities Found</h3>
                    <p style={{ fontSize: '0.84rem', marginTop: '0.35rem' }}>Try clearing filters or broadening your search keywords.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.15rem' }}>
                    {filteredOpportunities.map(opp => (
                      <HorizonPassportCard
                        key={opp.id}
                        opportunity={opp}
                        isSelected={selectedOpportunity?.id === opp.id}
                        onSelect={() => setSelectedOpportunity(opp)}
                        isSaved={savedOpportunityIds.includes(opp.id)}
                        onToggleSave={handleToggleSave}
                        onApplyDirect={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Pane: Inspector Studio */}
              {selectedOpportunity && (
                <div className="horizon-inspector-pane">
                  <HorizonInspectorStudio
                    opportunity={selectedOpportunity}
                    onClose={() => setSelectedOpportunity(null)}
                    isSaved={savedOpportunityIds.includes(selectedOpportunity.id)}
                    onToggleSave={handleToggleSave}
                    onUpdateStage={handleUpdateStage}
                    currentStage={applications.find(a => (a.opportunity_id || a.id) === selectedOpportunity.id)?.stage}
                    onOpenCvStudio={() => setIsAiLabOpen(true)}
                  />
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* AI Career Lab Modal */}
      <HorizonAiLabModal
        isOpen={isAiLabOpen}
        onClose={() => setIsAiLabOpen(false)}
        userProfile={user}
      />

      {/* User Profile Modal */}
      {isProfileOpen && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onSaveProfile={(updated) => setUser(updated)}
        />
      )}
    </div>
  );
}
