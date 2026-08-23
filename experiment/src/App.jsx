import React, { useState, useEffect, useMemo } from 'react';

import Sidebar from './components/Index/Sidebar';
import Topbar from './components/Index/Topbar';
import OpportunityList from './components/Index/OpportunityList';
import OpportunityDetail from './components/Index/OpportunityDetail';
import PipelineView from './components/Index/PipelineView';
import TableView from './components/Index/TableView';
import CvAuditorModal from './components/Index/CvAuditorModal';
import SecurityDashboard from './components/Index/SecurityDashboard';
import UserProfileModal from './components/UserProfileModal';

import { API_BASE_URL } from './config/api';
import { Clock } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'saved' | 'pipeline' | 'deadlines' | 'security'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'table' | 'pipeline'

  // Data
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [noIeltsOnly, setNoIeltsOnly] = useState(false);

  // Modals & User
  const [isCvAuditorOpen, setIsCvAuditorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load User & Token from storage
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

  // Fetch opportunities
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
        console.error('[Careerly Index] Failed to fetch opportunities:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // Fetch saved & applications
  useEffect(() => {
    if (!token) return;

    const fetchUserData = async () => {
      try {
        const savedRes = await fetch(`${API_BASE_URL}/user/saved`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          const items = Array.isArray(savedData) ? savedData : (savedData.saved || []);
          setSavedOpportunityIds(items.map(s => s.opportunity_id || s.id));
        }

        const appRes = await fetch(`${API_BASE_URL}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (appRes.ok) {
          const appData = await appRes.json();
          const apps = Array.isArray(appData) ? appData : (appData.applications || []);
          setApplications(apps);
        }
      } catch (e) {
        console.warn('[Careerly Index] User sync notice:', e.message);
      }
    };

    fetchUserData();
  }, [token]);

  // Toggle Save
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

  // Update CRM Stage
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

    if (categoryFilter === 'internships') {
      result = result.filter(o => (o.opportunity_type || '').toLowerCase().includes('intern') || (o.title || '').toLowerCase().includes('intern'));
    } else if (categoryFilter === 'scholarships') {
      result = result.filter(o => (o.opportunity_type || '').toLowerCase().includes('scholar') || (o.title || '').toLowerCase().includes('scholar'));
    } else if (categoryFilter === 'fellowships') {
      result = result.filter(o => (o.opportunity_type || '').toLowerCase().includes('fellow') || (o.title || '').toLowerCase().includes('fellow') || (o.opportunity_type || '').toLowerCase().includes('grant'));
    } else if (categoryFilter === 'remote') {
      result = result.filter(o => o.is_remote === 1 || (o.location_country || '').toLowerCase().includes('remote') || (o.location_country || '').toLowerCase().includes('world'));
    }

    if (noIeltsOnly) {
      result = result.filter(o => o.no_ielts === 1);
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
  }, [opportunities, activeTab, categoryFilter, noIeltsOnly, searchQuery, savedOpportunityIds]);

  const handleLogout = () => {
    localStorage.removeItem('careerly_token');
    localStorage.removeItem('careerly_user');
    sessionStorage.removeItem('careerly_token');
    setToken(null);
    setUser(null);
  };

  return (
    <div className="app-container">
      
      {/* 1. Utilitarian Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedOpportunityIds.length}
        appliedCount={applications.length}
        user={user}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCvAuditor={() => setIsCvAuditorOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Workbench Area */}
      <div className="app-main">
        
        {/* Top Filter Bar */}
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          noIeltsOnly={noIeltsOnly}
          setNoIeltsOnly={setNoIeltsOnly}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalCount={filteredOpportunities.length}
        />

        {/* Dynamic View Canvas */}
        {activeTab === 'security' ? (
          <SecurityDashboard />
        ) : activeTab === 'deadlines' ? (
          /* Deadlines View */
          <div className="custom-scroll" style={{ padding: '24px', overflowY: 'auto', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Upcoming Cutoff Schedule</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>Chronological schedule of official application deadlines.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredOpportunities.slice(0, 20).map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => { setSelectedOpportunity(opp); setActiveTab('directory'); setViewMode('split'); }}
                    style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{opp.title}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{opp.company || opp.organization}</div>
                    </div>
                    <span className="tag tag-amber">
                      <Clock size={11} />
                      <span>{opp.deadline_raw || opp.deadline_utc || 'Rolling'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'pipeline' || activeTab === 'pipeline' ? (
          /* Kanban View */
          <PipelineView
            applications={applications}
            opportunities={opportunities}
            onSelectOpportunity={(opp) => {
              setSelectedOpportunity(opp);
              setViewMode('split');
            }}
            onUpdateStage={handleUpdateStage}
          />
        ) : viewMode === 'table' ? (
          /* Spreadsheet Table View */
          <div className="custom-scroll" style={{ height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
            <TableView
              opportunities={filteredOpportunities}
              onSelect={(opp) => {
                setSelectedOpportunity(opp);
                setViewMode('split');
              }}
              savedIds={savedOpportunityIds}
              onToggleSave={handleToggleSave}
            />
          </div>
        ) : (
          /* Master-Detail Split Workbench */
          <div className="app-workbench">
            
            {/* Left Master List */}
            <div className="app-list-pane custom-scroll">
              <OpportunityList
                opportunities={filteredOpportunities}
                selectedId={selectedOpportunity?.id}
                onSelect={(opp) => setSelectedOpportunity(opp)}
                savedIds={savedOpportunityIds}
                onToggleSave={handleToggleSave}
              />
            </div>

            {/* Right Rich Dossier Inspector */}
            <div className="app-detail-pane">
              <OpportunityDetail
                opportunity={selectedOpportunity}
                isSaved={selectedOpportunity ? savedOpportunityIds.includes(selectedOpportunity.id) : false}
                onToggleSave={handleToggleSave}
                onUpdateStage={handleUpdateStage}
                currentStage={selectedOpportunity ? applications.find(a => (a.opportunity_id || a.id) === selectedOpportunity.id)?.stage : null}
                onOpenCvAuditor={() => setIsCvAuditorOpen(true)}
              />
            </div>

          </div>
        )}

      </div>

      {/* CV ATS Compliance Auditor Modal */}
      <CvAuditorModal
        isOpen={isCvAuditorOpen}
        onClose={() => setIsCvAuditorOpen(false)}
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
