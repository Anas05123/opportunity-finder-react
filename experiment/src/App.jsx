import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrowserRouter as Router 
} from 'react-router-dom';

import AuraSidebar from './components/Aura/AuraSidebar';
import AuraHeader from './components/Aura/AuraHeader';
import SpotlightHero from './components/Aura/SpotlightHero';
import BentoCard from './components/Aura/BentoCard';
import AuraDrawer from './components/Aura/AuraDrawer';
import AuraKanban from './components/Aura/AuraKanban';
import AuraTable from './components/Aura/AuraTable';
import AuraAiModal from './components/Aura/AuraAiModal';
import AuraSecurity from './components/Aura/AuraSecurity';

import UserProfileModal from './components/UserProfileModal';
import { API_BASE_URL } from './config/api';

import { 
  RefreshCw, 
  Search, 
  Sparkles, 
  Clock, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function App() {
  return (
    <Router>
      <AuraAppRoot />
    </Router>
  );
}

function AuraAppRoot() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'saved' | 'applications' | 'calendar' | 'security'
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

  // Fetch Opportunities from backend API
  useEffect(() => {
    const fetchOpportunities = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/opportunities`);
        const data = await res.json();
        const opps = Array.isArray(data) ? data : (data.opportunities || []);
        setOpportunities(opps);
      } catch (err) {
        console.error('[Aura] Failed to fetch opportunities:', err);
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
        // Saved
        const savedRes = await fetch(`${API_BASE_URL}/user/saved`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          const items = Array.isArray(savedData) ? savedData : (savedData.saved || []);
          setSavedOpportunityIds(items.map(s => s.opportunity_id || s.id));
        }

        // Applications
        const appRes = await fetch(`${API_BASE_URL}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (appRes.ok) {
          const appData = await appRes.json();
          const apps = Array.isArray(appData) ? appData : (appData.applications || []);
          setApplications(apps);
        }
      } catch (e) {
        console.warn('[Aura] User data sync notice:', e.message);
      }
    };

    fetchUserData();
  }, [token]);

  // Toggle Bookmark
  const handleToggleSave = async (oppId) => {
    const isCurrentlySaved = savedOpportunityIds.includes(oppId);
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

    if (activeTab === 'saved') {
      result = result.filter(o => savedOpportunityIds.includes(o.id));
    }

    if (selectedCategory === 'internships') {
      result = result.filter(o => (o.opportunity_type || '').toLowerCase().includes('intern') || (o.title || '').toLowerCase().includes('intern'));
    } else if (selectedCategory === 'scholarships') {
      result = result.filter(o => (o.opportunity_type || '').toLowerCase().includes('scholar') || (o.title || '').toLowerCase().includes('scholar'));
    } else if (selectedCategory === 'fellowships') {
      result = result.filter(o => (o.opportunity_type || '').toLowerCase().includes('fellow') || (o.title || '').toLowerCase().includes('fellow') || (o.opportunity_type || '').toLowerCase().includes('grant'));
    } else if (selectedCategory === 'remote') {
      result = result.filter(o => o.is_remote === 1 || (o.location_country || '').toLowerCase().includes('remote') || (o.location_country || '').toLowerCase().includes('world'));
    }

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
  }, [opportunities, activeTab, selectedCategory, searchQuery, savedOpportunityIds]);

  const spotlightOpportunity = filteredOpportunities.length > 0 ? filteredOpportunities[0] : null;
  const standardOpportunities = filteredOpportunities.length > 0 ? filteredOpportunities.slice(1) : [];

  const handleLogout = () => {
    localStorage.removeItem('careerly_token');
    localStorage.removeItem('careerly_user');
    sessionStorage.removeItem('careerly_token');
    setToken(null);
    setUser(null);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      
      {/* 1. Global Navigation Dock */}
      <AuraSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        savedCount={savedOpportunityIds.length}
        appliedCount={applications.length}
        user={user}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAiLab={() => setIsAiLabOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Workspace Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        
        {/* Top Floating Omnibar */}
        <AuraHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalResults={filteredOpportunities.length}
          onOpenAiLab={() => setIsAiLabOpen(true)}
        />

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="custom-scroll">
          
          {/* VIEW: SECURITY OPERATIONS */}
          {activeTab === 'security' ? (
            <div style={{ padding: '2rem', height: '100%' }}>
              <AuraSecurity />
            </div>
          ) : activeTab === 'calendar' ? (
            /* VIEW: DEADLINES TIMELINE */
            <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
              <div className="aura-card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#fff', marginBottom: '0.45rem' }}>Upcoming Application Roadmaps</h2>
                <p style={{ color: 'var(--aura-text-secondary)', fontSize: '0.86rem', marginBottom: '1.75rem' }}>Chronological roadmap of official opportunity cutoffs.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {filteredOpportunities.slice(0, 15).map(opp => (
                    <div
                      key={opp.id}
                      onClick={() => setSelectedOpportunity(opp)}
                      className="aura-card"
                      style={{ padding: '1.15rem 1.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                      <div>
                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.96rem' }}>{opp.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--aura-text-secondary)' }}>{opp.company || opp.organization}</div>
                      </div>
                      <span className="aura-chip aura-chip-amber">
                        {opp.deadline_raw || opp.deadline_utc || 'Rolling Admissions'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : viewMode === 'kanban' || activeTab === 'applications' ? (
            /* VIEW: KANBAN CRM PIPELINE */
            <div style={{ padding: '1.5rem 2rem', height: '100%' }}>
              <AuraKanban
                applications={applications}
                opportunities={opportunities}
                onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                onUpdateStage={handleUpdateStage}
              />
            </div>
          ) : (
            /* VIEW: BENTO STREAM & DATA TABLE */
            <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto' }}>
              
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '8rem 0', color: 'var(--aura-text-secondary)' }}>
                  <RefreshCw size={40} className="spin-slow" color="var(--aura-primary)" style={{ margin: '0 auto 1.25rem' }} />
                  <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '800' }}>Calibrating Global Intelligence Stream...</h3>
                  <p style={{ fontSize: '0.84rem', marginTop: '0.35rem' }}>Syncing verified opportunity records from official corporate portals.</p>
                </div>
              ) : viewMode === 'table' ? (
                <AuraTable
                  opportunities={filteredOpportunities}
                  onSelect={(opp) => setSelectedOpportunity(opp)}
                  savedIds={savedOpportunityIds}
                  onToggleSave={handleToggleSave}
                />
              ) : filteredOpportunities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '6rem 1rem', color: 'var(--aura-text-tertiary)' }}>
                  <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '800' }}>No Matching Opportunities Found</h3>
                  <p style={{ fontSize: '0.86rem', marginTop: '0.35rem' }}>Try clearing filters or broadening your search query.</p>
                </div>
              ) : (
                <>
                  {/* Spotlight Top Match Hero Bento Card */}
                  {spotlightOpportunity && (
                    <SpotlightHero
                      opportunity={spotlightOpportunity}
                      onSelect={(opp) => setSelectedOpportunity(opp)}
                      isSaved={savedOpportunityIds.includes(spotlightOpportunity.id)}
                      onToggleSave={handleToggleSave}
                    />
                  )}

                  {/* Asymmetric Bento Stream Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {standardOpportunities.map(opp => (
                      <BentoCard
                        key={opp.id}
                        opportunity={opp}
                        onSelect={(opp) => setSelectedOpportunity(opp)}
                        isSaved={savedOpportunityIds.includes(opp.id)}
                        onToggleSave={handleToggleSave}
                      />
                    ))}
                  </div>
                </>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Slide-over Deep Intelligence Drawer */}
      <AuraDrawer
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        isSaved={selectedOpportunity ? savedOpportunityIds.includes(selectedOpportunity.id) : false}
        onToggleSave={handleToggleSave}
        onUpdateStage={handleUpdateStage}
        currentStage={selectedOpportunity ? applications.find(a => (a.opportunity_id || a.id) === selectedOpportunity.id)?.stage : null}
        onOpenAiLab={() => setIsAiLabOpen(true)}
      />

      {/* AI Career Lab Modal */}
      <AuraAiModal
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
