import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, CheckSquare, Calendar, ShieldCheck, User, Search, 
  LayoutGrid, List, Sun, Moon, RefreshCw, Sparkles, Filter, 
  Megaphone, Zap, Mail, CheckCircle, Scale, Building2, MapPin, Clock, Coins, 
  ArrowRight, ExternalLink, Menu, X, Globe, Award, Briefcase, GraduationCap, 
  ChevronLeft, ChevronRight, FileText, Mic, Bot, LogOut, Settings, Bookmark, CheckCircle2
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthModal from './components/Auth/AuthModal.jsx';
import OnboardingFlow from './components/Onboarding/OnboardingFlow.jsx';
import PublicLandingView from './components/Landing/PublicLandingView.jsx';
import PersonalizedDashboard from './components/Dashboard/PersonalizedDashboard.jsx';
import SettingsView from './components/Settings/SettingsView.jsx';

import ConversationalHero from './components/SearchInterface/ConversationalHero.jsx';
import AIQuestionModal from './components/SearchInterface/AIQuestionModal.jsx';
import SearchProgressExperience from './components/SearchInterface/SearchProgressExperience.jsx';
import OpportunityCard from './components/OpportunityCard/OpportunityCard.jsx';
import OpportunityGridView from './components/OpportunityGridView.jsx';
import OpportunityListView from './components/OpportunityListView.jsx';
import OpportunityDrawer from './components/OpportunityDrawer.jsx';
import ApplicationKitDrawer from './components/ApplicationAssistant/ApplicationKitDrawer.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AutoApplyModal from './components/AutoApplyModal.jsx';
import EmailOutreachModal from './components/EmailOutreachModal.jsx';
import ComparisonModal from './components/ComparisonModal.jsx';
import CvStudio from './components/CvStudio.jsx';
import InterviewCoach from './components/InterviewCoach.jsx';
import AiCareerCopilot from './components/AiCareerCopilot.jsx';
import EvidenceInspectorModal from './components/EvidenceInspectorModal.jsx';
import Footer from './components/Footer.jsx';

const API_BASE_URL = 'http://localhost:5000/api/v1';

function CareerlyPlatform() {
  const { 
    user, 
    careerProfile, 
    searchProfile, 
    isAuthenticated, 
    isAdmin, 
    isLoading: isAuthLoading, 
    needsOnboarding, 
    logout 
  } = useAuth();

  const [opportunities, setOpportunities] = useState([]);
  const [savedOppsList, setSavedOppsList] = useState([]);
  const [applicationsList, setApplicationsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('all');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('careerly_token') ? 'explore' : 'landing';
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Evidence & Search State
  const [inspectingEvidenceOp, setInspectingEvidenceOp] = useState(null);
  const [searchFunnelMetrics, setSearchFunnelMetrics] = useState(null);
  const [searchRelaxationOptions, setSearchRelaxationOptions] = useState([]);

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

  // Navbar Scroll State
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // Synchronize Tab on Auth State Change
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'landing') setActiveTab('dashboard');
    } else {
      if (['dashboard', 'saved', 'tracker', 'settings', 'admin'].includes(activeTab)) {
        setActiveTab('landing');
      }
    }
  }, [isAuthenticated, activeTab]);

  // Conversational AI Search State
  const [isSearchingPipeline, setIsSearchingPipeline] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [searchProfileContext, setSearchProfileContext] = useState(null);
  const [pendingQuery, setPendingQuery] = useState('');
  const [searchSummaryBadge, setSearchSummaryBadge] = useState('');

  // Modals & Slide-Over Drawers
  const [drawerOp, setDrawerOp] = useState(null);
  const [prepareAppOp, setPrepareAppOp] = useState(null);
  const [emailOutreachOp, setEmailOutreachOp] = useState(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  // Fetch Opportunities from SQLite / API
  const fetchOpportunities = async (searchOverride = null) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const term = searchOverride !== null ? searchOverride : '';
      if (term) queryParams.append('search', term);

      const token = localStorage.getItem('careerly_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE_URL}/opportunities?${queryParams.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.warn('Backend fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Saved & Applications when authenticated
  const fetchUserData = async () => {
    const token = localStorage.getItem('careerly_token');
    if (!token) {
      setSavedOppsList([]);
      setApplicationsList([]);
      return;
    }

    try {
      const [savedRes, appsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/saved`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (savedRes.ok) {
        const sData = await savedRes.json();
        setSavedOppsList(sData.saved_opportunities || []);
      }
      if (appsRes.ok) {
        const aData = await appsRes.json();
        setApplicationsList(aData.applications || []);
      }
    } catch (err) {
      console.warn('User data sync error:', err.message);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  // Toggle Save Opportunity
  const toggleSaveApp = async (opportunityId) => {
    if (!isAuthenticated) {
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      triggerToast('Create a free account to save opportunities to your dashboard.');
      return;
    }

    const token = localStorage.getItem('careerly_token');
    const isCurrentlySaved = savedOppsList.some(s => s.id === opportunityId || s.opportunity_id === opportunityId);

    try {
      if (isCurrentlySaved) {
        setSavedOppsList(prev => prev.filter(s => s.id !== opportunityId && s.opportunity_id !== opportunityId));
        await fetch(`${API_BASE_URL}/user/saved/${opportunityId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        triggerToast('Removed from saved opportunities.');
      } else {
        const opp = opportunities.find(o => o.id === opportunityId);
        if (opp) setSavedOppsList(prev => [opp, ...prev]);
        await fetch(`${API_BASE_URL}/user/saved/${opportunityId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        triggerToast('✓ Opportunity saved to your personal dashboard!');
      }
      fetchUserData();
    } catch (err) {
      triggerToast('Error saving opportunity.');
    }
  };

  const isOpportunitySaved = (oppId) => {
    return savedOppsList.some(s => s.id === oppId || s.opportunity_id === oppId);
  };

  // Update CRM Application Stage
  const handleUpdateAppStage = async (opportunityId, stage) => {
    if (!isAuthenticated) {
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      return;
    }

    const token = localStorage.getItem('careerly_token');
    try {
      await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ opportunity_id: opportunityId, stage })
      });
      fetchUserData();
      triggerToast(`✓ Application stage updated: ${stage}`);
    } catch (err) {
      triggerToast('Failed to update stage.');
    }
  };

  // Conversational Search Execution
  const handleStartConversationalSearch = async (rawQuery) => {
    setPendingQuery(rawQuery);
    setIsSearchingPipeline(true);

    const token = localStorage.getItem('careerly_token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    try {
      const res = await fetch(`http://localhost:5000/api/v3/search/intent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          raw_query: rawQuery,
          user_profile: careerProfile || {}
        })
      });

      const data = await res.json();
      if (data.status === 'ready') {
        setSearchProfileContext(data.compiled_constraints);

        if (!data.has_enough_info && data.follow_up_question) {
          setIsSearchingPipeline(false);
          setActiveQuestion(data.follow_up_question);
          return;
        }

        await executeFinalSearch(rawQuery, data.compiled_constraints);
      } else {
        await executeFinalSearch(rawQuery, null);
      }
    } catch (err) {
      await executeFinalSearch(rawQuery, null);
    }
  };

  const executeFinalSearch = async (queryText, compiledConstraints) => {
    setIsSearchingPipeline(true);
    const token = localStorage.getItem('careerly_token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    try {
      const res = await fetch(`http://localhost:5000/api/v3/search/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: queryText,
          compiled_constraints: compiledConstraints,
          user_profile: careerProfile || {}
        })
      });

      const data = await res.json();
      if (data.results) {
        setOpportunities(data.results);
        setSearchFunnelMetrics(data.funnel_metrics);
        setSearchRelaxationOptions(data.relaxation_options || []);
        setSearchSummaryBadge(`Search: "${queryText}" (${data.results.length} verified results)`);
        setCurrentPage(1);
        triggerToast(`Discovered ${data.results.length} verified opportunities!`);
      }
    } catch (err) {
      triggerToast('Search error occurred.');
    } finally {
      setIsSearchingPipeline(false);
      if (feedTopRef.current) feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAnswerQuestion = async (paramKey, answerVal) => {
    setActiveQuestion(null);
    setIsSearchingPipeline(true);
    const updatedConstraints = {
      ...(searchProfileContext || {}),
      user_profile: {
        ...(careerProfile || {}),
        [paramKey]: answerVal
      }
    };
    await executeFinalSearch(pendingQuery, updatedConstraints);
  };

  const handleSkipQuestion = async () => {
    setActiveQuestion(null);
    await executeFinalSearch(pendingQuery, searchProfileContext);
  };

  const handleRelaxConstraint = async (option) => {
    triggerToast(`Relaxing constraint: ${option.label}...`);
    setIsSearchingPipeline(true);
    const updated = { ...(searchProfileContext || {}) };
    if (option.type === 'location' && updated.predicates?.location) {
      updated.predicates.location.mode = 'METRO_RADIUS';
    }
    if (option.type === 'compensation' && updated.predicates?.compensation) {
      updated.predicates.compensation.is_mandatory = false;
      updated.predicates.compensation.allow_unknown = true;
    }
    await executeFinalSearch(pendingQuery || 'internship', updated);
  };

  // Filter & Pagination Logic
  const filteredOpportunities = opportunities.filter(op => {
    if (selectedPreset === 'advertising' && !op.field_of_study?.toLowerCase().includes('advert') && !op.field_of_study?.toLowerCase().includes('marketing') && !op.title?.toLowerCase().includes('brand')) {
      return false;
    }
    if (selectedPreset === 'finance' && !op.field_of_study?.toLowerCase().includes('finance') && !op.title?.toLowerCase().includes('analyst') && !op.title?.toLowerCase().includes('bank')) {
      return false;
    }
    if (selectedPreset === 'fully_funded' && !op.funding_level?.includes('full') && op.is_paid !== 1) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const paginatedOpportunities = filteredOpportunities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (feedTopRef.current) feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Render First-Time User Onboarding Flow if needed
  if (isAuthenticated && needsOnboarding) {
    return (
      <div className="app-layout">
        <OnboardingFlow triggerToast={triggerToast} />
      </div>
    );
  }

  const userInitial = careerProfile?.full_name ? careerProfile.full_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U';
  const displayName = careerProfile?.full_name || user?.email?.split('@')[0] || 'Member';
  const displayEmail = user?.email || 'member@careerly.app';
  const degreeBadge = careerProfile?.degree_level === 'masters' ? 'MSc' : careerProfile?.degree_level === 'phd' ? 'PhD' : 'BSc';

  const tabTitles = {
    dashboard: 'Personalized Dashboard',
    explore: 'Opportunity Discovery & Matching',
    saved: 'Saved Opportunities',
    tracker: 'Application CRM Board',
    cv_studio: 'AI CV & ATS Studio',
    interview: 'AI Mock Interview Coach',
    settings: 'Account & Match Preferences',
    admin: 'Admin Operations & Security',
    landing: 'Home'
  };

  return (
    <div className="saas-workspace">
      
      {/* 1. WORKSPACE SIDEBAR (AUTHENTICATED) */}
      {isAuthenticated && (
        <>
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div 
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 890, backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <aside className={`saas-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            
            {/* Sidebar Brand Header */}
            <div className="sidebar-header">
              <div 
                className="sidebar-brand" 
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              >
                <div className="sidebar-logo">
                  <img src="/careerly-logo.png" alt="Careerly Logo" />
                </div>
                <div className="sidebar-brand-name">
                  Careerly
                  <span className="sidebar-plan-tag">MATCH 2.0</span>
                </div>
              </div>

              {mobileMenuOpen && (
                <button 
                  className="icon-button" 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ width: '28px', height: '28px' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Sidebar Navigation Sections */}
            <div className="sidebar-content">
              
              {/* CORE WORKSPACE */}
              <div>
                <div className="sidebar-section-title">Core Workspace</div>
                <div className="sidebar-nav-list">
                  <button 
                    className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Sparkles size={16} />
                      <span>Dashboard</span>
                    </div>
                  </button>

                  <button 
                    className={`sidebar-nav-item ${activeTab === 'explore' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('explore'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Compass size={16} />
                      <span>Discover & Match</span>
                    </div>
                  </button>

                  <button 
                    className={`sidebar-nav-item ${activeTab === 'saved' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('saved'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Bookmark size={16} />
                      <span>Saved</span>
                    </div>
                    {savedOppsList.length > 0 && (
                      <span className="sidebar-badge">{savedOppsList.length}</span>
                    )}
                  </button>

                  <button 
                    className={`sidebar-nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('tracker'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <CheckSquare size={16} />
                      <span>CRM Board</span>
                    </div>
                    {applicationsList.length > 0 && (
                      <span className="sidebar-badge">{applicationsList.length}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* CAREER TOOLS */}
              <div>
                <div className="sidebar-section-title">Career Suite</div>
                <div className="sidebar-nav-list">
                  <button 
                    className={`sidebar-nav-item ${activeTab === 'cv_studio' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('cv_studio'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <FileText size={16} />
                      <span>AI CV Studio</span>
                    </div>
                  </button>

                  <button 
                    className={`sidebar-nav-item ${activeTab === 'interview' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('interview'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Mic size={16} />
                      <span>Interview Coach</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SETTINGS & ADMINISTRATION */}
              <div>
                <div className="sidebar-section-title">Preferences & Ops</div>
                <div className="sidebar-nav-list">
                  <button 
                    className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Settings size={16} />
                      <span>Account Settings</span>
                    </div>
                  </button>

                  {isAdmin && (
                    <button 
                      className={`sidebar-nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                      onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                    >
                      <div className="sidebar-nav-item-left">
                        <ShieldCheck size={16} color="var(--primary)" />
                        <span>Admin Operations</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar User Footer */}
            <div className="sidebar-footer">
              <div className="sidebar-user-pill">
                <div className="sidebar-user-avatar">
                  {userInitial}
                </div>
                <div className="sidebar-user-meta">
                  <span className="sidebar-user-name">{displayName}</span>
                  <span className="sidebar-user-email">{displayEmail}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button 
                  className="icon-button" 
                  onClick={toggleTheme} 
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  style={{ width: '28px', height: '28px' }}
                >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>
                <button 
                  className="icon-button" 
                  onClick={() => { logout(); triggerToast('Signed out of Careerly.'); }} 
                  title="Sign Out"
                  style={{ width: '28px', height: '28px', color: '#ef4444' }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>

          </aside>
        </>
      )}

      {/* 2. MAIN WORKSPACE CANVAS */}
      <div className="saas-main">
        
        {/* Top Header Bar (Modern Spacious Brainwave / Luma Navbar) */}
        {!isAuthenticated ? (
          <header className="brainwave-navbar">
            <div className="sidebar-brand" onClick={() => setActiveTab('landing')} style={{ cursor: 'pointer' }}>
              <div className="sidebar-logo" style={{ boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)' }}>
                <img src="/careerly-logo.png" alt="Careerly Logo" />
              </div>
              <div className="sidebar-brand-name" style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
                Careerly
                <span style={{ fontSize: '0.68rem', color: '#c084fc', marginLeft: '0.4rem', fontWeight: '700', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(124, 58, 237, 0.25)', border: '1px solid rgba(124, 58, 237, 0.4)' }}>
                  AI 2.0
                </span>
              </div>
            </div>

            {/* Modern Centered Navigation Links (Discover Roles hidden for non-signed-in) */}
            <nav className="brainwave-nav-center">
              <button 
                className="brainwave-nav-link" 
                onClick={() => {
                  const el = document.getElementById('features-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Features
              </button>
              <button className="brainwave-nav-link" onClick={() => { setAuthModalMode('signup'); setAuthModalOpen(true); }}>
                AI CV Studio
              </button>
              <button className="brainwave-nav-link" onClick={() => { setAuthModalMode('signup'); setAuthModalOpen(true); }}>
                STAR Coach
              </button>
              <button className="brainwave-nav-link" onClick={() => { setAuthModalMode('signup'); setAuthModalOpen(true); }}>
                7-Factor Engine
              </button>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <button 
                className="icon-button" 
                onClick={toggleTheme} 
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{ width: '42px', height: '42px' }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
                className="brainwave-btn-outline"
                style={{ height: '46px', padding: '0 1.75rem', fontSize: '0.9rem' }}
              >
                Sign In
              </button>

              <button
                onClick={() => { setAuthModalMode('signup'); setAuthModalOpen(true); }}
                className="brainwave-btn-glow"
                style={{ height: '46px', padding: '0 1.85rem', fontSize: '0.9rem' }}
              >
                <span>Get Started Free</span>
                <ArrowRight size={16} className="btn-arrow-icon" />
              </button>
            </div>
          </header>
        ) : (
          <header className="saas-header">
            <div className="saas-header-left">
              <button 
                className="icon-button" 
                onClick={() => setMobileMenuOpen(true)}
                style={{ display: 'inline-flex' }}
                aria-label="Open Navigation Menu"
              >
                <Menu size={18} />
              </button>

              <div className="saas-breadcrumbs">
                <span>Careerly</span>
                <span>/</span>
                <span className="active">{tabTitles[activeTab] || 'Workspace'}</span>
              </div>
            </div>

            <div className="saas-header-right">
              {activeTab === 'explore' && (
                <button 
                  className="saas-command-trigger"
                  onClick={() => {
                    if (feedTopRef.current) feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Search size={14} />
                  <span>Search opportunities...</span>
                  <span className="saas-kbd">⌘K</span>
                </button>
              )}

              <button 
                className="icon-button" 
                onClick={toggleTheme} 
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </header>
        )}

        {/* Content Container */}
        <div className={activeTab === 'landing' ? "landing-content-canvas" : "saas-content-canvas"}>
          <main>

        {/* TAB: PUBLIC LANDING (UNAUTHENTICATED) */}
        {activeTab === 'landing' && (
          <PublicLandingView 
            onOpenAuth={(mode) => { setAuthModalMode(mode); setAuthModalOpen(true); }}
            sampleOpportunities={opportunities}
            onSelectOpportunity={(op) => setDrawerOp(op)}
            onPrepareKit={(op) => setPrepareAppOp(op)}
            onSaveOpportunity={(opId) => toggleSaveApp(opId)}
            isSaved={isOpportunitySaved}
            triggerToast={triggerToast}
          />
        )}

        {/* TAB: PERSONALIZED DASHBOARD (AUTHENTICATED) */}
        {activeTab === 'dashboard' && (
          <PersonalizedDashboard 
            onSelectOpportunity={(op) => setDrawerOp(op)}
            onPrepareKit={(op) => setPrepareAppOp(op)}
            onSaveOpportunity={(opId) => toggleSaveApp(opId)}
            isSaved={isOpportunitySaved}
            onNavigateTab={(tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            triggerToast={triggerToast}
          />
        )}

        {/* TAB: DISCOVER & MATCH (SHARED GLOBAL OPPORTUNITY CATALOG) */}
        {activeTab === 'explore' && (
          <div>
            <ConversationalHero 
              onStartConversationalSearch={handleStartConversationalSearch}
              isSearching={isSearchingPipeline}
            />

            <div className="content-container" ref={feedTopRef} style={{ marginTop: '2.5rem' }}>
              
              {/* Active Search Summary Badge */}
              {searchSummaryBadge && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card)', border: '1px solid var(--primary)', color: 'var(--foreground)', padding: '0.45rem 1.25rem', borderRadius: 'var(--radius-full)', fontSize: '0.84rem', fontWeight: '800', margin: '0 auto 1.75rem', boxShadow: 'var(--shadow-sm)' }}>
                  <Sparkles size={15} color="var(--primary)" /> {searchSummaryBadge}
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
                  <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--card)', border: '1px solid var(--border-default)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                    <button 
                      className={`icon-button ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      style={{ width: '32px', height: '32px', background: viewMode === 'grid' ? 'var(--primary-subtle)' : 'transparent' }}
                      title="Grid View"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button 
                      className={`icon-button ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                      style={{ width: '32px', height: '32px', background: viewMode === 'list' ? 'var(--primary-subtle)' : 'transparent' }}
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
                  <RefreshCw size={28} className="spin" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: '700', color: 'var(--foreground)' }}>Loading verified opportunities...</p>
                </div>
              ) : viewMode === 'grid' ? (
                <OpportunityGridView 
                  opportunities={paginatedOpportunities}
                  funnelMetrics={searchFunnelMetrics}
                  relaxationOptions={searchRelaxationOptions}
                  onSelectOp={(op) => setDrawerOp(op)}
                  onPrepareApplication={(op) => setPrepareAppOp(op)}
                  onToggleSave={(oppId) => toggleSaveApp(oppId)}
                  onInspectEvidence={(op) => setInspectingEvidenceOp(op)}
                  onRelaxConstraint={handleRelaxConstraint}
                  savedIds={savedOppsList.map(s => s.id || s.opportunity_id)}
                />
              ) : (
                <OpportunityListView 
                  opportunities={paginatedOpportunities}
                  onSelectOp={(op) => setDrawerOp(op)}
                  onToggleSave={(oppId) => toggleSaveApp(oppId)}
                  savedIds={savedOppsList.map(s => s.id || s.opportunity_id)}
                  onAutoApply={(op) => setPrepareAppOp(op)}
                  onEmailOutreach={(op) => setEmailOutreachOp(op)}
                />
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.65rem', marginTop: '2.5rem', paddingBottom: '3rem' }}>
                  <button 
                    className="action-btn-secondary"
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
                    className="action-btn-secondary"
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

        {/* TAB: SAVED OPPORTUNITIES (USER-OWNED) */}
        {activeTab === 'saved' && (
          <div className="content-container" style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h1 className="type-h1" style={{ fontSize: '1.85rem' }}>Saved Opportunities ({savedOppsList.length})</h1>
              <p className="type-body" style={{ marginTop: '0.2rem', color: 'var(--muted-foreground)' }}>
                Your private bookmarks scored against your career profile.
              </p>
            </div>

            {savedOppsList.length > 0 ? (
              <div className="responsive-grid-3col">
                {savedOppsList.map(opp => (
                  <OpportunityCard
                    key={opp.id || opp.opportunity_id}
                    opportunity={opp}
                    onSelectOp={(o) => setDrawerOp(o)}
                    onPrepareApplication={(o) => setPrepareAppOp(o)}
                    onToggleSave={(id) => toggleSaveApp(id)}
                    isSaved={true}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--card)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-default)' }}>
                <Bookmark size={36} color="var(--primary)" style={{ marginBottom: '0.85rem' }} />
                <h3 className="type-h3">No saved opportunities yet</h3>
                <p className="type-body" style={{ marginTop: '0.35rem', marginBottom: '1.5rem' }}>
                  Explore the catalog and bookmark opportunities you'd like to track or prepare applications for.
                </p>
                <button onClick={() => setActiveTab('explore')} className="action-btn-primary">
                  Browse Opportunities Catalog
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: APPLICATION TRACKER CRM BOARD (USER-OWNED) */}
        {activeTab === 'tracker' && (
          <div className="tab-content-anim content-container" style={{ marginTop: '2rem', maxWidth: '1280px', padding: '0 1.5rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.65rem', fontWeight: '900', color: 'var(--foreground)', marginBottom: '0.3rem' }}>
                Application Pipeline CRM
              </h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                Manage your active applications across Saved, Preparing, Applied, Interview, and Offer stages.
              </p>
            </div>

            <div className="kanban-board-scroll">
              {['saved', 'preparing', 'applied', 'interview', 'offer', 'rejected'].map(st => {
                const colApps = applicationsList.filter(a => a.stage === st || (st === 'saved' && !a.stage));
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
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{app.organization || app.company}</div>
                          
                          <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {st !== 'applied' && (
                              <button 
                                className="action-btn-secondary"
                                style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.5rem' }}
                                onClick={() => handleUpdateAppStage(app.opportunity_id || app.id, 'applied')}
                              >
                                → Applied
                              </button>
                            )}
                            {st !== 'interview' && (
                              <button 
                                className="action-btn-secondary"
                                style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.5rem' }}
                                onClick={() => handleUpdateAppStage(app.opportunity_id || app.id, 'interview')}
                              >
                                → Interview
                              </button>
                            )}
                          </div>

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

        {/* TAB: AI CV STUDIO & ATS ENHANCER */}
        {activeTab === 'cv_studio' && (
          <div className="tab-content-anim">
            <CvStudio userProfile={careerProfile} triggerToast={triggerToast} />
          </div>
        )}

        {/* TAB: AI MOCK INTERVIEW COACH */}
        {activeTab === 'interview' && (
          <div className="tab-content-anim">
            <InterviewCoach userProfile={careerProfile} triggerToast={triggerToast} />
          </div>
        )}

        {/* TAB: DEADLINES TIMELINE */}
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

            {opportunities.slice(0, 15).map(op => (
              <div key={op.id} style={{ background: 'var(--card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '800', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} /> Deadline: {op.deadline_utc || 'Open Intake'}
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--foreground)' }}>{op.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>{op.organization || op.company} • {op.location_country}</div>
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

        {/* TAB: SETTINGS VIEW */}
        {activeTab === 'settings' && isAuthenticated && (
          <SettingsView triggerToast={triggerToast} />
        )}

        {/* TAB: ADMIN OPERATIONS (ADMIN ONLY) */}
        {activeTab === 'admin' && isAdmin && (
          <AdminDashboard triggerToast={triggerToast} />
        )}

      </main>

      {/* Modern Careerly Footer */}
      <Footer onNavigateTab={(tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

      </div> {/* saas-content-canvas */}
    </div> {/* saas-main */}

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        triggerToast={triggerToast}
      />

      {/* Dynamic AI Question Modal */}
      <AIQuestionModal 
        isOpen={Boolean(activeQuestion)}
        questionData={activeQuestion}
        onAnswerSelected={handleAnswerQuestion}
        onSkip={handleSkipQuestion}
      />

      {/* Transparent Search Progress Experience */}
      <SearchProgressExperience 
        isActive={isSearchingPipeline}
      />

      {/* Application Readiness Kit Drawer */}
      {prepareAppOp && (
        <ApplicationKitDrawer 
          opportunity={prepareAppOp}
          userProfile={careerProfile || {}}
          onClose={() => setPrepareAppOp(null)}
          onApplied={(opId, st) => handleUpdateAppStage(opId, st)}
          triggerToast={triggerToast}
        />
      )}

      {/* Slide-Over Inspection Drawer */}
      {drawerOp && (
        <OpportunityDrawer 
          opportunity={drawerOp}
          onClose={() => setDrawerOp(null)}
          onToggleSave={(id) => toggleSaveApp(id)}
          isSaved={isOpportunitySaved(drawerOp.id)}
          onAutoApply={(op) => { setPrepareAppOp(op); setDrawerOp(null); }}
          onEmailOutreach={(op) => { setEmailOutreachOp(op); setDrawerOp(null); }}
          triggerToast={triggerToast}
        />
      )}

      {/* Evidence Inspector Modal */}
      {inspectingEvidenceOp && (
        <EvidenceInspectorModal 
          opportunity={inspectingEvidenceOp}
          evidenceList={inspectingEvidenceOp.evidence_records}
          onClose={() => setInspectingEvidenceOp(null)}
        />
      )}

      {/* Email Outreach Modal */}
      {emailOutreachOp && (
        <EmailOutreachModal 
          opportunity={emailOutreachOp}
          userProfile={careerProfile || {}}
          onClose={() => setEmailOutreachOp(null)}
          triggerToast={triggerToast}
        />
      )}

      {/* Floating 24/7 AI Career Copilot */}
      <AiCareerCopilot userProfile={careerProfile || {}} triggerToast={triggerToast} />

      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed',
          bottom: '2rem',
          left: '2rem',
          background: 'var(--card)',
          border: '1px solid var(--border-default)',
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

export default function App() {
  return (
    <AuthProvider>
      <CareerlyPlatform />
    </AuthProvider>
  );
}
