import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, CheckSquare, Calendar, ShieldCheck, User, Search, 
  LayoutGrid, List, Sun, Moon, RefreshCw, Sparkles, Filter, 
  Megaphone, Zap, Mail, CheckCircle, Scale, Building2, MapPin, Clock, Coins, 
  ArrowRight, ExternalLink, Menu, X, Globe, Award, Briefcase, GraduationCap, 
  ChevronLeft, ChevronRight, FileText, Mic, Bot
} from 'lucide-react';

import ConversationalHero from './components/SearchInterface/ConversationalHero.jsx';
import AIQuestionModal from './components/SearchInterface/AIQuestionModal.jsx';
import SearchProgressExperience from './components/SearchInterface/SearchProgressExperience.jsx';
import OpportunityGridView from './components/OpportunityGridView.jsx';
import OpportunityListView from './components/OpportunityListView.jsx';
import OpportunityDrawer from './components/OpportunityDrawer.jsx';
import ApplicationKitDrawer from './components/ApplicationAssistant/ApplicationKitDrawer.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AutoApplyModal from './components/AutoApplyModal.jsx';
import EmailOutreachModal from './components/EmailOutreachModal.jsx';
import ComparisonModal from './components/ComparisonModal.jsx';
import UserProfileModal from './components/UserProfileModal.jsx';
import CvStudio from './components/CvStudio.jsx';
import InterviewCoach from './components/InterviewCoach.jsx';
import AiCareerCopilot from './components/AiCareerCopilot.jsx';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export default function App() {
  const [opportunities, setOpportunities] = useState([]);
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState({ total_opportunities: 0, active_sources: 48, verified_opportunities: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore'); // explore, cv_studio, interview, tracker, calendar, admin
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const feedTopRef = useRef(null);
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('opp_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // User Profile State
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('opp_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          degree_title: parsed.degree_title || 'Bachelor of Arts (BA)'
        };
      } catch (e) {}
    }
    return {
      name: 'Anas (Student)',
      email: 'ayarianas79@gmail.com',
      phone: '+60172513031',
      degree_level: 'undergrad',
      degree_title: 'Bachelor of Arts (BA)',
      major: 'Advertising & Marketing',
      gpa: 3.85,
      no_ielts_preference: 1
    };
  });

  // Saved Applications (CRM Board)
  const [savedApps, setSavedApps] = useState(() => {
    return JSON.parse(localStorage.getItem('opp_react_saved')) || [];
  });

  // Compare List
  const [compareList, setCompareList] = useState([]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [selectedPreset, setSelectedPreset] = useState('all');
  const [sortBy, setSortBy] = useState('match_desc');

  // Conversational AI Search State
  const [isSearchingPipeline, setIsSearchingPipeline] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [searchProfileContext, setSearchProfileContext] = useState(null);
  const [pendingQuery, setPendingQuery] = useState('');
  const [searchSummaryBadge, setSearchSummaryBadge] = useState('');

  // Modals & Slide-Over Drawers
  const [drawerOp, setDrawerOp] = useState(null);
  const [prepareAppOp, setPrepareAppOp] = useState(null);
  const [autoApplyOp, setAutoApplyOp] = useState(null);
  const [emailOutreachOp, setEmailOutreachOp] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  // Initial Fetch Opportunities from SQLite / API
  const fetchOpportunities = async (searchOverride = null) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const term = searchOverride !== null ? searchOverride : searchTerm;
      if (term) queryParams.append('search', term);
      if (typeFilter !== 'all') queryParams.append('type', typeFilter);
      if (fieldFilter !== 'all') queryParams.append('field', fieldFilter);

      const res = await fetch(`${API_BASE_URL}/opportunities?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.warn('Backend fetch error, checking local fallback:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [typeFilter, fieldFilter]);

  // 1. Natural Language Conversational Search Flow (Section 2 & 3)
  const handleStartConversationalSearch = async (rawQuery) => {
    setPendingQuery(rawQuery);
    setIsSearchingPipeline(true);

    try {
      const res = await fetch(`${API_BASE_URL}/search/conversational`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: rawQuery,
          userProfile
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSearchProfileContext(data.searchProfile);

        // If critical info is missing -> ask targeted question
        if (!data.hasEnoughInfo && data.followUpQuestion) {
          setIsSearchingPipeline(false);
          setActiveQuestion(data.followUpQuestion);
          return;
        }

        // Otherwise execute full multi-source search pipeline immediately
        await executeFinalSearch(rawQuery, data.searchProfile);
      } else {
        await executeFinalSearch(rawQuery, null);
      }
    } catch (err) {
      await executeFinalSearch(rawQuery, null);
    }
  };

  // 2. User Answered Clarifying Question
  const handleAnswerQuestion = async (paramKey, answerVal) => {
    setActiveQuestion(null);
    setIsSearchingPipeline(true);
    const updatedProfile = {
      ...(searchProfileContext || {}),
      [paramKey]: answerVal
    };
    await executeFinalSearch(pendingQuery, updatedProfile);
  };

  // 3. Skip Question and Search Anyway
  const handleSkipQuestion = async () => {
    setActiveQuestion(null);
    setIsSearchingPipeline(true);
    await executeFinalSearch(pendingQuery, searchProfileContext);
  };

  // 4. Execute Multi-Source Search & Verification Pipeline
  const executeFinalSearch = async (query, searchProfile) => {
    try {
      const res = await fetch(`${API_BASE_URL}/search/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          searchProfile,
          userProfile
        })
      });

      if (res.ok) {
        const data = await res.json();
        const found = data.opportunities || [];
        setOpportunities(found);
        setCurrentPage(1);
        setSearchSummaryBadge(`✨ Verified & Ranked ${found.length} matches for "${query}"`);
        triggerToast(`🎉 Found and verified ${found.length} matching opportunities!`);
      }
    } catch (err) {
      fetchOpportunities(query);
    } finally {
      setTimeout(() => {
        setIsSearchingPipeline(false);
      }, 2400);
    }
  };

  // Application CRM State Management
  const toggleSaveApp = (op) => {
    setSavedApps(prev => {
      const exists = prev.some(a => a.id === op.id);
      let updated;
      if (exists) {
        updated = prev.filter(a => a.id !== op.id);
        triggerToast('Removed from Saved');
      } else {
        updated = [{ ...op, savedAt: new Date().toISOString(), stage: 'saved' }, ...prev];
        triggerToast('✓ Saved to Application CRM Board!');
      }
      localStorage.setItem('opp_react_saved', JSON.stringify(updated));
      return updated;
    });
  };

  const handleApplySuccess = (opportunityId, newStage = 'applied') => {
    setSavedApps(prev => {
      const existing = prev.find(a => a.id === opportunityId);
      const targetOp = opportunities.find(o => o.id === opportunityId) || { id: opportunityId, title: 'Opportunity' };
      const updated = existing
        ? prev.map(a => a.id === opportunityId ? { ...a, stage: newStage, appliedAt: new Date().toISOString() } : a)
        : [{ ...targetOp, stage: newStage, appliedAt: new Date().toISOString() }, ...prev];

      localStorage.setItem('opp_react_saved', JSON.stringify(updated));
      return updated;
    });
  };

  // Filter and Presets
  const filteredOpportunities = opportunities.filter(op => {
    if (selectedPreset === 'finance') {
      const f = (op.field_of_study || '').toLowerCase();
      const t = (op.title || '').toLowerCase();
      return f.includes('finance') || t.includes('bank') || t.includes('finance') || t.includes('investment');
    }
    if (selectedPreset === 'advertising') {
      const f = (op.field_of_study || '').toLowerCase();
      const t = (op.title || '').toLowerCase();
      return f.includes('advertising') || t.includes('marketing') || t.includes('creative') || t.includes('brand');
    }
    if (selectedPreset === 'fully_funded') {
      return op.funding_level === 'fully_funded' || (op.stipend_text && op.stipend_text.includes('100%'));
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage) || 1;
  const paginatedOpportunities = filteredOpportunities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (feedTopRef.current) feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen app-container">
      
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="prodexa-navbar">
        <div className="navbar-inner">
          
          <div className="nav-brand" onClick={() => setActiveTab('explore')} style={{ cursor: 'pointer' }}>
            <div className="nav-logo-box">
              <Compass size={20} color="var(--primary-foreground)" />
            </div>
            <div>
              <span className="brand-title">OPPORTUNITY</span>
              <span className="brand-badge-ai">AI 2.0</span>
            </div>
          </div>

          <div className="nav-pill-group">
            <button 
              className={`nav-pill ${activeTab === 'explore' ? 'active' : ''}`}
              onClick={() => setActiveTab('explore')}
            >
              <Compass size={15} /> Discover & Match
            </button>

            <button 
              className={`nav-pill ${activeTab === 'cv_studio' ? 'active' : ''}`}
              onClick={() => setActiveTab('cv_studio')}
            >
              <FileText size={15} /> AI CV Studio
            </button>

            <button 
              className={`nav-pill ${activeTab === 'interview' ? 'active' : ''}`}
              onClick={() => setActiveTab('interview')}
            >
              <Mic size={15} /> Interview Coach
            </button>

            <button 
              className={`nav-pill ${activeTab === 'tracker' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracker')}
            >
              <CheckSquare size={15} /> CRM Board ({savedApps.length})
            </button>

            <button 
              className={`nav-pill ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={15} /> Deadlines
            </button>

            <button 
              className={`nav-pill ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={15} /> Scrapers (48+)
            </button>
          </div>

          <div className="nav-actions-right">
            <button className="icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button 
              className="user-profile-badge" 
              onClick={() => setShowProfileModal(true)}
              title="Edit Academic Profile & Qualification"
            >
              <User size={15} color="var(--accent-blue)" />
              <span>{userProfile.name?.split(' ')[0] || 'Anas'} (BA)</span>
            </button>

            <button className="mobile-menu-trigger" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={mobileMenuOpen}>
              <Menu size={20} />
            </button>
          </div>

        </div>
      </nav>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-nav-panel" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="mobile-nav-header">
              <span style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-primary)' }}>Navigation</span>
              <button className="icon-button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation">
                <X size={16} />
              </button>
            </div>
            <div className="mobile-nav-items">
              {[
                { id: 'explore', icon: <Compass size={18} />, label: 'Discover & Match' },
                { id: 'cv_studio', icon: <FileText size={18} />, label: 'AI CV Studio' },
                { id: 'interview', icon: <Mic size={18} />, label: 'Interview Coach' },
                { id: 'tracker', icon: <CheckSquare size={18} />, label: `CRM Board (${savedApps.length})` },
                { id: 'calendar', icon: <Calendar size={18} />, label: 'Deadlines' },
                { id: 'admin', icon: <ShieldCheck size={18} />, label: 'Scrapers (48+)' }
              ].map(item => (
                <button
                  key={item.id}
                  className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button className="icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button 
                className="user-profile-badge" 
                onClick={() => { setShowProfileModal(true); setMobileMenuOpen(false); }}
              >
                <User size={15} color="var(--accent-blue)" />
                <span>{userProfile.name?.split(' ')[0] || 'Anas'} (BA)</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 2. MAIN VIEW SWITCHER */}
      <main>
        
        {/* TAB 1: CONVERSATIONAL AI DISCOVERY & OPPORTUNITIES */}
        {activeTab === 'explore' && (
          <div>
            <ConversationalHero 
              onStartConversationalSearch={handleStartConversationalSearch}
              isSearching={isSearchingPipeline}
            />

            <div className="content-container" ref={feedTopRef} style={{ marginTop: '2.5rem' }}>
              
              {/* Active Search Summary Badge */}
              {searchSummaryBadge && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card)', border: '1px solid var(--accent-blue)', color: 'var(--foreground)', padding: '0.45rem 1.25rem', borderRadius: 'var(--radius-full)', fontSize: '0.84rem', fontWeight: '800', margin: '0 auto 1.75rem', boxShadow: 'var(--shadow-sm)' }}>
                  <Sparkles size={15} color="var(--accent-blue)" /> {searchSummaryBadge}
                  <button 
                    onClick={() => { setSearchSummaryBadge(''); fetchOpportunities(''); }} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', marginLeft: '0.45rem', fontSize: '0.9rem' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Category Ribbon */}
              <div className="category-ribbon">
                <button 
                  className={`cat-pill ${selectedPreset === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedPreset('all')}
                >
                  <Sparkles size={14} /> All Offers
                </button>
                <button 
                  className={`cat-pill ${selectedPreset === 'advertising' ? 'ad-active' : ''}`}
                  onClick={() => setSelectedPreset(selectedPreset === 'advertising' ? 'all' : 'advertising')}
                >
                  <Megaphone size={14} /> Advertising & Marketing
                </button>
                <button 
                  className={`cat-pill ${selectedPreset === 'finance' ? 'active' : ''}`}
                  onClick={() => setSelectedPreset(selectedPreset === 'finance' ? 'all' : 'finance')}
                >
                  <Briefcase size={14} /> Finance & Banking
                </button>
                <button 
                  className={`cat-pill ${selectedPreset === 'fully_funded' ? 'active' : ''}`}
                  onClick={() => setSelectedPreset(selectedPreset === 'fully_funded' ? 'all' : 'fully_funded')}
                >
                  <GraduationCap size={14} /> Fully Funded Scholarships
                </button>
              </div>

              {/* Feed Toolbar */}
              <div className="feed-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--foreground)' }}>
                    Verified Opportunities ({filteredOpportunities.length})
                  </span>
                  <span className="bento-tag" style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', fontWeight: '800' }}>
                    Deterministic Ranked
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--card)', border: '1px solid var(--border)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                    <button 
                      className={`icon-button ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      style={{ width: '32px', height: '32px', background: viewMode === 'grid' ? 'var(--muted)' : 'transparent' }}
                      title="Grid View"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button 
                      className={`icon-button ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                      style={{ width: '32px', height: '32px', background: viewMode === 'list' ? 'var(--muted)' : 'transparent' }}
                      title="List View"
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Opportunities Grid / List */}
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <RefreshCw size={28} className="spin" color="var(--accent-blue)" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: '700', color: 'var(--foreground)' }}>Loading verified opportunities...</p>
                </div>
              ) : viewMode === 'grid' ? (
                <OpportunityGridView 
                  opportunities={paginatedOpportunities}
                  onSelectOp={(op) => setDrawerOp(op)}
                  onPrepareApplication={(op) => setPrepareAppOp(op)}
                  onToggleSave={toggleSaveApp}
                  savedIds={savedApps.map(a => a.id)}
                />
              ) : (
                <OpportunityListView 
                  opportunities={paginatedOpportunities}
                  onSelectOp={(op) => setDrawerOp(op)}
                  onToggleSave={toggleSaveApp}
                  savedIds={savedApps.map(a => a.id)}
                  onAutoApply={(op) => setPrepareAppOp(op)}
                  onEmailOutreach={(op) => setEmailOutreachOp(op)}
                />
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.65rem', marginTop: '2.5rem', paddingBottom: '3rem' }}>
                  <button 
                    className="btn btn-outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
                  >
                    <ChevronLeft size={15} /> Previous
                  </button>
                  <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--foreground)', padding: '0 0.5rem' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    className="btn btn-outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 2: AI CV STUDIO & ATS ENHANCER */}
        {activeTab === 'cv_studio' && (
          <div className="tab-content-anim">
            <CvStudio userProfile={userProfile} triggerToast={triggerToast} />
          </div>
        )}

        {/* TAB 3: AI MOCK INTERVIEW COACH */}
        {activeTab === 'interview' && (
          <div className="tab-content-anim">
            <InterviewCoach userProfile={userProfile} triggerToast={triggerToast} />
          </div>
        )}

        {/* TAB 4: KANBAN CRM BOARD */}
        {activeTab === 'tracker' && (
          <div className="tab-content-anim content-container" style={{ marginTop: '2rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--foreground)', marginBottom: '0.3rem' }}>
                Application Pipeline CRM
              </h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                Track your active applications across Saved, Preparing, Submitted, and Interview stages.
              </p>
            </div>

            <div className="kanban-board-scroll">
              {['saved', 'preparing', 'submitted', 'interview', 'accepted'].map(st => {
                const colApps = savedApps.filter(a => a.stage === st || (st === 'saved' && !a.stage));
                return (
                  <div key={st} className="kanban-col">
                    <div className="kanban-col-header">
                      <span className="col-title" style={{ textTransform: 'capitalize' }}>{st}</span>
                      <span className="col-count">{colApps.length}</span>
                    </div>

                    <div className="kanban-col-body">
                      {colApps.map(app => (
                        <div key={app.id} className="kanban-card">
                          <div style={{ fontWeight: '800', color: 'var(--foreground)', fontSize: '0.92rem', marginBottom: '0.25rem' }}>{app.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{app.organization}</div>
                          <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.75rem' }}>
                            <button 
                              className="btn btn-emerald"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                              onClick={() => setPrepareAppOp(app)}
                            >
                              <Zap size={12} /> Prep Kit
                            </button>
                            <button 
                              className="btn btn-outline"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                              onClick={() => setDrawerOp(app)}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: DEADLINES TIMELINE */}
        {activeTab === 'calendar' && (
          <div className="content-container" style={{ maxWidth: '860px', margin: '2rem auto' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--foreground)', marginBottom: '0.3rem' }}>
                Application Deadlines Timeline
              </h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                Chronological schedule of intake cut-offs and verified submission deadlines.
              </p>
            </div>

            {opportunities.map(op => (
              <div key={op.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: '800', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} /> Deadline: {op.deadline_utc}
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--foreground)' }}>{op.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>{op.organization} • {op.location_country}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-emerald" style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }} onClick={() => setPrepareAppOp(op)}>
                    <Zap size={14} /> Prepare Kit
                  </button>
                  <button className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }} onClick={() => setDrawerOp(op)}>
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: ADMIN OPERATIONS DASHBOARD */}
        {activeTab === 'admin' && (
          <AdminDashboard triggerToast={triggerToast} />
        )}

      </main>

      {/* Dynamic AI Question Modal (Section 3) */}
      <AIQuestionModal 
        isOpen={Boolean(activeQuestion)}
        questionData={activeQuestion}
        onAnswerSelected={handleAnswerQuestion}
        onSkip={handleSkipQuestion}
      />

      {/* Transparent Search Progress Experience (Section 21 & 22) */}
      <SearchProgressExperience 
        isActive={isSearchingPipeline}
      />

      {/* Application Readiness Kit Drawer (Section 11) */}
      {prepareAppOp && (
        <ApplicationKitDrawer 
          opportunity={prepareAppOp}
          userProfile={userProfile}
          onClose={() => setPrepareAppOp(null)}
          onApplied={handleApplySuccess}
          triggerToast={triggerToast}
        />
      )}

      {/* Slide-Over Inspection Drawer */}
      {drawerOp && (
        <OpportunityDrawer 
          opportunity={drawerOp}
          onClose={() => setDrawerOp(null)}
          onToggleSave={toggleSaveApp}
          isSaved={savedApps.some(a => a.id === drawerOp.id)}
          onAutoApply={(op) => { setPrepareAppOp(op); setDrawerOp(null); }}
          onEmailOutreach={(op) => { setEmailOutreachOp(op); setDrawerOp(null); }}
          triggerToast={triggerToast}
        />
      )}

      {/* Email Outreach Modal */}
      {emailOutreachOp && (
        <EmailOutreachModal 
          opportunity={emailOutreachOp}
          userProfile={userProfile}
          onClose={() => setEmailOutreachOp(null)}
          triggerToast={triggerToast}
        />
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal 
          profile={userProfile}
          onClose={() => setShowProfileModal(false)}
          onSaveProfile={(prof) => setUserProfile(prof)}
          triggerToast={triggerToast}
        />
      )}

      {/* Floating 24/7 AI Career Copilot */}
      <AiCareerCopilot userProfile={userProfile} triggerToast={triggerToast} />

      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed',
          bottom: '2rem',
          left: '2rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          padding: '0.75rem 1.35rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          zIndex: 4000,
          fontSize: '0.86rem',
          fontWeight: '700'
        }}>
          <CheckCircle size={17} color="var(--accent-emerald)" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
