import React, { useState, useEffect, useRef } from 'react';
import { 
  BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, Link 
} from 'react-router-dom';
import { 
  Compass, CheckSquare, Calendar, ShieldCheck, User, Search, 
  LayoutGrid, List, Sun, Moon, RefreshCw, Sparkles, Filter, 
  Megaphone, Zap, Mail, CheckCircle, Scale, Building2, MapPin, Clock, Coins, 
  ArrowRight, ExternalLink, Menu, X, Globe, Award, Briefcase, GraduationCap, 
  ChevronLeft, ChevronRight, FileText, Mic, Bot, LogOut, Settings, Bookmark, CheckCircle2
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import AdminRoute from './components/Auth/AdminRoute.jsx';
import PublicOnlyRoute from './components/Auth/PublicOnlyRoute.jsx';
import AuthModal from './components/Auth/AuthModal.jsx';
import AuthScreen from './components/Auth/AuthScreen.jsx';
import OnboardingWizard from './components/Onboarding/OnboardingWizard.jsx';
import PublicLandingView from './components/Landing/PublicLandingView.jsx';
import PersonalizedDashboard from './components/Dashboard/PersonalizedDashboard.jsx';
import SettingsView from './components/Settings/SettingsView.jsx';
import NotFoundPage from './components/NotFoundPage.jsx';

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
import { API_BASE_URL, API_V3_URL } from './config/api.js';

function CareerlyWorkspace({ activeTab, theme, toggleTheme, triggerToast }) {
  const { 
    user, 
    careerProfile, 
    searchProfile, 
    isAuthenticated, 
    isAdmin, 
    needsOnboarding, 
    logout 
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeOpportunityId } = useParams();

  const [opportunities, setOpportunities] = useState([]);
  const [savedOppsList, setSavedOppsList] = useState([]);
  const [applicationsList, setApplicationsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('all');
  
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Evidence & Search State
  const [inspectingEvidenceOp, setInspectingEvidenceOp] = useState(null);
  const [searchFunnelMetrics, setSearchFunnelMetrics] = useState(null);
  const [searchRelaxationOptions, setSearchRelaxationOptions] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [cvMatchedContext, setCvMatchedContext] = useState(null);
  const itemsPerPage = 9;
  const feedTopRef = useRef(null);

  // Modals & Slide-Over Drawers
  const [drawerOp, setDrawerOp] = useState(null);
  const [prepareAppOp, setPrepareAppOp] = useState(null);
  const [emailOutreachOp, setEmailOutreachOp] = useState(null);

  // Conversational AI Search State
  const [isSearchingPipeline, setIsSearchingPipeline] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [searchProfileContext, setSearchProfileContext] = useState(null);
  const [pendingQuery, setPendingQuery] = useState('');
  const [searchSummaryBadge, setSearchSummaryBadge] = useState('');

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

  // Deep-link opportunity handling: /opportunities/:id
  useEffect(() => {
    if (routeOpportunityId && opportunities.length > 0) {
      const found = opportunities.find(o => String(o.id) === String(routeOpportunityId));
      if (found) {
        setDrawerOp(found);
      }
    }
  }, [routeOpportunityId, opportunities]);

  // Toggle Save Opportunity
  const toggleSaveApp = async (opportunityId) => {
    if (!isAuthenticated) {
      navigate('/register');
      triggerToast('Create a free account to save opportunities to your dashboard.');
      return;
    }

    const id = typeof opportunityId === 'object' && opportunityId !== null 
      ? (opportunityId.id || opportunityId.opportunity_id) 
      : opportunityId;
    if (!id) return;

    const token = localStorage.getItem('careerly_token');
    const isCurrentlySaved = savedOppsList.some(s => s.id === id || s.opportunity_id === id);

    try {
      if (isCurrentlySaved) {
        setSavedOppsList(prev => prev.filter(s => s.id !== id && s.opportunity_id !== id));
        await fetch(`${API_BASE_URL}/user/saved/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        triggerToast('Removed from saved opportunities.');
      } else {
        const opp = typeof opportunityId === 'object' && opportunityId !== null
          ? opportunityId
          : opportunities.find(o => o.id === id);
        if (opp) setSavedOppsList(prev => [opp, ...prev]);
        await fetch(`${API_BASE_URL}/user/saved/${id}`, {
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
      navigate('/register');
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
      const res = await fetch(`${API_V3_URL}/search/intent`, {
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
      const res = await fetch(`${API_V3_URL}/search/execute`, {
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

  const handleNavigateFromCvToDiscover = async (role, suggestedRoles = [], skills = [], cvText = '') => {
    setCvMatchedContext({ role, suggestedRoles, skills, cvText });
    setSelectedPreset('all');
    navigate('/opportunities');
    triggerToast(`🎯 Searching opportunities matched to CV: ${role}`);
    
    setIsSearchingPipeline(true);
    try {
      const res = await fetch(`${API_V3_URL}/search/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${role} ${skills.slice(0, 4).join(' ')}`,
          user_profile: {
            ...careerProfile,
            target_role: role,
            skills: skills
          }
        })
      });
      const data = await res.json();
      if (data.results) {
        setOpportunities(data.results);
        setSearchSummaryBadge(`CV Match: "${role}" (${data.results.length} opportunities)`);
        setCurrentPage(1);
      }
    } catch (e) {
      console.warn('CV Search note:', e.message);
    } finally {
      setIsSearchingPipeline(false);
    }
  };

  const handleRelaxConstraint = async (constraintKey, optVal) => {
    if (!searchProfileContext) return;
    const relaxed = { ...searchProfileContext };
    if (constraintKey === 'location') relaxed.locations = [];
    if (constraintKey === 'type') relaxed.types = [];
    if (constraintKey === 'min_salary') delete relaxed.min_salary;
    await executeFinalSearch(pendingQuery, relaxed);
    triggerToast(`Re-running search with relaxed ${constraintKey} filter...`);
  };

  // Filter & Pagination Logic
  const filteredOpportunities = opportunities.filter(op => {
    if (selectedPreset === 'all') return true;
    if (selectedPreset === 'advertising') {
      const text = `${op.title} ${op.category} ${op.role_family || ''} ${op.description}`.toLowerCase();
      return text.includes('advertis') || text.includes('market') || text.includes('brand') || text.includes('creative') || text.includes('copywrit') || text.includes('media');
    }
    if (selectedPreset === 'scholarships') return op.category === 'scholarship' || op.opportunity_type === 'scholarship';
    if (selectedPreset === 'internships') return op.category === 'internship' || op.opportunity_type === 'internship';
    if (selectedPreset === 'fellowships') return op.category === 'fellowship' || op.opportunity_type === 'fellowship';
    if (selectedPreset === 'remote') return op.location_modality === 'remote' || op.is_remote === 1;
    return true;
  });

  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const paginatedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (feedTopRef.current) feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const displayName = careerProfile?.full_name || user?.full_name || (user?.email ? user.email.split('@')[0] : 'Guest Member');
  const displayEmail = user?.email || 'guest@careerly.io';
  const userInitial = displayName.charAt(0).toUpperCase();

  const tabTitles = {
    landing: 'Home',
    dashboard: 'Workspace Overview',
    explore: 'Opportunity Discovery',
    saved: 'Saved Opportunities',
    tracker: 'Application CRM',
    cv_studio: 'AI CV Studio & ATS Tailor',
    interview: 'STAR Interview Coach',
    calendar: 'Deadlines Timeline',
    settings: 'Account & Security Settings',
    admin: 'Enterprise Security Operations'
  };

  return (
    <div className="saas-workspace">
      {/* 1. SIDEBAR (AUTHENTICATED) */}
      {isAuthenticated && (
        <>
          {mobileMenuOpen && (
            <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
          )}

          <aside className={`saas-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Sidebar Header */}
            <div className="sidebar-header">
              <Link to="/dashboard" className="sidebar-brand">
                <div className="sidebar-logo">
                  <img src="/careerly-logo.png" alt="Careerly Logo" />
                </div>
                <div className="sidebar-brand-name">
                  Careerly
                  <span className="sidebar-plan-tag">SAAS</span>
                </div>
              </Link>

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
              
              {/* WORKSPACE */}
              <div>
                <div className="sidebar-section-title">Workspace</div>
                <div className="sidebar-nav-list">
                  <button 
                    className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Sparkles size={17} />
                      <span>Overview</span>
                    </div>
                  </button>

                  <button 
                    className={`sidebar-nav-item ${activeTab === 'explore' ? 'active' : ''}`}
                    onClick={() => { navigate('/opportunities'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Compass size={17} />
                      <span>Opportunities</span>
                    </div>
                  </button>

                  <button 
                    className={`sidebar-nav-item ${activeTab === 'saved' ? 'active' : ''}`}
                    onClick={() => { navigate('/saved'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Bookmark size={17} />
                      <span>Saved</span>
                    </div>
                    {savedOppsList.length > 0 && (
                      <span className="sidebar-badge">{savedOppsList.length}</span>
                    )}
                  </button>

                  <button 
                    className={`sidebar-nav-item ${activeTab === 'tracker' ? 'active' : ''}`}
                    onClick={() => { navigate('/applications'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <CheckSquare size={17} />
                      <span>Applications</span>
                    </div>
                    {applicationsList.length > 0 && (
                      <span className="sidebar-badge">{applicationsList.length}</span>
                    )}
                  </button>

                  <button 
                    className={`sidebar-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => { navigate('/calendar'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Calendar size={17} />
                      <span>Deadlines</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* CAREER TOOLS */}
              <div>
                <div className="sidebar-section-title">Career Tools</div>
                <div className="sidebar-nav-list">
                  <button 
                    className={`sidebar-nav-item ${activeTab === 'cv_studio' ? 'active' : ''}`}
                    onClick={() => { navigate('/cv-studio'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <FileText size={17} />
                      <span>CV Studio & ATS</span>
                    </div>
                  </button>

                  <button 
                    className={`sidebar-nav-item ${activeTab === 'interview' ? 'active' : ''}`}
                    onClick={() => { navigate('/interview'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Mic size={17} />
                      <span>Interview Coach</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* ACCOUNT & SECURITY */}
              <div>
                <div className="sidebar-section-title">Account</div>
                <div className="sidebar-nav-list">
                  <button 
                    className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                  >
                    <div className="sidebar-nav-item-left">
                      <Settings size={17} />
                      <span>Profile & Settings</span>
                    </div>
                  </button>

                  {isAdmin && (
                    <button 
                      className={`sidebar-nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                      onClick={() => { navigate('/admin/security'); setMobileMenuOpen(false); }}
                    >
                      <div className="sidebar-nav-item-left">
                        <ShieldCheck size={17} color="var(--primary)" />
                        <span>Security Operations</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar User Footer */}
            <div className="sidebar-footer">
              <div 
                className="sidebar-user-pill"
                onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/settings');
                    setMobileMenuOpen(false);
                  }
                }}
                title="Account Settings"
                style={{ cursor: 'pointer' }}
              >
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
                  onClick={() => { logout(); navigate('/login'); triggerToast('Signed out of Careerly.'); }} 
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
        
        {/* Top Header Bar */}
        {!isAuthenticated ? (
          <>
            <header className="brainwave-navbar">
              <Link to="/" style={{ textDecoration: 'none' }}>
                <div className="sidebar-brand" style={{ cursor: 'pointer' }}>
                  <div className="sidebar-logo">
                    <img src="/careerly-logo.png" alt="Careerly Logo" />
                  </div>
                  <div className="sidebar-brand-name" style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    Careerly
                    <span className="sidebar-plan-tag" style={{ marginLeft: '0.4rem' }}>
                      INTELLIGENCE
                    </span>
                  </div>
                </div>
              </Link>

              {/* Modern Centered Navigation Links */}
              <nav className="brainwave-nav-center">
                <Link to="/opportunities" className="brainwave-nav-link" style={{ textDecoration: 'none' }}>
                  Browse Catalog
                </Link>
                <button 
                  className="brainwave-nav-link" 
                  onClick={() => {
                    navigate('/');
                    setTimeout(() => {
                      const el = document.getElementById('features-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Features
                </button>
                <Link to="/register" className="brainwave-nav-link" style={{ textDecoration: 'none' }}>
                  AI CV Studio
                </Link>
                <Link to="/register" className="brainwave-nav-link" style={{ textDecoration: 'none' }}>
                  STAR Coach
                </Link>
              </nav>

              {/* Right Side Actions & Mobile Menu Toggle */}
              <div className="brainwave-nav-actions">
                <button 
                  className="icon-button" 
                  onClick={toggleTheme} 
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  style={{ width: '40px', height: '40px' }}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <Link
                  to="/login"
                  className="brainwave-btn-outline brainwave-desktop-only"
                  style={{ height: '42px', padding: '0 1.4rem', fontSize: '0.86rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="brainwave-btn-glow brainwave-nav-cta"
                  style={{ height: '42px', padding: '0 1.4rem', fontSize: '0.86rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  <span>Get Started</span>
                  <ArrowRight size={15} className="btn-arrow-icon" />
                </Link>

                <button
                  className="brainwave-hamburger-btn"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Navigation"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </header>

            {/* Mobile Navigation Dropdown */}
            {mobileMenuOpen && (
              <div className="brainwave-mobile-menu">
                <div className="brainwave-mobile-nav-list">
                  <Link to="/opportunities" className="brainwave-mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    Browse Catalog
                  </Link>
                  <Link to="/login" className="brainwave-mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    AI CV Studio
                  </Link>
                  <Link to="/login" className="brainwave-mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    STAR Coach
                  </Link>
                </div>
                <div className="brainwave-mobile-menu-actions">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="brainwave-btn-outline"
                    style={{ width: '100%', height: '44px', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="brainwave-btn-glow"
                    style={{ width: '100%', height: '44px', justifyContent: 'center', textDecoration: 'none' }}
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <header className="saas-header">
            <div className="saas-header-left">
              <button 
                className="saas-hamburger-trigger icon-button" 
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Navigation Menu"
              >
                <Menu size={18} />
              </button>

              <nav className="saas-breadcrumbs" aria-label="Breadcrumb">
                <span className="breadcrumb-root">Careerly</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-active active">{tabTitles[activeTab] || 'Workspace'}</span>
              </nav>
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
            onOpenAuth={(mode) => navigate(mode === 'signup' ? '/register' : '/login')}
            sampleOpportunities={opportunities}
            onSelectOpportunity={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
            onPrepareKit={(op) => setPrepareAppOp(op)}
            onSaveOpportunity={(opId) => toggleSaveApp(opId)}
            isSaved={isOpportunitySaved}
            triggerToast={triggerToast}
          />
        )}

        {/* TAB: PERSONALIZED DASHBOARD (AUTHENTICATED) */}
        {activeTab === 'dashboard' && (
          <PersonalizedDashboard 
            onSelectOpportunity={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
            onPrepareKit={(op) => setPrepareAppOp(op)}
            onSaveOpportunity={(opId) => toggleSaveApp(opId)}
            isSaved={isOpportunitySaved}
            onNavigateTab={(tab) => { 
              const routes = {
                explore: '/opportunities',
                saved: '/saved',
                tracker: '/applications',
                cv_studio: '/cv-studio',
                interview: '/interview',
                calendar: '/calendar',
                settings: '/settings',
                admin: '/admin/security'
              };
              navigate(routes[tab] || '/dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }}
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
              
              {/* Dedicated CV-to-Jobs Filter Banner */}
              {cvMatchedContext && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(31, 228, 119, 0.14) 0%, rgba(56, 189, 248, 0.1) 100%)',
                  border: '1.5px solid #1FE477',
                  borderRadius: 'var(--radius-2xl)',
                  padding: '1.15rem 1.5rem',
                  marginBottom: '1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  boxShadow: '0 0 30px rgba(31, 228, 119, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1FE477', color: '#06070a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '900', flexShrink: 0, boxShadow: '0 0 16px rgba(31, 228, 119, 0.5)' }}>
                      🎯
                    </div>
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '1.02rem', color: 'var(--foreground)', fontFamily: "'Space Grotesk', sans-serif" }}>
                        Tailored Opportunities for CV: <span style={{ color: '#1FE477' }}>{cvMatchedContext.role}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)' }}>
                        Verified positions matched to your extracted qualifications and career trajectory.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ height: '36px', fontSize: '0.82rem', padding: '0 0.85rem' }}
                      onClick={() => { setCvMatchedContext(null); setSearchSummaryBadge(''); fetchOpportunities(''); }}
                    >
                      Clear CV Filter
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ height: '36px', fontSize: '0.82rem', padding: '0 0.95rem' }}
                      onClick={() => navigate('/cv-studio')}
                    >
                      Return to CV Studio
                    </button>
                  </div>
                </div>
              )}

              {/* Active Search Summary Badge */}
              {searchSummaryBadge && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card)', border: '1px solid var(--primary)', color: 'var(--foreground)', padding: '0.45rem 1.25rem', borderRadius: 'var(--radius-full)', fontSize: '0.84rem', fontWeight: '800', margin: '0 auto 1.75rem', boxShadow: 'var(--shadow-sm)' }}>
                  <Sparkles size={15} color="var(--primary)" /> {searchSummaryBadge}
                  <button 
                    onClick={() => { setSearchSummaryBadge(''); setCvMatchedContext(null); fetchOpportunities(''); }} 
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
                  className={`cat-pill ${selectedPreset === 'internships' ? 'active' : ''}`}
                  onClick={() => setSelectedPreset(selectedPreset === 'internships' ? 'all' : 'internships')}
                >
                  <Briefcase size={14} /> Internships & Traineeships
                </button>
                <button 
                  className={`cat-pill ${selectedPreset === 'scholarships' ? 'active' : ''}`}
                  onClick={() => setSelectedPreset(selectedPreset === 'scholarships' ? 'all' : 'scholarships')}
                >
                  <GraduationCap size={14} /> Global Scholarships
                </button>
                <button 
                  className={`cat-pill ${selectedPreset === 'fellowships' ? 'active' : ''}`}
                  onClick={() => setSelectedPreset(selectedPreset === 'fellowships' ? 'all' : 'fellowships')}
                >
                  <Award size={14} /> Fellowships & Grants
                </button>
                <button 
                  className={`cat-pill ${selectedPreset === 'remote' ? 'active' : ''}`}
                  onClick={() => setSelectedPreset(selectedPreset === 'remote' ? 'all' : 'remote')}
                >
                  <Globe size={14} /> Worldwide & Remote
                </button>
              </div>

              {/* View Layout Controls & Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Showing</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>{filteredOpportunities.length}</span>
                  <span>verified opportunities</span>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--card)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`icon-button ${viewMode === 'grid' ? 'active' : ''}`}
                    style={{ width: '32px', height: '32px', borderRadius: '6px' }}
                    title="Grid View"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`icon-button ${viewMode === 'list' ? 'active' : ''}`}
                    style={{ width: '32px', height: '32px', borderRadius: '6px' }}
                    title="List View"
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>

              {/* Feed Grid or List */}
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--muted-foreground)' }}>
                  <RefreshCw size={32} className="spin-slow" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: '700' }}>Calibrating live opportunity matches...</p>
                </div>
              ) : viewMode === 'grid' ? (
                <OpportunityGridView 
                  opportunities={paginatedOpportunities}
                  onSelectOp={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
                  onToggleSave={(oppId) => toggleSaveApp(oppId)}
                  onPrepareApplication={(op) => setPrepareAppOp(op)}
                  onInspectEvidence={(op) => setInspectingEvidenceOp(op)}
                  onRelaxConstraint={handleRelaxConstraint}
                  savedIds={savedOppsList.map(s => s.id || s.opportunity_id)}
                />
              ) : (
                <OpportunityListView 
                  opportunities={paginatedOpportunities}
                  onSelectOp={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
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
                    onSelectOp={(o) => { setDrawerOp(o); navigate(`/opportunities/${o.id}`); }}
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
                <button onClick={() => navigate('/opportunities')} className="action-btn-primary">
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

            {applicationsList.length === 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--foreground)' }}>Your CRM pipeline is ready</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Save opportunities or launch application prep kits to track your multi-stage progress here.</div>
                  </div>
                </div>
                <button onClick={() => navigate('/opportunities')} className="action-btn-primary" style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}>
                  Discover Opportunities
                </button>
              </div>
            )}

            <div className="crm-board">
              {[
                { key: 'saved', label: 'Saved', color: '#94a3b8' },
                { key: 'preparing', label: 'Preparing', color: 'var(--accent-purple)' },
                { key: 'applied', label: 'Applied', color: 'var(--accent-blue)' },
                { key: 'interview', label: 'Interview', color: 'var(--accent-amber)' },
                { key: 'offer', label: 'Offer', color: 'var(--accent-emerald)' },
                { key: 'rejected', label: 'Archived', color: 'var(--accent-danger)' }
              ].map(({ key: st, label, color }) => {
                const colApps = applicationsList.filter(a => a.stage === st || (st === 'saved' && !a.stage));
                return (
                  <div key={st} className="crm-column">
                    <div className="crm-col-header">
                      <div className="crm-col-title">
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                        <span>{label}</span>
                      </div>
                      <span className="crm-col-count">{colApps.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {colApps.map(app => (
                        <div key={app.id} className="crm-card">
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: '0.2rem', lineHeight: '1.3' }}>
                            {app.title}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                            {app.organization || app.company || 'Enterprise'}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                            {st !== 'applied' && (
                              <button 
                                className="btn btn-outline"
                                style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.5rem' }}
                                onClick={() => handleUpdateAppStage(app.opportunity_id || app.id, 'applied')}
                              >
                                → Applied
                              </button>
                            )}
                            {st !== 'interview' && (
                              <button 
                                className="btn btn-outline"
                                style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.5rem' }}
                                onClick={() => handleUpdateAppStage(app.opportunity_id || app.id, 'interview')}
                              >
                                → Interview
                              </button>
                            )}
                            {st !== 'offer' && (
                              <button 
                                className="btn btn-outline"
                                style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.5rem' }}
                                onClick={() => handleUpdateAppStage(app.opportunity_id || app.id, 'offer')}
                              >
                                → Offer
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.45rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <button 
                              className="btn btn-emerald"
                              style={{ fontSize: '0.75rem', height: '28px', padding: '0 0.65rem', flex: 1 }}
                              onClick={() => setPrepareAppOp(app)}
                            >
                              <Zap size={12} /> Prep Kit
                            </button>
                            <button 
                              className="btn btn-outline"
                              style={{ fontSize: '0.75rem', height: '28px', padding: '0 0.65rem' }}
                              onClick={() => { setDrawerOp(app); navigate(`/opportunities/${app.opportunity_id || app.id}`); }}
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
            <CvStudio 
              userProfile={careerProfile} 
              triggerToast={triggerToast}
              onNavigateToDiscover={handleNavigateFromCvToDiscover}
              onSelectOpportunity={(op) => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}
              onPrepareKit={(op) => setPrepareAppOp(op)}
              onToggleSave={(id) => toggleSaveApp(id)}
              isOpportunitySaved={(id) => isOpportunitySaved(id)}
            />
        )}

        {/* TAB: AI MOCK INTERVIEW COACH */}
        {activeTab === 'interview' && (
          <div className="tab-content-anim">
            <InterviewCoach userProfile={careerProfile} triggerToast={triggerToast} />
          </div>
        )}

        {/* TAB: DEADLINES TIMELINE */}
        {activeTab === 'calendar' && (
          <div className="content-container" style={{ maxWidth: '860px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--foreground)', marginBottom: '0.3rem' }}>
                Application Deadlines Timeline
              </h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                Chronological schedule of intake cut-offs and verified submission deadlines.
              </p>
            </div>

            {opportunities.length > 0 ? (
              opportunities.slice(0, 15).map(op => {
                const isRolling = !op.deadline_utc || op.deadline_utc.toLowerCase().includes('open') || op.deadline_utc.toLowerCase().includes('rolling');
                return (
                  <div key={op.id} className="bento-card" style={{ marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.76rem', color: isRolling ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: '700', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} /> {isRolling ? 'Rolling Intake / Open Submissions' : `Submission Deadline: ${op.deadline_utc}`}
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.96rem', color: 'var(--text-primary)' }}>{op.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{op.organization || op.company || 'Enterprise'} • {op.location_country || 'Global'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-emerald" style={{ fontSize: '0.78rem', height: '32px' }} onClick={() => setPrepareAppOp(op)}>
                        <Zap size={13} /> Prepare Kit
                      </button>
                      <button className="btn btn-outline" style={{ fontSize: '0.78rem', height: '32px' }} onClick={() => { setDrawerOp(op); navigate(`/opportunities/${op.id}`); }}>
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'var(--card)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-default)' }}>
                <Calendar size={36} color="var(--primary)" style={{ marginBottom: '0.85rem' }} />
                <h3 className="type-h3">No upcoming deadlines found</h3>
                <p className="type-body" style={{ marginTop: '0.35rem' }}>
                  Explore active opportunities to track upcoming deadlines and intake schedules.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <SettingsView triggerToast={triggerToast} />
        )}

        {/* TAB: ADMIN OPERATIONS (ADMIN ONLY) */}
        {activeTab === 'admin' && (
          <AdminDashboard triggerToast={triggerToast} />
        )}

      </main>

      {/* Modern Careerly Footer */}
      <Footer onNavigateTab={(tab) => { 
        const routes = {
          explore: '/opportunities',
          saved: '/saved',
          tracker: '/applications',
          cv_studio: '/cv-studio',
          interview: '/interview',
          calendar: '/calendar',
          settings: '/settings',
          admin: '/admin/security'
        };
        navigate(routes[tab] || '/'); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
      }} />

      </div> {/* saas-content-canvas */}
    </div> {/* saas-main */}

      {/* Slide-Over Inspection Drawer */}
      {drawerOp && (
        <OpportunityDrawer 
          opportunity={drawerOp}
          onClose={() => { setDrawerOp(null); if (routeOpportunityId) navigate('/opportunities'); }}
          onToggleSave={(id) => toggleSaveApp(id)}
          isSaved={isOpportunitySaved(drawerOp.id)}
          onAutoApply={(op) => { setPrepareAppOp(op); setDrawerOp(null); }}
          onEmailOutreach={(op) => { setEmailOutreachOp(op); setDrawerOp(null); }}
          triggerToast={triggerToast}
        />
      )}

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
      {!drawerOp && !prepareAppOp && !emailOutreachOp && !inspectingEvidenceOp && !authModalOpen && !activeQuestion && (
        <AiCareerCopilot userProfile={careerProfile || {}} triggerToast={triggerToast} />
      )}
    </div>
  );
}

function HomeRoute({ theme, toggleTheme, triggerToast }) {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) {
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <CareerlyWorkspace activeTab="landing" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('opp_theme') || 'dark');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Home & Landing */}
          <Route path="/" element={
            <HomeRoute theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
          } />

          {/* Authentication Dedicated Pages */}
          <Route path="/login" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />
          <Route path="/register" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route path="/verify-email" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />
          <Route path="/reset-password" element={
            <PublicOnlyRoute>
              <AuthScreen triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
            </PublicOnlyRoute>
          } />

          {/* 4-Step Academic & Career Calibration Onboarding */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingWizard triggerToast={triggerToast} onComplete={() => window.location.href = '/dashboard'} />
            </ProtectedRoute>
          } />

          {/* Authenticated Core Workspace Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="dashboard" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />

          {/* Public & Authenticated Opportunity Discovery */}
          <Route path="/opportunities" element={
            <CareerlyWorkspace activeTab="explore" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
          } />
          <Route path="/opportunities/:id" element={
            <CareerlyWorkspace activeTab="explore" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
          } />

          {/* Authenticated Feature Routes */}
          <Route path="/applications" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="tracker" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/saved" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="saved" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/cv-studio" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="cv_studio" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/interview" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="interview" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="calendar" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="settings" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <CareerlyWorkspace activeTab="settings" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </ProtectedRoute>
          } />

          {/* Administrative Security Operations Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <CareerlyWorkspace activeTab="admin" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </AdminRoute>
          } />
          <Route path="/admin/*" element={
            <AdminRoute>
              <CareerlyWorkspace activeTab="admin" theme={theme} toggleTheme={toggleTheme} triggerToast={triggerToast} />
            </AdminRoute>
          } />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div 
            role="status" 
            aria-live="polite" 
            className="toast-entrance-slide"
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '2rem',
              background: 'var(--card)',
              border: '1px solid var(--border-default)',
              color: 'var(--foreground)',
              padding: '0.75rem 1.15rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg), 0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              zIndex: 4000,
              fontSize: '0.86rem',
              fontWeight: '700',
              backdropFilter: 'blur(16px)',
              maxWidth: '90vw'
            }}
          >
            <CheckCircle size={17} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{toastMessage}</span>
            <button 
              onClick={() => setToastMessage('')}
              style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', marginLeft: '0.25rem' }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </AuthProvider>
    </BrowserRouter>
  );
}
